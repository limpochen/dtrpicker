/**
 * SvgRenderer — SVG 渲染器
 *
 * 封装 dtrPicker 的全部 SVG 渲染逻辑，包括 DOM 创建、日历渲染、
 * 拖拽/滚轮事件管理。主类通过此渲染器接口操作 SVG 内容，
 * 不直接接触 SVG 实现细节。
 */

import { getActiveScheme, HARDCODED } from '../../config/colors.js';
import { DIM } from '../../config/dimensions.js';
import { saturateColor, blendColors } from '../../utils/color.js';
import { dateEqual, dateStr, parseDate } from '../../utils/date.js';
import DragController from '../../utils/dragcontroller.js';

import Cell from './cell.js';
import DayCell from './day-cell.js';
import MonthCell from './month-cell.js';
import YearCell from './year-cell.js';
import HeaderCell from './header-cell.js';
import HeaderBarCell from './header-bar-cell.js';
import TimeCell from './time-cell.js';
import TitleBarCell from './title-bar-cell.js';
import DrawingArea from './drawing-area.js';
import CellManager from './cell-manager.js';
import TimeWheel from './time-wheel.js';

class SvgRenderer {
  /**
   * @param {dtrPicker} picker - 主实例引用
   */
  constructor(picker) {
    this.picker = picker;
    this.options = picker.options;
    this.state = picker.state;
    this._i18n = picker._i18n;

    // SVG DOM 元素
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

    // 网格常量（CELL_W 由 _detectCellW 动态决定，STEP_X/STEP_Y 在 createPanel 中计算）
    this.CELL_W = 0;
    this.CELL_H = DIM.CELL_H;
    this.GAP = DIM.GAP;
    this.STEP_X = 0;
    this.STEP_Y = 0;
    /** 是否显示侧边栏（年/月列） */
    this._hasSidebar = DIM.YEAR_MONTH_MODE === 'column';
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

    // 绘制区域
    /** @type {DrawingArea|null} */
    this.calendarArea = null;
    /** @type {DrawingArea|null} */
    this.timeArea = null;
    /** @type {DrawingArea|null} */
    this.headerArea = null;

    // 拖拽
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

    // 滚轮动画
    /** @type {number|null} */
    this._wheelAnimId = null;
    /** @type {number|null} */
    this._lastRenderRow = null;

    // 格子管理
    /** @type {CellManager} */
    this.cellManager = new CellManager();

    // 表头
    /** @type {HeaderCell[]} */
    this._headerCells = [];
    /** @type {HeaderBarCell|null} */
    this.headerBarCell = null;

    // 时间滚轮
    /** @type {TimeWheel|null} */
    this.timeWheel = null;
  }

  // ════════════════════════════════════════════════════════════════
  //  面板创建
  // ════════════════════════════════════════════════════════════════

  /** @private */
  _detectCellW() {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return DIM.CELL_W.DESKTOP;
    if (this.state.isTimeEnabled()) return DIM.CELL_W.MOBILE_TIME;
    return DIM.CELL_W.MOBILE;
  }

