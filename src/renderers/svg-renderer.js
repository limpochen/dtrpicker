/**
 * SvgRenderer — SVG renderer
 *
 * Encapsulates all of dtrPicker's SVG rendering logic, including DOM creation,
 * calendar rendering, and drag/wheel event management. The main class operates
 * on the SVG content through this renderer interface without touching
 * SVG implementation details.
 */

import { getActiveScheme, HARDCODED } from '../config/colors.js';
import { DIM } from '../config/dimensions.js';
import { saturateColor, blendColors } from '../utils/color.js';
import DateTime from '../utils/date.js';
import DragController from '../services/drag-controller.js';

import Cell from './cells/cell.js';
import DayCell from './cells/day-cell.js';
import MonthCell from './cells/month-cell.js';
import YearCell from './cells/year-cell.js';
import HeaderCell from './cells/header-cell.js';
import HeaderBarCell from './cells/header-bar-cell.js';
import TimeCell from './cells/time-cell.js';
import TitleBarCell from './cells/title-bar-cell.js';
import DrawingArea from './drawing-area.js';
import CellManager from './cell-manager.js';
import TimeWheel from './time-wheel/time-wheel.js';

class SvgRenderer {
  /**
   * @param {dtrPicker} picker - main instance reference
   */
  constructor(picker) {
    this.picker = picker;
    this.options = picker.options;
    this.value = picker.value;
    this._i18n = picker._i18n;

    // SVG DOM elements
    /** @type {HTMLDivElement|null} */
    this.container = null;
    /** @type {HTMLDivElement|null} */
    this.panel = null;
    /** @type {SVGSVGElement|null} */
    this.svg = null;
    /** @type {SVGRectElement|null} */
    this.svgBg = null;
    /** @type {SVGGElement|null} */
    this.yearGroup = null;
    /** @type {SVGGElement|null} */
    this.todayBtnGroup = null;
    /** @type {string} */
    this.svgNS = 'http://www.w3.org/2000/svg';

    // Grid constants (CELL_W comes from DIM.CELL_W; STEP_X/STEP_Y are computed in createPanel)
    this.CELL_W = 0;
    this.CELL_H = DIM.CELL_H;
    this.GAP = DIM.GAP;
    this.STEP_X = 0;
    this.STEP_Y = 0;
    /** Whether the sidebar (year/month column) is shown. */
    this._hasSidebar = this.options.yearMonthMode === 'column';
    this.SIDEBAR_COLS = this._hasSidebar ? DIM.SIDEBAR_COLS : 0;
    this.DATE_COL_START = this._hasSidebar ? DIM.DATE_COL_START : 0;
    this.DATE_COLS = DIM.DATE_COLS;
    this.TIME_COL_START = this.SIDEBAR_COLS + this.DATE_COLS;
    this.TIME_COLS = DIM.TIME_COLS;
    this.SVG_H = 0;
    this.SVG_W = 0;
    this.HEADER_ROW = DIM.HEADER_ROW;
    this.VISIBLE_DATE_ROWS = DIM.VISIBLE_DATE_ROWS;
    this.BUFFER_ROWS = DIM.BUFFER_ROWS;

    // Drawing areas
    /** @type {DrawingArea|null} */
    this.calendarArea = null;
    /** @type {DrawingArea|null} */
    this.timeArea = null;
    /** @type {DrawingArea|null} */
    this.headerArea = null;

    // Dragging
    /** @type {DragController} */
    this.dragController = new DragController();
    /** @type {boolean} */
    this._dragging = false;
    /** @type {number} */
    this._dragStartY = 0;
    /** @type {number} */
    this._dragStartTY = 0;
    /** @type {number} */
    this._dragLastDY = 0;
    /** @type {number|undefined} */
    this._lastDragClientY = undefined;
    /** @type {boolean} */
    this._hoverDisabled = false;

    // Wheel animation
    /** @type {number|null} */
    this._wheelAnimId = null;
    /** @type {number|null} */
    this._lastRenderRow = null;

    // Cell management
    /** @type {CellManager} */
    this.cellManager = new CellManager();

    // Header
    /** @type {HeaderCell[]} */
    this._headerCells = [];
    /** @type {HeaderBarCell|null} */
    this.headerBarCell = null;

    // Time wheel
    /** @type {TimeWheel|null} */
    this.timeWheel = null;

    // ── Scroll/render state migrated from PickerState ──
    /** @type {number} Current vertical scroll offset (px). */
    this._translateY = 0;
    /** @type {number} Wheel target offset (used for smooth animation). */
    this._wheelTargetY = 0;
    /** @type {number} Random color scheme shift. */
    this._colorShift = Math.floor(Math.random() * 100);
    /** @type {number|null} Currently visible year. */
    this._visibleYear = null;
    /** @type {DateTime|null} Hovered date. */
    this._hoverDate = null;
    /** @type {DateTime} Today (snapshot taken at construction). */
    this._today = DateTime.today();
    /** @type {DateTime} startOfWeekZero anchor. */
    this._startOfWeekZero = this._today.startOfWeek(this.options.firstDay === 0);

    // Expose to picker so Cell subclasses can access it
    this.picker._colorShift = this._colorShift;

    /** Mobile CSS scale factor (1 = no scaling). */
    this._scaleFactor = 1;
  }

  // ════════════════════════════════════════════════════════════════
  //  Panel Creation
  // ════════════════════════════════════════════════════════════════

  /** @private */
  _detectCellW() {
    return DIM.CELL_W;
  }

  /** @private */
  _calcTotalCols() {
    return this.SIDEBAR_COLS + this.DATE_COLS + (this.value.isTimeEnabled ? this.TIME_COLS : 0);
  }

  /** @private */
  _updateSVGSize() {
    const totalCols = this._calcTotalCols();
    this.SVG_W = this.CELL_W * totalCols + this.GAP * (totalCols + 1);
    if (this.svg) {
      this.svg.setAttribute('viewBox', '0 0 ' + this.SVG_W + ' ' + this.SVG_H);
      this.svg.setAttribute('width', this.SVG_W);
      this.svgBg.setAttribute('width', this.SVG_W);
      if (this.picker && this.picker._instanceId) {
        const hdrClip = this.svg.querySelector('#' + this.picker._instanceId + '-hdr-clip > rect');
        if (hdrClip) {
          hdrClip.setAttribute('width', this.SVG_W - this.GAP * 2);
        }
      }
    }
  }