  /** @private */
  _calcTotalCols() {
    return this.SIDEBAR_COLS + this.DATE_COLS + (this.state.isTimeEnabled() ? this.TIME_COLS : 0);
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
   * 创建下拉面板的完整 DOM 结构并挂载到 body。
   */
  createPanel() {
    this.CELL_W = this._detectCellW();
    this.STEP_X = this.CELL_W + this.GAP;
    this.STEP_Y = this.CELL_H + this.GAP;
    this.SVG_H = this.CELL_H * 9 + this.GAP * 10;
    this._updateSVGSize();

    // 外层容器
    this.container = document.createElement('div');
    this.container.className = 'dtrpicker-container';
    this.container.style.position = 'fixed';
    this.container.style.zIndex = this.options.zIndex;
    this.container.style.opacity = '0';
    this.container.style.visibility = 'hidden';
    this.container.style.transform = 'translateY(-8px)';
    this.container.style.transition = 'opacity 0.2s, visibility 0.2s, transform 0.2s';

    // 面板
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

    // 灰色背景铺底
    this.svgBg = document.createElementNS(this.svgNS, 'rect');
    this.svgBg.setAttribute('x', '0');
    this.svgBg.setAttribute('y', '0');
    this.svgBg.setAttribute('width', this.SVG_W);
    this.svgBg.setAttribute('height', this.SVG_H);
    this.svgBg.setAttribute('fill', this.options.gridColor);
    this.svg.appendChild(this.svgBg);

        // 网格常量引用
    const totalCols = this._calcTotalCols();
    const gridRef = {
      CELL_W: this.CELL_W, CELL_H: this.CELL_H, GAP: this.GAP,
      STEP_X: this.STEP_X, STEP_Y: this.STEP_Y, svgNS: this.svgNS,
    };

    // 三个绘制区域（顺序：calendar → time → header）
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

    // 日历区域视口裁剪：嵌套 <svg>
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

    // 标题栏裁剪
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

    // 时间区裁剪
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

    // 年份动画层
    this.yearGroup = document.createElementNS(this.svgNS, 'g');
    this.yearGroup.setAttribute('id', this.picker._instanceId + '-year');
    this.svg.appendChild(this.yearGroup);

    // 今日定位按钮层
    this.todayBtnGroup = document.createElementNS(this.svgNS, 'g');
    this.todayBtnGroup.setAttribute('id', this.picker._instanceId + '-today-btn');
    this.svg.appendChild(this.todayBtnGroup);

    // 组装
    this.panel.appendChild(this.svg);
    this.container.appendChild(this.panel);

        // 版本号（由 DIM.SHOW_VERSION 控制是否显示）
    if (DIM.SHOW_VERSION) {
      const verEl = document.createElement('div');
      verEl.textContent = DIM.VERSION;
      verEl.style.cssText = 'position:absolute;bottom:2px;left:4px;font-size:9px;color:#aaa;pointer-events:none;user-select:none;';
      this.container.appendChild(verEl);
    }

    document.body.appendChild(this.container);

    // 同步渲染器属性到主实例（Cell 子类通过 this.picker.xxx 访问）
    this.picker.svg = this.svg;
    this.picker.SVG_W = this.SVG_W;
    this.picker.yearGroup = this.yearGroup;
    this.picker.headerArea = this.headerArea;
    this.picker.calendarArea = this.calendarArea;
    this.picker._hoverDisabled = this._hoverDisabled;
    this.picker.timeWheel = this.timeWheel;

    // 初始渲染
    this.renderWeekHeader();
    this.renderCalendar();
    this._initTimeWheel();
  }

  // ════════════════════════════════════════════════════════════════
  //  表头渲染
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

    if (this.state.isTimeEnabled()) {
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
      // 周末标题使用专门颜色（优先级高于周末日期色）
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
    // 同步到主实例（HeaderBarCell._sortedColors 通过 this.picker._headerCells 访问）
    this.picker._headerCells = this._headerCells;
    this.picker.headerBarCell = this.headerBarCell;
  }

  // ════════════════════════════════════════════════════════════════
  //  日历渲染
  // ════════════════════════════════════════════════════════════════

  renderCalendar() {
    const scheme = getActiveScheme(this.options);
    const schemeColors = scheme.colors;
    const schemeLen = schemeColors.length;
    const cs = this.state._colorShift;

    const TOTAL_ROWS = this.VISIBLE_DATE_ROWS + this.BUFFER_ROWS * 2;
    const startRow = Math.floor(-this.state.translateY / this.STEP_Y) - this.BUFFER_ROWS;
    this._lastRenderRow = startRow;

    this.calendarArea.clear();
    this.cellManager.clear();
    this.calendarArea.setScroll(this.state.translateY);

        const grid = {
      CELL_W: this.CELL_W, CELL_H: this.CELL_H, GAP: this.GAP,
      STEP_X: this.STEP_X, STEP_Y: this.STEP_Y, svgNS: this.svgNS,
    };

    const isStartOrEnd = (d) => {
      if (!this.state.rangeStart) return false;
      if (dateEqual(d, this.state.rangeStart)) return 'start';
      if (this.state.rangeEnd && dateEqual(d, this.state.rangeEnd)) return 'end';
      return false;
    };
    const isInSelectedRange = (d) => {
      if (!this.state.rangeStart || !this.state.rangeEnd) return false;
      const t = d.getTime();
      return t > this.state.rangeStart.getTime() && t < this.state.rangeEnd.getTime();
    };

    // 纯月段
    const pureSegments = [];
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const rowNum = startRow + i;
      const rowStart = this._getDateOfWeekRow(rowNum);
      const firstMonth = rowStart.getMonth();
      let pure = true;
      for (let col = 1; col < this.DATE_COLS; col++) {
        const d = new Date(rowStart);
        d.setDate(rowStart.getDate() + col);
        if (d.getMonth() !== firstMonth) { pure = false; break; }
      }
      if (!pure) continue;
      const last = pureSegments[pureSegments.length - 1];
      if (last && last.month === firstMonth && last.startRow + (last.endRow - last.startRow) === rowNum) {
        last.endRow = rowNum + 1;
      } else {
        pureSegments.push({ month: firstMonth, startRow: rowNum, endRow: rowNum + 1 });
      }
    }

    // 纯年段
    const pureYears = [];
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const rowNum = startRow + i;
      const rowStart = this._getDateOfWeekRow(rowNum);
      const firstYear = rowStart.getFullYear();
      let pure = true;
      for (let col = 1; col < this.DATE_COLS; col++) {
        const d = new Date(rowStart);
        d.setDate(rowStart.getDate() + col);
        if (d.getFullYear() !== firstYear) { pure = false; break; }
      }
      if (!pure) continue;
      const last = pureYears[pureYears.length - 1];
      if (last && last.year === firstYear && last.startRow + (last.endRow - last.startRow) === rowNum) {
        last.endRow = rowNum + 1;
      } else {
        pureYears.push({ year: firstYear, startRow: rowNum, endRow: rowNum + 1 });
      }
    }

        // 逐行颜色
    const rowYearColors = {};
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const rowNum = startRow + i;
      const rowStart = this._getDateOfWeekRow(rowNum);
      const monthCounts = {}; const yearCounts = {};
      for (let col = 0; col < this.DATE_COLS; col++) {
        const dayDate = new Date(rowStart);
        dayDate.setDate(rowStart.getDate() + col);
        const m = dayDate.getMonth();
        const y = dayDate.getFullYear();
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

    // YearCell（仅 column 模式显示）
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

    // MonthCell（仅 column 模式显示）
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
        const d = new Date(rowStart);
        d.setDate(rowStart.getDate() + col);
        const m = d.getMonth();
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

    // 年份文字（仅 column 模式显示）
    if (this._hasSidebar) {
      this._renderYearLabel(pureYears, startRow, TOTAL_ROWS, this.GAP + this.CELL_W / 2);
    }

    // DayCell
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const rowNum = startRow + i;
      const rowStart = this._getDateOfWeekRow(rowNum);
      for (let col = 0; col < this.DATE_COLS; col++) {
        const dayDate = new Date(rowStart);
        dayDate.setDate(rowStart.getDate() + col);
        const svgCol = this.DATE_COL_START + col;
        const dayNum = dayDate.getDate();
        const se = isStartOrEnd(dayDate);
        const inRange = isInSelectedRange(dayDate);
        const isToday = dateEqual(dayDate, this.state.today);
        const dateStrVal = dateStr(dayDate);

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

    // 水印模式：每月矩形容器（1px 红色边框，供观察用）
    if (!this._hasSidebar) {
      const monthRanges = {}; // key: "year-month" => { startRow, endRow }
      for (let i = 0; i < TOTAL_ROWS; i++) {
        const rowNum = startRow + i;
        const rowStart = this._getDateOfWeekRow(rowNum);
        const monthsInRow = new Set();
        for (let col = 0; col < this.DATE_COLS; col++) {
          const d = new Date(rowStart);
          d.setDate(rowStart.getDate() + col);
          monthsInRow.add(d.getFullYear() + '-' + d.getMonth());
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

        const rect = document.createElementNS(this.svgNS, 'rect');
        rect.setAttribute('x', rectX);
        rect.setAttribute('y', rectY);
        rect.setAttribute('width', dateWidth);
        rect.setAttribute('height', rectH);
        // 使用 inset 让 1px 描边完全位于矩形内缘以内，不伸入间隙
        rect.setAttribute('x', rectX + 0.5);
        rect.setAttribute('y', rectY + 0.5);
        rect.setAttribute('width', dateWidth - 1);
        rect.setAttribute('height', rectH - 1);
        // 矩形容器（已无边框，仅用于占位参考，后续可移除）
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', 'none');
        this.calendarArea.container.appendChild(rect);

        // 年月水印文字（由 i18n 数据的 yearFirst 字段驱动格式）
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
        text.setAttribute('font-size', '42');
        text.setAttribute('font-style', 'italic');
        text.setAttribute('font-weight', '700');
        text.textContent = label;
        this.calendarArea.container.appendChild(text);
      }

      // 将 DayCell 的日期文字提升到水印层之上
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

    // 今日按钮
    this._drawTodayBtn();

    // 表头颜色同步
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

    const prevYear = this.state._visibleYear;
    this.state._visibleYear = currentYear;

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
   * 绘制「回到今日」定位按钮。
   *
   * 按钮位于 SVG 左下角，由一个圆形底座 + 外圈圆环 + 中心圆点组成，
   * 视觉上模拟「靶心」图标，点击后调用 _goToToday() 滚回今日日期所在行。
   *
   * - base  : 白色半透明圆形底座，作为按钮背景
   * - ring  : 空心圆环，使用 todayBarColor 描边
   * - dot   : 实心中心圆点，使用 todayBarColor 填充
   * - hit   : 透明点击层，覆盖整个按钮区域，绑定点击事件
   *
   * 每次渲染前先清空 todayBtnGroup 内所有子元素，实现重绘。
   * @private
   */
  _drawTodayBtn() {
    // ── 清空旧内容，准备重绘 ──────────────────────────────────────
    while (this.todayBtnGroup.firstChild) this.todayBtnGroup.removeChild(this.todayBtnGroup.firstChild);

    // ── 尺寸常量 ──────────────────────────────────────────────────
    const {
      SIZE, MARGIN, RING_R, DOT_R, STROKE_W, SHADOW_X, SHADOW_Y,
    } = DIM.TODAY_BTN;

    // ── 计算按钮在 SVG 坐标系中的位置（左下角定位） ──────────────
    const bx = MARGIN;
    const by = this.SVG_H - MARGIN - SIZE;
    const cxIcon = bx + SIZE / 2;   // 按钮圆心 X
    const cyIcon = by + SIZE / 2;   // 按钮圆心 Y

    // ── 1. 阴影：与底座同大的半透明圆，向右向下偏移 ──────────────
    const shadow = document.createElementNS(this.svgNS, 'circle');
    shadow.setAttribute('cx', cxIcon + SHADOW_X);
    shadow.setAttribute('cy', cyIcon + SHADOW_Y);
    shadow.setAttribute('r', SIZE / 2);
    shadow.setAttribute('fill', 'rgba(0,0,0,0.30)');         // 半透明黑色模拟阴影
    this.todayBtnGroup.appendChild(shadow);

    // ── 2. 底座：白色半透明圆形背景 ──────────────────────────────
    const base = document.createElementNS(this.svgNS, 'circle');
    base.setAttribute('cx', cxIcon);
    base.setAttribute('cy', cyIcon);
    base.setAttribute('r', SIZE / 2);
    base.setAttribute('fill', HARDCODED.todayBtnFill);     // 白色填充
    base.setAttribute('fill-opacity', '0.88');              // 轻微透明，透出网格
    base.setAttribute('stroke', HARDCODED.todayBtnStroke);   // 描边使用淡灰色
    base.setAttribute('stroke-width', '1');
    this.todayBtnGroup.appendChild(base);

    // ── 2. 外圈圆环：空心圆圈 ────────────────────────────────────
    const ring = document.createElementNS(this.svgNS, 'circle');
    ring.setAttribute('cx', cxIcon);
    ring.setAttribute('cy', cyIcon);
    ring.setAttribute('r', RING_R);
    ring.setAttribute('fill', 'none');                       // 空心
    ring.setAttribute('stroke', this.options.todayBarColor); // 主题色描边
    ring.setAttribute('stroke-width', STROKE_W);
    this.todayBtnGroup.appendChild(ring);

    // ── 3. 中心圆点：实心圆点 ────────────────────────────────────
    const dot = document.createElementNS(this.svgNS, 'circle');
    dot.setAttribute('cx', cxIcon);
    dot.setAttribute('cy', cyIcon);
    dot.setAttribute('r', DOT_R);
    dot.setAttribute('fill', this.options.todayBarColor);   // 主题色填充
    this.todayBtnGroup.appendChild(dot);

    // ── 4. 透明点击层：覆盖整个按钮区域，接收点击事件 ──────────
    // 使用透明圆形而非直接在底座上绑定事件，避免点击视觉元素时触发穿透
    const hit = document.createElementNS(this.svgNS, 'circle');
    hit.setAttribute('cx', cxIcon);
    hit.setAttribute('cy', cyIcon);
    hit.setAttribute('r', SIZE / 2);
    hit.setAttribute('fill', 'transparent');                 // 完全透明
    const self = this;
    hit.addEventListener('click', function (e) {
      e.stopPropagation();   // 阻止事件冒泡，避免触发日历点击逻辑
      self._goToToday();     // 导航到今天的日期行
    });
    this.todayBtnGroup.appendChild(hit);
  }

  // ════════════════════════════════════════════════════════════════
  //  时间滚轮
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
      colorShift: this.state._colorShift,
      options: this.options,
      dragController: this.dragController,
      dragSessionId: this.picker._instanceId + '-tw',
      getActiveScheme: getActiveScheme,
      saturateColor: saturateColor,
      isTimeRange: () => this.state.isTimeRange(),
      isTimeEnabled: () => this.state.isTimeEnabled(),
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
          // 延迟清除拖拽标志，让紧随的 click 事件仍能看到 _dragging=true，避免关闭选择器
          setTimeout(() => { this._dragging = false; }, 0);
        }
      },
      isDragActive: () => this._hoverDisabled,
      picker: this.picker,
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  事件绑定（SVG 专属）
  // ════════════════════════════════════════════════════════════════

  bindEvents() {
    // 日历拖拽 session
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

    // 滚轮
    this._onContainerWheel = (e) => {
      if (!this.picker.visible) return;
      e.preventDefault();
      if (this._isInDateArea(e)) {
        this._dragging = false;
        const rowDelta = Math.round((e.deltaY / 100) * this.options.wheelStep / this.STEP_Y);
        this.state._wheelTargetY -= rowDelta * this.STEP_Y;
        this._startWheelAnimation();
      }
    };
    this.container.addEventListener('wheel', this._onContainerWheel, { passive: false });

    // 日期点击（拖拽后不触发选择）
    this._onScrollGroupClick = (e) => {
      if (this._dragMoved) return;
      const dateAttr = e.target.getAttribute('data-date');
      if (!dateAttr) return;
      const d = parseDate(dateAttr);
      if (d) this.picker._handleDateClick(d);
    };
    this.calendarArea.container.addEventListener('click', this._onScrollGroupClick);

    this._onScrollGroupMouseLeave = () => {
      this.state.hoverDate = null;
      if (this.state.rangeStart && !this.state.rangeEnd) {
        this.renderCalendar();
      }
    };
    this.calendarArea.container.addEventListener('mouseleave', this._onScrollGroupMouseLeave);

    // 面板触控阻止页面滚动
    this._onContainerTouchMove = (e) => {
      if (!this.picker.visible) return;
      e.preventDefault();
    };
    this.container.addEventListener('touchmove', this._onContainerTouchMove, { passive: false });
  }

  // ════════════════════════════════════════════════════════════════
  //  拖拽管理
  // ════════════════════════════════════════════════════════════════

  _onDragStart(clientY) {
    this._stopWheelAnimation();
    this.cellManager.filter(function (c) { return c instanceof YearCell; }).forEach(function (c) { c.stopAnim(); });
    this._dragging = true;
    this._dragStartY = clientY;
    this._dragStartTY = this.state.translateY;
    this._dragMoved = false;
  }

  _onDragMove(clientY) {
    if (!this._dragging) return;
    const delta = clientY - this._dragStartY;
    this.state.translateY = this._dragStartTY + delta;
    this.state._wheelTargetY = this.state.translateY;
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
      const row = Math.floor(-this.state.translateY / this.STEP_Y) - this.BUFFER_ROWS;
      if (Math.abs(row - this._lastRenderRow) > this.BUFFER_ROWS / 2) {
        this.renderCalendar();
      }
    }
  }

  _onDragEnd() {
    // 延迟清除拖拽标志，让紧随的 click 事件仍能看到 _dragging=true，避免关闭选择器
    setTimeout(() => { this._dragging = false; }, 0);
    this._setHoverDisabled(false);
    this._lastDragClientY = undefined;
    if (this._dragMoved) {
      const momentum = Math.max(-300, Math.min(300, this._dragLastDY * 5));
      const currentRow = Math.round(this.state.translateY / this.STEP_Y);
      const targetRow = currentRow + Math.round(momentum / this.STEP_Y);
      this.state._wheelTargetY = targetRow * this.STEP_Y;
      this._startWheelAnimation();
    }
  }

  /** @private */
  _applyScrollTransform() {
    this.calendarArea.setScroll(this.state.translateY);
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
  //  滚轮动画
  // ════════════════════════════════════════════════════════════════

  _startWheelAnimation() {
    if (this._wheelAnimId) return;
    this._setHoverDisabled(true);
    const self = this;
    const step = () => {
      const diff = self.state._wheelTargetY - self.state.translateY;
      if (Math.abs(diff) < 0.5) {
        self.state.translateY = self.state._wheelTargetY;
        self.renderCalendar();
        self._wheelAnimId = null;
        self._setHoverDisabled(false);
        return;
      }
      self.state.translateY += diff * 0.2;
      self._applyScrollTransform();
      const row = Math.floor(-self.state.translateY / self.STEP_Y) - self.BUFFER_ROWS;
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
  //  导航
  // ════════════════════════════════════════════════════════════════

  goToDate(date) {
    const MS_PER_DAY = 86400000;
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const daysDiff = Math.round((targetDate - this.state.startOfWeekZero) / MS_PER_DAY);
    const targetRow = Math.floor(daysDiff / 7);
    const targetSVG_Y = this.GAP + this.STEP_Y + 3 * this.STEP_Y;
    this.state._wheelTargetY = targetSVG_Y - targetRow * this.STEP_Y - this.GAP;
    this._startWheelAnimation();
  }

  /** @private */
  _goToToday() {
    this.goToDate(this.state.today);
  }

  /** @private */
  _getDateOfWeekRow(rowOffset) {
    const MAX_WEEK_OFFSET = 52000;
    rowOffset = Math.max(-MAX_WEEK_OFFSET, Math.min(MAX_WEEK_OFFSET, rowOffset));
    const d = new Date(this.state.startOfWeekZero.getTime());
    d.setDate(d.getDate() + rowOffset * 7);
    return d;
  }

  // ════════════════════════════════════════════════════════════════
  //  表头颜色同步
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
    const sy = this.state.translateY;
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
  //  Hover 管理
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
  //  销毁
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

    // 解绑 SVG 事件
    if (this._onSvgMouseDown) this.svg.removeEventListener('mousedown', this._onSvgMouseDown);
    if (this._onTouchStart) this.svg.removeEventListener('touchstart', this._onTouchStart);
    if (this._onContainerWheel) this.container.removeEventListener('wheel', this._onContainerWheel);
    if (this._onContainerTouchMove) this.container.removeEventListener('touchmove', this._onContainerTouchMove);

    // 移除 DOM
    if (this.container) this.container.remove();
  }
}

export default SvgRenderer;