  /**
   * Mobile adaptive scaling.
   *
   * When the mobile SVG total width exceeds the available width, applies
   * CSS transform: scale() to the SVG. The SVG internal coordinate system is
   * unchanged and all drawn elements are unaware of it.
   * This is a GPU compositing-layer operation and does not trigger SVG reflow.
   *
   * Note: only the transform is set; CSS width/height are not modified because
   * getBoundingClientRect() returns post-transform values, so coordinate mapping
   * (_isInDateArea etc.) stays correct automatically.
   * @private
   */
  _applyScale() {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      this._removeScale();
      return;
    }

    // Horizontal safety margin around the panel
    const MARGIN = 16;
    const availableWidth = window.innerWidth - MARGIN * 2;

    if (availableWidth >= this.SVG_W) {
      this._removeScale();
      return;
    }

    const scale = availableWidth / this.SVG_W;
    this._scaleFactor = scale;

    this.svg.style.transformOrigin = '0 0';
    this.svg.style.transform = 'scale(' + scale + ')';

    // Set the panel width to scaledW in sync (panel overflow:hidden clips the overflowing SVG)
    this.panel.style.width = (this.SVG_W * scale) + 'px';
  }

  /** @private */
  _removeScale() {
    if (this._scaleFactor === 1) return;
    this._scaleFactor = 1;
    if (!this.svg) return;
    this.svg.style.transformOrigin = '';
    this.svg.style.transform = '';
    // Restore panel width
    this.panel.style.width = '';
  }

  /**
   * Create the full DOM structure of the dropdown panel and mount it to the body.
   */
  createPanel() {
    this.CELL_W = this._detectCellW();
    this.STEP_X = this.CELL_W + this.GAP;
    this.STEP_Y = this.CELL_H + this.GAP;
    this.SVG_H = this.CELL_H * 9 + this.GAP * 10;
    this._updateSVGSize();

    // Outer container
    this.container = document.createElement('div');
    this.container.className = 'dtrpicker-container';
    this.container.style.position = 'fixed';
    this.container.style.opacity = '0';
    this.container.style.visibility = 'hidden';
    this.container.style.transform = 'translateY(-8px)';
    this.container.style.transition = 'opacity 0.2s, visibility 0.2s, transform 0.2s';

    // Panel
    this.panel = document.createElement('div');
    this.panel.className = 'dtrpicker-panel';
    this.panel.style.background = this.options.cellColor;
    this.panel.style.borderRadius = 0;
    this.panel.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
    this.panel.style.overflow = 'hidden';
    this.panel.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
    this.panel.style.display = 'flex';
    this.panel.style.flexDirection = 'column';
    this.panel.style.touchAction = 'none';

    // SVG
    this.svg = document.createElementNS(this.svgNS, 'svg');
    this.svg.setAttribute('viewBox', '0 0 ' + this.SVG_W + ' ' + this.SVG_H);
    this.svg.setAttribute('width', this.SVG_W);
    this.svg.setAttribute('height', this.SVG_H);
    this.svg.style.display = 'block';
    this.svg.style.webkitTapHighlightColor = 'transparent';
    this.svg.style.touchAction = 'none';
    this.svg.style.userSelect = 'none';

    // Gray background base
    this.svgBg = document.createElementNS(this.svgNS, 'rect');
    this.svgBg.setAttribute('x', '0');
    this.svgBg.setAttribute('y', '0');
    this.svgBg.setAttribute('width', this.SVG_W);
    this.svgBg.setAttribute('height', this.SVG_H);
    this.svgBg.setAttribute('fill', this.options.gridColor);
    this.svg.appendChild(this.svgBg);

    // Grid constants reference
    const totalCols = this._calcTotalCols();
    const gridRef = {
      CELL_W: this.CELL_W, CELL_H: this.CELL_H, GAP: this.GAP,
      STEP_X: this.STEP_X, STEP_Y: this.STEP_Y, svgNS: this.svgNS,
    };

    // Three drawing areas (order: calendar → time → header)
    this.calendarArea = new DrawingArea({
      r: 1, c: 0, rs: 8, cs: this.SIDEBAR_COLS + this.DATE_COLS, scrollable: true,
      parentSvg: this.svg, containerId: this.picker._instanceId + '-calendar',
      grid: gridRef, picker: this.picker,
    });
    this.timeArea = new DrawingArea({
      r: 1, c: this.SIDEBAR_COLS + this.DATE_COLS, rs: 8, cs: 2, scrollable: false,
      parentSvg: this.svg, containerId: this.picker._instanceId + '-time',
      grid: gridRef, picker: this.picker,
    });
    this.headerArea = new DrawingArea({
      r: 0, c: 0, rs: 1, cs: totalCols, scrollable: false,
      parentSvg: this.svg, containerId: this.picker._instanceId + '-header',
      grid: gridRef, picker: this.picker,
    });

    // Calendar area viewport clipping: nested <svg>
    const vpX = this.GAP;
    const vpY = this.GAP + 1 * this.STEP_Y;
    const vpW = (this.SIDEBAR_COLS + this.DATE_COLS) * this.STEP_X - this.GAP;
    const vpH = 8 * this.STEP_Y - this.GAP;
    const viewportSvg = document.createElementNS(this.svgNS, 'svg');
    viewportSvg.setAttribute('x', vpX);
    viewportSvg.setAttribute('y', vpY);
    viewportSvg.setAttribute('width', vpW);
    viewportSvg.setAttribute('height', vpH);
    viewportSvg.setAttribute('viewBox', vpX + ' ' + vpY + ' ' + vpW + ' ' + vpH);
    this.svg.insertBefore(viewportSvg, this.calendarArea.container);
    viewportSvg.appendChild(this.calendarArea.container);

    // defs
    let defs = this.svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(this.svgNS, 'defs');
      this.svg.insertBefore(defs, this.svg.firstChild);
    }

    // Header bar clipping
    const hdrClipId = this.picker._instanceId + '-hdr-clip';
    const hdrClip = document.createElementNS(this.svgNS, 'clipPath');
    hdrClip.setAttribute('id', hdrClipId);
    const hdrClipRect = document.createElementNS(this.svgNS, 'rect');
    hdrClipRect.setAttribute('x', this.GAP);
    hdrClipRect.setAttribute('y', this.GAP);
    hdrClipRect.setAttribute('width', this.SVG_W - this.GAP * 2);
    hdrClipRect.setAttribute('height', this.CELL_H);
    hdrClip.appendChild(hdrClipRect);
    defs.appendChild(hdrClip);
    this.headerArea.container.setAttribute('clip-path', 'url(#' + hdrClipId + ')');

    // Time area clipping
    const timeClipId = this.picker._instanceId + '-time-clip';
    const timeClip = document.createElementNS(this.svgNS, 'clipPath');
    timeClip.setAttribute('id', timeClipId);
    const timeClipRect = document.createElementNS(this.svgNS, 'rect');
    timeClipRect.setAttribute('x', this.GAP + (this.SIDEBAR_COLS + this.DATE_COLS) * this.STEP_X);
    timeClipRect.setAttribute('y', this.GAP + 1 * this.STEP_Y);
    timeClipRect.setAttribute('width', this.TIME_COLS * this.CELL_W + (this.TIME_COLS - 1) * this.GAP);
    timeClipRect.setAttribute('height', 8 * this.STEP_Y - this.GAP);
    timeClip.appendChild(timeClipRect);
    defs.appendChild(timeClip);
    this.timeArea.container.setAttribute('clip-path', 'url(#' + timeClipId + ')');

    // Year animation layer
    this.yearGroup = document.createElementNS(this.svgNS, 'g');
    this.yearGroup.setAttribute('id', this.picker._instanceId + '-year');
    this.svg.appendChild(this.yearGroup);

    // Today button layer
    this.todayBtnGroup = document.createElementNS(this.svgNS, 'g');
    this.todayBtnGroup.setAttribute('id', this.picker._instanceId + '-today-btn');
    this.svg.appendChild(this.todayBtnGroup);

    // Assemble
    this.panel.appendChild(this.svg);
    this.container.appendChild(this.panel);

    // Version label (visibility controlled by DIM.SHOW_VERSION)
    if (DIM.SHOW_VERSION) {
      const verEl = document.createElement('div');
      verEl.textContent = DIM.VERSION;
      verEl.style.cssText = 'position:absolute;bottom:2px;left:4px;font-size:9px;color:#aaa;pointer-events:none;user-select:none;';
      this.container.appendChild(verEl);
    }

    document.body.appendChild(this.container);

    // Sync renderer properties to the main instance (Cell subclasses access them via this.picker.xxx)
    this.picker.svg = this.svg;
    this.picker.SVG_W = this.SVG_W;
    this.picker.yearGroup = this.yearGroup;
    this.picker.headerArea = this.headerArea;
    this.picker.calendarArea = this.calendarArea;
    this.picker._hoverDisabled = this._hoverDisabled;
    this.picker.timeWheel = this.timeWheel;

    // Initial render
    this.renderWeekHeader();
    this.renderCalendar();
    this._initTimeWheel();

    // Mobile adaptive scaling (CSS transform, does not affect SVG internal coordinates)
    this._applyScale();
  }

  // ════════════════════════════════════════════════════════════════
  //  Header Rendering
  // ════════════════════════════════════════════════════════════════

  renderWeekHeader() {
    this.headerArea.clear();

    const grid = {
      CELL_W: this.CELL_W, CELL_H: this.CELL_H, GAP: this.GAP,
      STEP_X: this.STEP_X, STEP_Y: this.STEP_Y, svgNS: this.svgNS,
    };
    const i18n = this._i18n;

    const headerCells = [];
    const hTotalCols = this._calcTotalCols();

    if (this._hasSidebar) {
      headerCells.push(new HeaderCell({
        r: 0, c: 0, rs: 1, cs: 1, grid: grid, picker: this.picker,
        label: i18n.year,
      }));
      headerCells.push(new HeaderCell({
        r: 0, c: 1, rs: 1, cs: 1, grid: grid, picker: this.picker,
        label: i18n.month,
      }));
    }

    if (this.value.isTimeEnabled) {
      headerCells.push(new HeaderCell({
        r: 0, c: this.TIME_COL_START, rs: 1, cs: 1, grid: grid, picker: this.picker,
        label: i18n.hour,
      }));
      headerCells.push(new HeaderCell({
        r: 0, c: this.TIME_COL_START + 1, rs: 1, cs: 1, grid: grid, picker: this.picker,
        label: i18n.minute,
      }));
    }

    const fd = this.options.firstDay || 0;
    const weeks = fd === 0
      ? i18n.weekdays
      : i18n.weekdays.slice(fd).concat(i18n.weekdays.slice(0, fd));
    weeks.forEach(function (w, i) {
      const col = this.DATE_COL_START + i;
      const isWeekend = (this.options.firstDay === 0 && (i === 0 || i === 6))
        || (this.options.firstDay === 1 && (i === 5 || i === 6));
      // Weekend titles use a dedicated color (takes precedence over the weekend date color)
      headerCells.push(new HeaderCell({
        r: 0, c: col, rs: 1, cs: 1, grid: grid, picker: this.picker, label: w,
        colorOverride: isWeekend ? this.options.textColorWeekendTitle : null,
      }));
    }, this);

    this.headerBarCell = new HeaderBarCell({
      r: 0, c: 0, rs: 1, cs: hTotalCols, grid: grid,
      container: this.headerArea.container, picker: this.picker,
    });
    this.headerBarCell.render();

    headerCells.forEach(function (c) { c.render(); });
    this._headerCells = headerCells;
    // Sync to the main instance (HeaderBarCell._sortedColors reads this.picker._headerCells)
    this.picker._headerCells = this._headerCells;
    this.picker.headerBarCell = this.headerBarCell;
  }

  // ════════════════════════════════════════════════════════════════
  //  Calendar Rendering
  // ════════════════════════════════════════════════════════════════

  renderCalendar() {
    const scheme = getActiveScheme(this.options);
    const schemeColors = scheme.colors;
    const schemeLen = schemeColors.length;
    const cs = this._colorShift;

    const TOTAL_ROWS = this.VISIBLE_DATE_ROWS + this.BUFFER_ROWS * 2;
    const startRow = Math.floor(-this._translateY / this.STEP_Y) - this.BUFFER_ROWS;
    this._lastRenderRow = startRow;

    this.calendarArea.clear();
    this.cellManager.clear();
    this.calendarArea.setScroll(this._translateY);

    const grid = {
      CELL_W: this.CELL_W, CELL_H: this.CELL_H, GAP: this.GAP,
      STEP_X: this.STEP_X, STEP_Y: this.STEP_Y, svgNS: this.svgNS,
    };

    const isStartOrEnd = (d) => {
      if (!this.value.start) return false;
      if (d.equals(this.value.start)) return 'start';
      if (this.value.end && d.equals(this.value.end)) return 'end';
      return false;
    };
    const isInSelectedRange = (d) => {
      if (!this.value.start || !this.value.end) return false;
      const t = d.timestamp;
      return t > this.value.start.timestamp && t < this.value.end.timestamp;
    };

    // Pure month segments
    const pureSegments = [];
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const rowNum = startRow + i;
      const rowStart = this._getDateOfWeekRow(rowNum);
      const firstMonth = rowStart.month;
      let pure = true;
      for (let col = 1; col < this.DATE_COLS; col++) {
        const d = rowStart.clone();
        d.setDate(rowStart.date + col);
        if (d.month !== firstMonth) { pure = false; break; }
      }
      if (!pure) continue;
      const last = pureSegments[pureSegments.length - 1];
      if (last && last.month === firstMonth && last.startRow + (last.endRow - last.startRow) === rowNum) {
        last.endRow = rowNum + 1;
      } else {
        pureSegments.push({ month: firstMonth, startRow: rowNum, endRow: rowNum + 1 });
      }
    }

    // Pure year segments
    const pureYears = [];
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const rowNum = startRow + i;
      const rowStart = this._getDateOfWeekRow(rowNum);
      const firstYear = rowStart.year;
      let pure = true;
      for (let col = 1; col < this.DATE_COLS; col++) {
        const d = rowStart.clone();
        d.setDate(rowStart.date + col);
        if (d.year !== firstYear) { pure = false; break; }
      }
      if (!pure) continue;
      const last = pureYears[pureYears.length - 1];
      if (last && last.year === firstYear && last.startRow + (last.endRow - last.startRow) === rowNum) {
        last.endRow = rowNum + 1;
      } else {
        pureYears.push({ year: firstYear, startRow: rowNum, endRow: rowNum + 1 });
      }
    }

    // Per-row colors
    const rowYearColors = {};
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const rowNum = startRow + i;
      const rowStart = this._getDateOfWeekRow(rowNum);
      const monthCounts = {}; const yearCounts = {};
      for (let col = 0; col < this.DATE_COLS; col++) {
        const dayDate = rowStart.clone();
        dayDate.setDate(rowStart.date + col);
        const m = dayDate.month;
        const y = dayDate.year;
        monthCounts[m] = (monthCounts[m] || 0) + 1;
        yearCounts[y] = (yearCounts[y] || 0) + 1;
      }
      const mKeys = Object.keys(monthCounts).map(Number);
      let mColor;
      if (mKeys.length === 1) mColor = schemeColors[(mKeys[0] + cs) % schemeLen];
      else { const m1 = Math.min(...mKeys); const m2 = Math.max(...mKeys); mColor = blendColors(schemeColors[(m1 + cs) % schemeLen], schemeColors[(m2 + cs) % schemeLen], monthCounts[m2] / this.DATE_COLS); }

      const yKeys = Object.keys(yearCounts).map(Number);
      let yColor;
      if (yKeys.length === 1) {
        yColor = schemeColors[(yKeys[0] + 2 + cs) % schemeLen];
      } else {
        const y1 = Math.min(...yKeys);
        const y2 = Math.max(...yKeys);
        const pure1 = schemeColors[(y1 + 2 + cs) % schemeLen];
        const pure2 = schemeColors[(y2 + 2 + cs) % schemeLen];
        yColor = blendColors(pure1, pure2, yearCounts[y2] / this.DATE_COLS);
      }

      rowYearColors[rowNum] = saturateColor(yColor, 0.08);
    }

    // YearCell (only shown in column mode)
    if (this._hasSidebar) {
      const coveredYearRows = {};
      for (let si = 0; si < pureYears.length; si++) {
        const seg = pureYears[si];
        const yc = new YearCell({
          r: seg.startRow, c: 0, rs: seg.endRow - seg.startRow, cs: 1, grid: grid,
          container: this.calendarArea.container, picker: this.picker,
          year: seg.year,
        });
        yc.render();
        this.cellManager.add(yc);
        for (let yr = seg.startRow; yr < seg.endRow; yr++) coveredYearRows[yr] = true;
      }
      for (let i = 0; i < TOTAL_ROWS; i++) {
        const rowNum = startRow + i;
        if (coveredYearRows[rowNum]) continue;
        const ycBlend = new YearCell({
          r: rowNum, c: 0, rs: 1, cs: 1, grid: grid,
          container: this.calendarArea.container, picker: this.picker,
          year: 0,
          bgFill: rowYearColors[rowNum] || null,
        });
        ycBlend.render();
        this.cellManager.add(ycBlend);
      }
    } // end if _hasSidebar

    // MonthCell (only shown in column mode)
    if (this._hasSidebar) {
      const coveredMonthRows = {};
      for (let si = 0; si < pureSegments.length; si++) {
        const seg = pureSegments[si];
        const monthLabel = this._i18n.months[seg.month];
        const mc = new MonthCell({
          r: seg.startRow, c: 1, rs: seg.endRow - seg.startRow, cs: 1, grid: grid,
          container: this.calendarArea.container, picker: this.picker,
          month: seg.month,
          isPureSegment: true,
          label: monthLabel,
        });
        mc.render();
        this.cellManager.add(mc);
        for (let r = seg.startRow; r < seg.endRow; r++) coveredMonthRows[r] = true;
      }
      for (let i = 0; i < TOTAL_ROWS; i++) {
        const rowNum = startRow + i;
        if (coveredMonthRows[rowNum]) continue;
        const rowStart = this._getDateOfWeekRow(rowNum);
        const monthCounts = {};
        for (let col = 0; col < this.DATE_COLS; col++) {
          const d = rowStart.clone();
          d.setDate(rowStart.date + col);
          const m = d.month;
          monthCounts[m] = (monthCounts[m] || 0) + 1;
        }
        const mKeys = Object.keys(monthCounts).map(Number);
        let blended = null;
        if (mKeys.length > 1) {
          const m1 = Math.min.apply(null, mKeys);
          const m2 = Math.max.apply(null, mKeys);
          blended = {
            c1: schemeColors[(m1 + cs) % schemeLen],
            c2: schemeColors[(m2 + cs) % schemeLen],
            ratio: monthCounts[m2] / this.DATE_COLS,
          };
        }
        const mc = new MonthCell({
          r: rowNum, c: 1, rs: 1, cs: 1, grid: grid,
          container: this.calendarArea.container, picker: this.picker,
          month: mKeys[0],
          blended: true,
          blendColors: blended,
        });
        mc.render();
        this.cellManager.add(mc);
      }
    } // end if _hasSidebar

    // Year label (only shown in column mode)
    if (this._hasSidebar) {
      this._renderYearLabel(pureYears, startRow, TOTAL_ROWS, this.GAP + this.CELL_W / 2);
    }

    // DayCell
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const rowNum = startRow + i;
      const rowStart = this._getDateOfWeekRow(rowNum);
      for (let col = 0; col < this.DATE_COLS; col++) {
        const dayDate = rowStart.clone();
        dayDate.setDate(rowStart.date + col);
        const svgCol = this.DATE_COL_START + col;
        const dayNum = dayDate.date;
        const se = isStartOrEnd(dayDate);
        const inRange = isInSelectedRange(dayDate);
        const isToday = dayDate.equals(this._today);
        const dateStrVal = dayDate.toDateString();

        const dc = new DayCell({
          r: rowNum, c: svgCol, rs: 1, cs: 1, grid: grid,
          container: this.calendarArea.container, picker: this.picker,
          date: dayDate,
          dateStr: dateStrVal,
          dayNum: dayNum,
          isToday: isToday,
        });
        dc.setRangeState(se, inRange);
        dc.render();
        this.cellManager.add(dc);
      }
    }

    // Watermark mode: year/month watermark text
    if (!this._hasSidebar) {
      const monthRanges = {}; // key: "year-month" => { startRow, endRow }
      for (let i = 0; i < TOTAL_ROWS; i++) {
        const rowNum = startRow + i;
        const rowStart = this._getDateOfWeekRow(rowNum);
        const monthsInRow = new Set();
        for (let col = 0; col < this.DATE_COLS; col++) {
          const d = rowStart.clone();
          d.setDate(rowStart.date + col);
          monthsInRow.add(d.year + '-' + d.month);
        }
        for (const key of monthsInRow) {
          if (!monthRanges[key]) {
            monthRanges[key] = { startRow: rowNum, endRow: rowNum };
          } else {
            monthRanges[key].endRow = rowNum;
          }
        }
      }

      const dateLeft = this.GAP + this.DATE_COL_START * this.STEP_X;
      const dateWidth = this.DATE_COLS * this.CELL_W + (this.DATE_COLS - 1) * this.GAP;

      for (const key in monthRanges) {
        const seg = monthRanges[key];
        const [yearNum, monthNum] = key.split('-').map(Number);
        seg.year = yearNum;
        seg.month = monthNum;
        const rectX = dateLeft;
        const rectY = this.GAP + seg.startRow * this.STEP_Y;
        const rectH = (seg.endRow - seg.startRow + 1) * this.CELL_H
          + (seg.endRow - seg.startRow) * this.GAP;

        // Year/month watermark text (format driven by the yearFirst field in i18n data)
        const label = this._i18n.yearFirst
          ? String(seg.year) + this._i18n.year + ' ' + this._i18n.months[seg.month]
          : this._i18n.months[seg.month] + ' ' + String(seg.year);
        const cx = rectX + dateWidth / 2;
        const cy = rectY + rectH / 2;

        const text = document.createElementNS(this.svgNS, 'text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('dy', '1.5');
        text.setAttribute('fill', this.options.textColor);
        text.setAttribute('fill-opacity', '0.2');
        text.setAttribute('font-size', '40');
        text.setAttribute('font-style', 'italic');
        text.setAttribute('font-weight', '700');
        text.style.pointerEvents = 'none';
        text.textContent = label;
        this.calendarArea.container.appendChild(text);
      }

      // Raise DayCell date text above the watermark layer
      const dayCells = this.cellManager.filter(function (c) { return c.type === 'day'; });
      for (let di = 0; di < dayCells.length; di++) {
        const els = dayCells[di].elements;
        for (let ei = 0; ei < els.length; ei++) {
          if (els[ei].tagName === 'text') {
            this.calendarArea.container.appendChild(els[ei]);
          }
        }
      }
    }

    // Today button
    this._drawTodayBtn();

    // Header color sync
    this._syncHeaderColors();
  }

  /** @private */
  _renderYearLabel(pureYears, startRow, totalRows, cx) {
    const yearCells = this.cellManager.filter(function (c) { return c instanceof YearCell; });
    if (yearCells.length === 0) return;
    const yc = yearCells[0];
    if (yc._animId) return;

    const areaY = this.STEP_Y;
    const areaH = this.SVG_H - this.STEP_Y;
    const centerY = areaY + areaH / 2;
    const centerRow = startRow + Math.floor(totalRows / 2);

    let currentYear = null;
    for (let si = 0; si < pureYears.length; si++) {
      const seg = pureYears[si];
      if (centerRow >= seg.startRow && centerRow < seg.endRow) {
        currentYear = seg.year; break;
      }
    }
    if (currentYear === null && pureYears.length > 0) {
      let minD = Infinity;
      for (let si = 0; si < pureYears.length; si++) {
        const seg = pureYears[si];
        const d = Math.abs(centerRow - (seg.startRow + seg.endRow) / 2);
        if (d < minD) { minD = d; currentYear = seg.year; }
      }
    }
    if (currentYear === null) return;

    const prevYear = this._visibleYear;
    this._visibleYear = currentYear;

    if (prevYear === null || prevYear === currentYear) {
      while (this.yearGroup.firstChild) this.yearGroup.removeChild(this.yearGroup.firstChild);
      const text = document.createElementNS(this.svgNS, 'text');
      text.setAttribute('x', cx);
      text.setAttribute('y', centerY);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('dy', '1.5');
      text.setAttribute('fill', this.options.textColorSubLabel);
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', '700');
      text.textContent = String(currentYear);
      this.yearGroup.appendChild(text);
      return;
    }

    const dir = currentYear > prevYear ? 1 : -1;
    yc.startAnim(prevYear, currentYear, dir, cx, centerY, areaY);
  }

  /**
   * Draw the "back to today" positioning button.
   *
   * The button is located at the bottom-left of the SVG and consists of a circular
   * base + an outer ring + a center dot, visually mimicking a "bullseye" icon.
   * Clicking it calls _goToToday() to scroll back to today's date row.
   *
   * - base  : white semi-transparent circular base, acting as the button background
   * - ring  : hollow ring, stroked with todayBarColor
   * - dot   : solid center dot, filled with todayBarColor
   * - hit   : transparent click layer covering the whole button, bound to the click event
   *
   * All child elements of todayBtnGroup are cleared before each render for a redraw.
   * @private
   */
  _drawTodayBtn() {
    // ── Clear old content and prepare for redraw ──────────────────────
    while (this.todayBtnGroup.firstChild) this.todayBtnGroup.removeChild(this.todayBtnGroup.firstChild);

    // ── Size constants ────────────────────────────────────────────────
    const {
      SIZE, MARGIN, RING_R, DOT_R, STROKE_W, SHADOW_X, SHADOW_Y,
    } = DIM.TODAY_BTN;

    // ── Compute the button position in the SVG coordinate system (bottom-left) ──
    const bx = MARGIN;
    const by = this.SVG_H - MARGIN - SIZE;
    const cxIcon = bx + SIZE / 2;   // Button center X
    const cyIcon = by + SIZE / 2;   // Button center Y

    // ── 1. Shadow: semi-transparent circle the same size as the base, offset right and down ──
    const shadow = document.createElementNS(this.svgNS, 'circle');
    shadow.setAttribute('cx', cxIcon + SHADOW_X);
    shadow.setAttribute('cy', cyIcon + SHADOW_Y);
    shadow.setAttribute('r', SIZE / 2);
    shadow.setAttribute('fill', 'rgba(0,0,0,0.30)');         // Semi-transparent black to simulate shadow
    this.todayBtnGroup.appendChild(shadow);

    // ── 2. Base: white semi-transparent circular background ────────────
    const base = document.createElementNS(this.svgNS, 'circle');
    base.setAttribute('cx', cxIcon);
    base.setAttribute('cy', cyIcon);
    base.setAttribute('r', SIZE / 2);
    base.setAttribute('fill', HARDCODED.todayBtnFill);     // White fill
    base.setAttribute('fill-opacity', '0.88');              // Slightly transparent so the grid shows through
    base.setAttribute('stroke', HARDCODED.todayBtnStroke);   // Stroke uses a light gray
    base.setAttribute('stroke-width', '1');
    this.todayBtnGroup.appendChild(base);

    // ── 2. Outer ring: hollow circle ───────────────────────────────────
    const ring = document.createElementNS(this.svgNS, 'circle');
    ring.setAttribute('cx', cxIcon);
    ring.setAttribute('cy', cyIcon);
    ring.setAttribute('r', RING_R);
    ring.setAttribute('fill', 'none');                       // Hollow
    ring.setAttribute('stroke', this.options.todayBarColor); // Theme color stroke
    ring.setAttribute('stroke-width', STROKE_W);
    this.todayBtnGroup.appendChild(ring);

    // ── 3. Center dot: solid dot ──────────────────────────────────────
    const dot = document.createElementNS(this.svgNS, 'circle');
    dot.setAttribute('cx', cxIcon);
    dot.setAttribute('cy', cyIcon);
    dot.setAttribute('r', DOT_R);
    dot.setAttribute('fill', this.options.todayBarColor);   // Theme color fill
    this.todayBtnGroup.appendChild(dot);

    // ── 4. Transparent hit layer: covers the whole button and receives clicks ──
    // Use a transparent circle instead of binding events on the base directly, to avoid pass-through when clicking the visual elements
    const hit = document.createElementNS(this.svgNS, 'circle');
    hit.setAttribute('cx', cxIcon);
    hit.setAttribute('cy', cyIcon);
    hit.setAttribute('r', SIZE / 2);
    hit.setAttribute('fill', 'transparent');                 // Fully transparent
    const self = this;
    hit.addEventListener('click', function (e) {
      e.stopPropagation();   // Stop propagation to avoid triggering calendar click logic
      self._goToToday();     // Navigate to today's date row
    });
    this.todayBtnGroup.appendChild(hit);
  }

  // ════════════════════════════════════════════════════════════════
  //  Time Wheel
  // ════════════════════════════════════════════════════════════════

  /** @private */
  _initTimeWheel() {
    if (this.timeWheel) this.timeWheel.destroy();
    this.timeWheel = new TimeWheel({
      svgNS: this.svgNS,
      timeGroup: this.timeArea ? this.timeArea.container : null,
      cellW: this.CELL_W,
      cellH: this.CELL_H,
      gap: this.GAP,
      stepX: this.STEP_X,
      stepY: this.STEP_Y,
      svgH: this.SVG_H,
      timeColStart: this.TIME_COL_START,
      colorShift: this._colorShift,
      options: this.options,
      dragController: this.dragController,
      dragSessionId: this.picker._instanceId + '-tw',
      getActiveScheme: getActiveScheme,
      saturateColor: saturateColor,
      isTimeRange: () => this.value.isTimeRange,
      isTimeEnabled: () => this.value.isTimeEnabled,
      onTimeChange: () => this.picker._fireChange(),
      i18n: this._i18n,
      svg: this.svg,
      selectedColor: this.options.selectedColor,
      todayBarColor: this.options.todayBarColor,
      textColor: this.options.textColor,
      selectedTextColor: this.options.selectedTextColor,
      onDragStateChange: (isDragging) => {
        this._setHoverDisabled(isDragging);
        if (isDragging) {
          this._dragging = true;
        } else {
          // Defer clearing the drag flag so the immediately-following click event still sees
          // _dragging=true and does not close the picker
          setTimeout(() => { this._dragging = false; }, 0);
        }
      },
      isDragActive: () => this._hoverDisabled,
      picker: this.picker,
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  Event Binding (SVG-specific)
  // ════════════════════════════════════════════════════════════════

  bindEvents() {
    // Calendar drag session
    this.dragController.register('calendar', {
      onDragMove: (clientY) => {
        if (!this._dragging) return;
        this._onDragMove(clientY);
      },
      onDragEnd: () => {
        this._onDragEnd();
      },
    });

    this._onSvgMouseDown = (e) => {
      if (!this._isInDateArea(e)) return;
      this._onDragStart(e.clientY);
      this.dragController.activate('calendar');
    };
    this.svg.addEventListener('mousedown', this._onSvgMouseDown);

    this._onTouchStart = (e) => {
      if (!this._isInDateArea(e)) return;
      this._onDragStart(e.touches[0].clientY);
      this.dragController.activate('calendar');
    };
    this.svg.addEventListener('touchstart', this._onTouchStart, { passive: true });

    // Wheel
    this._onContainerWheel = (e) => {
      if (!this.picker.visible) return;
      e.preventDefault();
      if (this._isInDateArea(e)) {
        this._dragging = false;
        const rowDelta = Math.round((e.deltaY / 100) * this.options.wheelStep / this.STEP_Y);
        this._wheelTargetY -= rowDelta * this.STEP_Y;
        this._startWheelAnimation();
      }
    };
    this.container.addEventListener('wheel', this._onContainerWheel, { passive: false });

    // Date click (no selection after a drag)
    this._onScrollGroupClick = (e) => {
      if (this._dragMoved) return;
      const dateAttr = e.target.getAttribute('data-date');
      if (!dateAttr) return;
      const d = DateTime.parse(dateAttr);
      if (d) this.picker._handleDateClick(d);
    };
    this.calendarArea.container.addEventListener('click', this._onScrollGroupClick);

    this._onScrollGroupMouseLeave = () => {
      this._hoverDate = null;
      if (this.value.start && !this.value.end) {
        this.renderCalendar();
      }
    };
    this.calendarArea.container.addEventListener('mouseleave', this._onScrollGroupMouseLeave);

    // Panel touch: prevent page scrolling
    this._onContainerTouchMove = (e) => {
      if (!this.picker.visible) return;
      e.preventDefault();
    };
    this.container.addEventListener('touchmove', this._onContainerTouchMove, { passive: false });
  }

  // ════════════════════════════════════════════════════════════════
  //  Drag Management
  // ════════════════════════════════════════════════════════════════

  _onDragStart(clientY) {
    this._stopWheelAnimation();
    this.cellManager.filter(function (c) { return c instanceof YearCell; }).forEach(function (c) { c.stopAnim(); });
    this._dragging = true;
    this._dragStartY = clientY;
    this._dragStartTY = this._translateY;
    this._dragMoved = false;
  }

  _onDragMove(clientY) {
    if (!this._dragging) return;
    const delta = clientY - this._dragStartY;
    this._translateY = this._dragStartTY + delta;
    this._wheelTargetY = this._translateY;
    if (Math.abs(delta) > 5 && !this._dragMoved) {
      this._dragMoved = true;
      this._setHoverDisabled(true);
    }
    this._applyScrollTransform();
    if (this._lastDragClientY !== undefined) {
      this._dragLastDY = clientY - this._lastDragClientY;
    }
    this._lastDragClientY = clientY;
    if (this._dragMoved) {
      const row = Math.floor(-this._translateY / this.STEP_Y) - this.BUFFER_ROWS;
      if (Math.abs(row - this._lastRenderRow) > this.BUFFER_ROWS / 2) {
        this.renderCalendar();
      }
    }
  }

  _onDragEnd() {
    // Defer clearing the drag flag so the immediately-following click event still sees
    // _dragging=true and does not close the picker
    setTimeout(() => { this._dragging = false; }, 0);
    this._setHoverDisabled(false);
    this._lastDragClientY = undefined;
    if (this._dragMoved) {
      const momentum = Math.max(-300, Math.min(300, this._dragLastDY * 5));
      const currentRow = Math.round(this._translateY / this.STEP_Y);
      const targetRow = currentRow + Math.round(momentum / this.STEP_Y);
      this._wheelTargetY = targetRow * this.STEP_Y;
      this._startWheelAnimation();
    }
  }

  /** @private */
  _applyScrollTransform() {
    this.calendarArea.setScroll(this._translateY);
  }

  /** @private */
  _isInDateArea(e) {
    const rect = this.svg.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const sx = this.SVG_W / rect.width;
    const sy = this.SVG_H / rect.height;
    const svgX = x * sx;
    const svgY = y * sy;
    const dateRight = this.GAP + (this.SIDEBAR_COLS + this.DATE_COLS) * this.STEP_X;
    return svgX >= 0 && svgX <= dateRight && svgY >= this.STEP_Y && svgY <= this.SVG_H;
  }

  // ════════════════════════════════════════════════════════════════
  //  Wheel Animation
  // ════════════════════════════════════════════════════════════════

  _startWheelAnimation() {
    if (this._wheelAnimId) return;
    this._setHoverDisabled(true);
    const self = this;
    const step = () => {
      const diff = self._wheelTargetY - self._translateY;
      if (Math.abs(diff) < 0.5) {
        self._translateY = self._wheelTargetY;
        self.renderCalendar();
        self._wheelAnimId = null;
        self._setHoverDisabled(false);
        return;
      }
      self._translateY += diff * 0.2;
      self._applyScrollTransform();
      const row = Math.floor(-self._translateY / self.STEP_Y) - self.BUFFER_ROWS;
      if (Math.abs(row - self._lastRenderRow) > self.BUFFER_ROWS / 2) {
        self.renderCalendar();
      }
      self._wheelAnimId = requestAnimationFrame(step);
    };
    this._wheelAnimId = requestAnimationFrame(step);
  }

  _stopWheelAnimation() {
    if (this._wheelAnimId) {
      cancelAnimationFrame(this._wheelAnimId);
      this._wheelAnimId = null;
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  Scroll Control
  // ════════════════════════════════════════════════════════════════

  /** Reset the scroll offset to the starting position. */
  resetScroll() {
    this._translateY = 0;
    this._wheelTargetY = 0;
  }

  // ════════════════════════════════════════════════════════════════
  //  Navigation
  // ════════════════════════════════════════════════════════════════

  goToDate(date) {
    const MS_PER_DAY = 86400000;
    const targetDate = new DateTime(date.year, date.month, date.date);
    const daysDiff = Math.round((targetDate.timestamp - this._startOfWeekZero.timestamp) / MS_PER_DAY);
    const targetRow = Math.floor(daysDiff / 7);
    const targetSVG_Y = this.GAP + this.STEP_Y + 3 * this.STEP_Y;
    this._wheelTargetY = targetSVG_Y - targetRow * this.STEP_Y - this.GAP;
    this._startWheelAnimation();
  }

  /** @private */
  _goToToday() {
    this.goToDate(this._today);
  }

  /** @private */
  _getDateOfWeekRow(rowOffset) {
    const MAX_WEEK_OFFSET = 52000;
    rowOffset = Math.max(-MAX_WEEK_OFFSET, Math.min(MAX_WEEK_OFFSET, rowOffset));
    const d = this._startOfWeekZero.clone();
    d.setDate(d.date + rowOffset * 7);
    return d;
  }

  // ════════════════════════════════════════════════════════════════
  //  Header Color Sync
  // ════════════════════════════════════════════════════════════════

  _syncHeaderColors() {
    if (!this._headerCells) return;

    const container = this.headerArea.container;
    while (container.firstChild) container.removeChild(container.firstChild);
    this._headerCells.forEach(function (hc) { hc.elements = []; });

    const probeY = this.GAP + this.CELL_H + this.GAP + 1;
    const headerColorVector = [];

    this._headerCells.forEach(function (hc) {
      let target = this._probeCellAt(hc.x, probeY);
      if (!target) target = this._probeCellAt(hc.x, probeY + 1);
      const color = (target && target.bgColor) ? saturateColor(target.bgColor, 0.1) : null;
      headerColorVector.push(color);
      hc.render();
    }, this);

    if (this.headerBarCell) {
      this.headerBarCell.setHeaderColors(headerColorVector);
      this.headerBarCell.render();
    }
  }

  /** @private */
  _probeCellAt(x, y) {
    const all = this.cellManager._all;
    const sy = this._translateY;
    for (let ci = 0; ci < all.length; ci++) {
      const cell = all[ci];
      if (x >= cell.x && x < cell.x + cell.w &&
        y >= cell.y + sy && y < cell.y + sy + cell.h) {
        return cell;
      }
    }
    const tw = this.timeWheel;
    if (tw) {
      const titleBarCells = [tw._titleBarStart, tw._titleBarEnd];
      for (let ti = 0; ti < titleBarCells.length; ti++) {
        const tbc = titleBarCells[ti];
        if (tbc && tbc.bgColor && x >= tbc.x && x < tbc.x + tbc.w &&
          y >= tbc.y && y < tbc.y + tbc.h) {
          return tbc;
        }
      }
      if (tw._timeCells) {
        const tcMap = tw._timeCells;
        const tcKeys = Object.keys(tcMap);
        for (let tk = 0; tk < tcKeys.length; tk++) {
          const tcCell = tcMap[tcKeys[tk]];
          if (tcCell.bgColor && x >= tcCell.x && x < tcCell.x + tcCell.w &&
            y >= tcCell.y && y < tcCell.y + tcCell.h) {
            return tcCell;
          }
        }
      }
    }
    return null;
  }

  // ════════════════════════════════════════════════════════════════
  //  Hover Management
  // ════════════════════════════════════════════════════════════════

  _setHoverDisabled(disabled) {
    this._hoverDisabled = disabled;
    this.picker._hoverDisabled = disabled;
    if (disabled) {
      this._clearHoverFills();
    }
  }

  _clearHoverFills() {
    this.cellManager.each(function (cell) {
      if (cell._isHovered) cell.setHover(false);
    });
    if (this.timeWheel && this.timeWheel.clearHoverFills) {
      this.timeWheel.clearHoverFills();
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  Destroy
  // ════════════════════════════════════════════════════════════════

  destroy() {
    this._stopWheelAnimation();

    if (this.cellManager) {
      this.cellManager.filter(function (c) { return c instanceof YearCell; }).forEach(function (c) { c.stopAnim(); });
    }

    if (this.dragController) { this.dragController.destroy(); this.dragController = null; }
    if (this.timeWheel) { this.timeWheel.destroy(); this.timeWheel = null; }
    if (this.calendarArea) { this.calendarArea.destroy(); this.calendarArea = null; }
    if (this.timeArea) { this.timeArea.destroy(); this.timeArea = null; }
    if (this.headerArea) { this.headerArea.destroy(); this.headerArea = null; }

    // Unbind SVG events
    if (this._onSvgMouseDown) this.svg.removeEventListener('mousedown', this._onSvgMouseDown);
    if (this._onTouchStart) this.svg.removeEventListener('touchstart', this._onTouchStart);
    if (this._onContainerWheel) this.container.removeEventListener('wheel', this._onContainerWheel);
    if (this._onContainerTouchMove) this.container.removeEventListener('touchmove', this._onContainerTouchMove);

    // Remove DOM
    if (this.container) this.container.remove();
  }
}

export default SvgRenderer;
