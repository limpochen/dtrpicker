/**
 * HtmlRenderer — HTML+CSS 渲染模式
 *
 * 利用 CSS Grid / scroll-snap / CSS 变量等现代 CSS 技术，
 * 提供与 SVG 版本对等的日历选择器体验。
 */
import { getActiveScheme } from '../../config/colors.js';
import { DIM } from '../../config/dimensions.js';
import { dateEqual, dateStr, parseDate } from '../../utils/date.js';
import { saturateColor, blendColors } from '../../utils/color.js';
import TimeFloater from './time-floater.js';

class HtmlRenderer {
  /**
   * @param {dtrPicker} picker - 主实例引用
   */
  constructor(picker) {
    this.picker = picker;
    this.options = picker.options;
    this.state = picker.state;
    this._i18n = picker._i18n;

    /** @type {HTMLDivElement|null} */
    this.container = null;
    /** @type {HTMLDivElement|null} */
    this.panel = null;
    /** @type {HTMLElement|null} 模拟 SVG 引用（指向 panel，供主类 _positionDropdown 使用） */
    this.svg = null;

    // 模拟 SVG renderer 的属性（供主类 _positionDropdown 使用）
    this.SVG_W = 0;
    this.SVG_H = 0;

    // 子区域容器（供主类引用）
    this.headerArea = { container: null };
    this.calendarArea = { container: null };
    this.timeArea = { container: null };

    // 网格常量（模拟 SVG 版，供主类 _positionDropdown 使用）
    this.CELL_W = 40;
    this.CELL_H = DIM.CELL_H;
    this.GAP = DIM.GAP;
    this.STEP_X = this.CELL_W + DIM.GAP;
    this.STEP_Y = DIM.CELL_H + DIM.GAP;
    /** 是否显示侧边栏（年/月列） */
    this._hasSidebar = this.options.yearMonthMode === 'column';
    this.SIDEBAR_COLS = this._hasSidebar ? DIM.SIDEBAR_COLS : 0;
    this.DATE_COL_START = this._hasSidebar ? DIM.DATE_COL_START : 0;
    this.DATE_COLS = DIM.DATE_COLS;
    this.TIME_COL_START = DIM.TIME_COL_START;
    this.TIME_COLS = DIM.TIME_COLS;
    this.HEADER_ROW = DIM.HEADER_ROW;
    this.VISIBLE_DATE_ROWS = DIM.VISIBLE_DATE_ROWS;
    this.BUFFER_ROWS = DIM.BUFFER_ROWS;

    // 状态
    this._hoverDisabled = false;
    this._dragging = false;

    // 时间滚轮兼容对象
    /** @type {Object|null} */
    this.timeWheel = null;

    // 表头
    this._headerCells = [];
    this.headerBarCell = null;

    // DOM 引用
    this._headerEl = null;
    this._bodyEl = null;
    this._timePanelEl = null;
    this._todayBtnEl = null;

    // 当前渲染的行范围
    this._lastRenderRow = null;

    // 渲染基行偏移（用于无限滚动：DOM 行 0 对应数据行 _renderBaseRow）
    this._renderBaseRow = 0;
    /** 重新居中阈值（距边界行数） */
    this._RECENTER_THRESHOLD = 8;

    // RAF 滚动节流句柄
    this._scrollRAF = null;
    // RAF 重居中句柄（独立于 scrollRAF，因为 wheel 事件和 scroll 事件用不同 RAF）
    this._recenterRAF = null;

    // 列宽（默认等于 CELL_W，移动端在 _detectCellW 中覆盖）
    this._sidebarW = this.CELL_W;
    this._dayW = this.CELL_W;
    this._timeW = this.CELL_W;

    // 行缓存
    this._rowCache = new Map();

    /** 移动端 CSS scale 因子（1 = 无缩放） */
    this._scaleFactor = 1;
  }

  // ════════════════════════════════════════════════════════════════
  //  面板创建
  // ════════════════════════════════════════════════════════════════

  _injectCSS() {
    if (document.getElementById('dp-html-css')) return;
    const link = document.createElement('link');
    link.id = 'dp-html-css';
    link.rel = 'stylesheet';
    const base = import.meta.url ? new URL('.', import.meta.url).href : '';
    link.href = base + 'panel.css';
    document.head.appendChild(link);
  }

  _detectCellW() {
    this.CELL_W = DIM.CELL_W;
    this._dayW = this.CELL_W;
    this._sidebarW = this.CELL_W;
    this._timeW = this.CELL_W;
  }

  /**
   * 移动端自适应缩放（CSS transform，HTML 版）。
   *
   * 与 SVG 版原理相同：对 panel 应用 transform: scale()，
   * panel 的 CSS width 保持 SVG_W（Grid 布局不重排），
   * 视觉缩放由 GPU 合成层完成。
   * @private
   */
  _applyScale() {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      this._removeScale();
      return;
    }

    const MARGIN = 16;
    const availableWidth = window.innerWidth - MARGIN * 2;

    if (availableWidth >= this.SVG_W) {
      this._removeScale();
      return;
    }

    const scale = availableWidth / this.SVG_W;
    this._scaleFactor = scale;

    // panel 的 CSS width 保持 SVG_W（Grid 布局不变），仅视觉缩放
    this.panel.style.transformOrigin = '0 0';
    this.panel.style.transform = 'scale(' + scale + ')';
  }

  /** @private */
  _removeScale() {
    if (this._scaleFactor === 1) return;
    this._scaleFactor = 1;
    if (!this.panel) return;
    this.panel.style.transformOrigin = '';
    this.panel.style.transform = '';
  }

  _calcTotalCols() {
    return this.SIDEBAR_COLS + this.DATE_COLS + (this.state.isTimeEnabled() ? this.TIME_COLS : 0);
  }

  _calcTotalWidth() {
    const totalCols = this._calcTotalCols();
    // 总宽 = GAP + (CELL_W + GAP) × 总列数
    return this.GAP + (this.CELL_W + this.GAP) * totalCols;
  }

  _calcTotalHeight() {
    // 总高 = GAP + (CELL_H + GAP) × 9
    return this.GAP + (this.CELL_H + this.GAP) * 9;
  }

  createPanel() {
    this._injectCSS();
    this._detectCellW();

    this.SVG_W = this._calcTotalWidth();
    this.SVG_H = this._calcTotalHeight();

    // ── 容器 ──
    this.container = document.createElement('div');
    this.container.className = 'dtrpicker-container';
    this.container.style.zIndex = this.options.zIndex;

    // ── 面板 ──
    this.panel = document.createElement('div');
    this.panel.className = 'dtrpicker-panel';
    this.panel.style.width = this.SVG_W + 'px';
    this.panel.style.height = this.SVG_H + 'px';
    // 将 JS 网格常量同步为 CSS 变量，panel.css 中不再写死
    this.panel.style.setProperty('--dp-cell-h', this.CELL_H + 'px');
    this.panel.style.setProperty('--dp-gap', this.GAP + 'px');
    this.panel.style.setProperty('--dp-col-sidebar', this._hasSidebar ? this._sidebarW + 'px' : '0px');
    this.panel.style.setProperty('--dp-col-day', this._dayW + 'px');
    this.panel.style.setProperty('--dp-col-time', this._timeW + 'px');
    // 从当前色系同步颜色 CSS 变量
    const o = this.options;
    this.panel.style.setProperty('--dp-selected', o.selectedColor);
    this.panel.style.setProperty('--dp-grid-color', o.gridColor);
    this.panel.style.setProperty('--dp-cell-bg', o.cellColor);
    this.panel.style.setProperty('--dp-text', o.textColor);
    this.panel.style.setProperty('--dp-text-disabled', o.textColorDisabled);
    this.panel.style.setProperty('--dp-text-selected', o.selectedTextColor);
    this.panel.style.setProperty('--dp-text-sublabel', o.textColorSubLabel);
    this.panel.style.setProperty('--dp-weekend', o.textColorWeekend);
    this.panel.style.setProperty('--dp-weekend-title', o.textColorWeekendTitle);
    this.panel.style.setProperty('--dp-today-bar', o.todayBarColor);

    // ── 表头（跨越全部列，与 SVG 一致） ──
    this._headerEl = document.createElement('div');
    this._headerEl.className = 'dp-header';
    this.panel.appendChild(this._headerEl);
    this.headerArea.container = this._headerEl;

    // ── 内容区（日历 + 时间面板并排） ──
    const content = document.createElement('div');
    content.className = 'dp-content';
    this.panel.appendChild(content);

    // 内容体（可滚动的 9 列日历）
    this._bodyEl = document.createElement('div');
    this._bodyEl.className = 'dp-body';
    // body 高度由 flex:1 + stretch 自动填满 dp-content，不设固定 height
    content.appendChild(this._bodyEl);
    this.calendarArea.container = this._bodyEl;

    // ── 时间面板（固定） ──
    if (this.state.isTimeEnabled()) {
      this._timePanelEl = document.createElement('div');
      this._timePanelEl.className = 'dp-time-panel';
      content.appendChild(this._timePanelEl);
      this.timeArea.container = this._timePanelEl;
    }

    // ── 今日按钮（使用与 SVG 统一的尺寸常量） ──
    const {
      SIZE, MARGIN, RING_R, DOT_R, STROKE_W, SHADOW_X, SHADOW_Y,
    } = DIM.TODAY_BTN;
    this._todayBtnEl = document.createElement('button');
    this._todayBtnEl.className = 'dp-today-btn';
    this._todayBtnEl.style.width = SIZE + 'px';
    this._todayBtnEl.style.height = SIZE + 'px';
    this._todayBtnEl.style.bottom = MARGIN + 'px';
    this._todayBtnEl.style.left = MARGIN + 'px';
    this._todayBtnEl.style.boxShadow = SHADOW_X + 'px ' + SHADOW_Y + 'px rgba(0,0,0,0.30)';
    this._todayBtnEl.innerHTML = '<svg viewBox="0 0 16 16" fill="none">'
      + '<circle cx="8" cy="8" r="' + RING_R + '" stroke="' + this.options.selectedColor
      + '" stroke-width="' + STROKE_W + '"/><circle cx="8" cy="8" r="' + DOT_R + '" fill="'
      + this.options.selectedColor + '"/></svg>';
    content.appendChild(this._todayBtnEl);
    this._todayBtnEl.addEventListener('click', (e) => { e.stopPropagation(); this._goToToday(); });

    // ── 组装 ──
    this.container.appendChild(this.panel);

    // 版本号（由 DIM.SHOW_VERSION 控制是否显示）
    if (DIM.SHOW_VERSION) {
      const verEl = document.createElement('div');
      verEl.textContent = DIM.VERSION;
      verEl.style.cssText = 'position:absolute;bottom:2px;left:4px;font-size:9px;color:#aaa;pointer-events:none;user-select:none;';
      this.container.appendChild(verEl);
    }

    document.body.appendChild(this.container);

    // 同步到主实例
    this.svg = this.panel;
    this.picker.svg = this.svg;
    this.picker.SVG_W = this.SVG_W;
    this.picker.yearGroup = null;
    this.picker.headerArea = this.headerArea;
    this.picker.calendarArea = this.calendarArea;
    this.picker._hoverDisabled = this._hoverDisabled;
    this.picker.timeWheel = this.timeWheel;

    // 初始渲染
    this.renderWeekHeader();
    this.renderCalendar();
    this._initTimeWheel();

    // 移动端自适应缩放（CSS transform，不改变 Grid 布局）
    this._applyScale();
  }

  // ════════════════════════════════════════════════════════════════
  //  表头渲染
  // ════════════════════════════════════════════════════════════════

  renderWeekHeader() {
    this._headerEl.innerHTML = '';
    this._headerCells = [];

    const hTotalCols = this._calcTotalCols();
    const cols = [];
    if (this._hasSidebar) {
      cols.push(this._sidebarW + 'px');
      cols.push(this._sidebarW + 'px');
    }
    for (let i = 0; i < 7; i++) cols.push(this._dayW + 'px');
    if (this.state.isTimeEnabled()) {
      cols.push(this._timeW + 'px');
      cols.push(this._timeW + 'px');
    }
    this._headerEl.style.gridTemplateColumns = cols.join(' ');

    const i18n = this._i18n;

    if (this._hasSidebar) {
      this._addHeaderCell(i18n.year, false);
      this._addHeaderCell(i18n.month, false);
    }

    const fd = this.options.firstDay || 0;
    const weeks = fd === 0
      ? i18n.weekdays
      : [...i18n.weekdays.slice(fd), ...i18n.weekdays.slice(0, fd)];
    weeks.forEach((w, i) => {
      const isWeekend = (this.options.firstDay === 0 && (i === 0 || i === 6))
        || (this.options.firstDay === 1 && (i === 5 || i === 6));
      this._addHeaderCell(w, isWeekend);
    });

    if (this.state.isTimeEnabled()) {
      this._addHeaderCell(i18n.hour, false);
      this._addHeaderCell(i18n.minute, false);
    }

    this.picker._headerCells = this._headerCells;
  }

  _addHeaderCell(label, isWeekend) {
    const cell = document.createElement('div');
    cell.className = 'dp-header-cell' + (isWeekend ? ' dp-header-cell--weekend' : '');
    cell.textContent = label;
    this._headerEl.appendChild(cell);
    this._headerCells.push(cell);
  }

  // ════════════════════════════════════════════════════════════════
  //  日历渲染
  // ════════════════════════════════════════════════════════════════

  _getDateOfWeekRow(rowOffset) {
    const MAX_OFFSET = 52000;
    rowOffset = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, rowOffset));
    const d = new Date(this.state.startOfWeekZero.getTime());
    d.setDate(d.getDate() + rowOffset * 7);
    return d;
  }

  renderCalendar() {
    this._bodyEl.innerHTML = '';

    const baseRow = this._renderBaseRow;
    // 渲染 52 行，配合无限滚动：baseRow 偏移确保永远看不到尽头
    const totalRenderRows = 52;
    // body 的 CSS height 已在 createPanel 中固定为 8 行视口高度，
    // 52 行内容自然溢出形成滚动区，此处不重复设置

    const totalCols = this._calcTotalCols();
    const cols = [];
    if (this._hasSidebar) {
      cols.push(this._sidebarW + 'px');
      cols.push(this._sidebarW + 'px');
    }
    for (let i = 0; i < 7; i++) cols.push(this._dayW + 'px');
    const colTemplate = cols.join(' ');

    const scheme = getActiveScheme(this.options);
    const schemeColors = scheme.colors;
    const schemeLen = schemeColors.length;
    const cs = this.state._colorShift;

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

    // 预计算各行颜色
    const rowColors = [];
    for (let i = 0; i < totalRenderRows; i++) {
      const rowDate = this._getDateOfWeekRow(i + baseRow);
      const monthCounts = {};
      for (let col = 0; col < 7; col++) {
        const d = new Date(rowDate);
        d.setDate(rowDate.getDate() + col);
        const m = d.getMonth();
        monthCounts[m] = (monthCounts[m] || 0) + 1;
      }
      const mKeys = Object.keys(monthCounts).map(Number);
      let bgColor;
      if (mKeys.length === 1) {
        bgColor = schemeColors[(mKeys[0] + cs) % schemeLen];
      } else {
        const m1 = Math.min(...mKeys);
        const m2 = Math.max(...mKeys);
        bgColor = blendColors(
          schemeColors[(m1 + cs) % schemeLen],
          schemeColors[(m2 + cs) % schemeLen],
          monthCounts[m2] / 7
        );
      }
      rowColors.push(bgColor);
    }

    // 预计算各行年颜色（与 YearCell._cellColor(year+2) 一致）
    const rowYearColors = [];
    for (let i = 0; i < totalRenderRows; i++) {
      const rowDate = this._getDateOfWeekRow(i + baseRow);
      const yearCounts = {};
      for (let col = 0; col < 7; col++) {
        const d = new Date(rowDate);
        d.setDate(rowDate.getDate() + col);
        const y = d.getFullYear();
        yearCounts[y] = (yearCounts[y] || 0) + 1;
      }
      const yKeys = Object.keys(yearCounts).map(Number);
      let yBg;
      if (yKeys.length === 1) {
        yBg = schemeColors[(yKeys[0] + 2 + cs) % schemeLen];
      } else {
        const y1 = Math.min(...yKeys);
        const y2 = Math.max(...yKeys);
        const pure1 = schemeColors[(y1 + 2 + cs) % schemeLen];
        const pure2 = schemeColors[(y2 + 2 + cs) % schemeLen];
        yBg = blendColors(pure1, pure2, yearCounts[y2] / 7);
      }
      rowYearColors.push(yBg);
    }

    // ---- 收集纯月段 / 纯年段（使用实际数据行号） ----
    const pureSegments = [];
    const pureYears = [];
    for (let i = 0; i < totalRenderRows; i++) {
      const actualRow = i + baseRow;
      const rowDate = this._getDateOfWeekRow(actualRow);
      const rowMonth = rowDate.getMonth();
      const rowYear = rowDate.getFullYear();

      // 纯月段（startRow/endRow 使用 DOM 行号以便定位）
      let pureMonth = true;
      for (let col = 1; col < 7; col++) {
        const d = new Date(rowDate);
        d.setDate(rowDate.getDate() + col);
        if (d.getMonth() !== rowMonth) { pureMonth = false; break; }
      }
      if (pureMonth) {
        const last = pureSegments[pureSegments.length - 1];
        if (last && last.month === rowMonth && last.startRow + (last.endRow - last.startRow) === i) {
          last.endRow = i + 1;
        } else {
          pureSegments.push({ month: rowMonth, startRow: i, endRow: i + 1 });
        }
      }

      // 纯年段
      let pureYear = true;
      for (let col = 1; col < 7; col++) {
        const d = new Date(rowDate);
        d.setDate(rowDate.getDate() + col);
        if (d.getFullYear() !== rowYear) { pureYear = false; break; }
      }
      if (pureYear) {
        const last = pureYears[pureYears.length - 1];
        if (last && last.year === rowYear && last.startRow + (last.endRow - last.startRow) === i) {
          last.endRow = i + 1;
        } else {
          pureYears.push({ year: rowYear, startRow: i, endRow: i + 1 });
        }
      }
    }

    // 设置 body 的 grid 列模板
    this._bodyEl.style.gridTemplateColumns = colTemplate;

    // ---- 使用 DocumentFragment 批量创建 DOM，减少回流 ----
    const fragment = document.createDocumentFragment();

    // ---- 建立跨行合并查找表 ----
    const monthStartAt = new Map();
    pureSegments.forEach(seg => { monthStartAt.set(seg.startRow, seg); });
    const yearStartAt = new Map();
    pureYears.forEach(seg => { yearStartAt.set(seg.startRow, seg); });

    const monthCoveredByTall = new Array(totalRenderRows).fill(false);
    pureSegments.forEach(seg => {
      for (let r = seg.startRow; r < seg.endRow; r++) monthCoveredByTall[r] = true;
    });
    const yearCoveredByTall = new Array(totalRenderRows).fill(false);
    pureYears.forEach(seg => {
      for (let r = seg.startRow; r < seg.endRow; r++) yearCoveredByTall[r] = true;
    });

    // ---- 渲染格子（纯年/月段用跨行合并格，过渡行用逐行格） ----
    for (let i = 0; i < totalRenderRows; i++) {
      const rowDate = this._getDateOfWeekRow(i + baseRow);
      const rowBg = rowColors[i];
      const rowYearBg = rowYearColors[i];

      // 年列 — 纯年段用跨行合并格，否则逐行（仅 column 模式显示）
      if (this._hasSidebar) {
      const ySeg = yearStartAt.get(i);
      if (ySeg) {
        const tall = document.createElement('div');
        tall.className = 'dp-cell dp-year-cell';
        tall.textContent = String(ySeg.year);
        tall.style.background = saturateColor(rowYearBg, 0.08);
        tall.style.gridRow = `${i + 1} / span ${ySeg.endRow - ySeg.startRow}`;
        tall.style.height = 'auto';
        tall.style.overflow = 'hidden';
        fragment.appendChild(tall);
      } else if (!yearCoveredByTall[i]) {
        const yearCell = document.createElement('div');
        yearCell.className = 'dp-cell dp-year-cell';
        yearCell.style.background = saturateColor(rowYearBg, 0.08);
        fragment.appendChild(yearCell);
      }
      } // end if _hasSidebar

      // 月列 — 纯月段用跨行合并格，否则逐行（仅 column 模式显示）（仅 column 模式显示）
      if (this._hasSidebar) {
      const mSeg = monthStartAt.get(i);
      if (mSeg) {
        const tall = document.createElement('div');
        tall.className = 'dp-cell dp-month-cell';
        tall.textContent = this._i18n.months[mSeg.month];
        tall.style.background = saturateColor(rowBg, 0.04);
        tall.style.gridRow = `${i + 1} / span ${mSeg.endRow - mSeg.startRow}`;
        tall.style.height = 'auto';
        tall.style.overflow = 'hidden';
        fragment.appendChild(tall);
      } else if (!monthCoveredByTall[i]) {
        const monthCell = document.createElement('div');
        monthCell.className = 'dp-cell dp-month-cell';
        monthCell.style.background = saturateColor(rowBg, 0.04);
        fragment.appendChild(monthCell);
      }
      } // end if _hasSidebar

      // 7 天
      for (let col = 0; col < 7; col++) {
        const dayDate = new Date(rowDate);
        dayDate.setDate(rowDate.getDate() + col);
        const dayNum = dayDate.getDate();
        const dateStrVal = dateStr(dayDate);
        const role = isStartOrEnd(dayDate);
        const inRange = isInSelectedRange(dayDate);
        const isToday = dateEqual(dayDate, this.state.today);

        const dayEl = document.createElement('div');
        dayEl.className = 'dp-cell dp-day-cell';
        dayEl.style.background = schemeColors[(dayDate.getMonth() + cs) % schemeLen];
        dayEl.dataset.date = dateStrVal;

        if (role === 'start') dayEl.classList.add('dp-day-cell--start');
        if (role === 'end') dayEl.classList.add('dp-day-cell--end');
        if (inRange) dayEl.classList.add('dp-day-cell--in-range');
        if (isToday) dayEl.classList.add('dp-day-cell--today');
        // 周末
        const dow = dayDate.getDay();
        if (dow === 0 || dow === 6) dayEl.classList.add('dp-day-cell--weekend');

        dayEl.textContent = String(dayNum);
        fragment.appendChild(dayEl);
      }
    }

    // 同步表头颜色（在挂载 DOM 之前，与 fragment 合并到同一次 layout）
    this._syncHeaderColors();

    // 一次性挂载所有行到 DOM
    this._bodyEl.appendChild(fragment);

    // 水印模式：年月叠加显示
    if (!this._hasSidebar) {
      this._renderWatermark(baseRow, totalRenderRows);
    }

    // 更新年份（基于当前 baseRow）
    const centerRow = Math.floor(totalRenderRows / 2);
    const centerDate = this._getDateOfWeekRow(centerRow + baseRow);
    this.state._visibleYear = centerDate.getFullYear();
  }

  /**
   * 水印模式：在日期区叠加显示年月大字号文字。
   * 参照 SvgRenderer.renderCalendar() 中水印实现，使用 DOM 绝对定位模拟。
   * @private
   * @param {number} baseRow - 当前渲染基行偏移（数据行号偏移，用于 _getDateOfWeekRow）
   * @param {number} totalRows - 本次渲染总行数
   */
  _renderWatermark(baseRow, totalRows) {
    // 收集各年月在网格中的行范围 key: "year-month" => { startRow, endRow }
    const monthRanges = {};
    for (let i = 0; i < totalRows; i++) {
      const rowDate = this._getDateOfWeekRow(i + baseRow);
      const monthsInRow = new Set();
      for (let col = 0; col < this.DATE_COLS; col++) {
        const d = new Date(rowDate);
        d.setDate(rowDate.getDate() + col);
        monthsInRow.add(d.getFullYear() + '-' + d.getMonth());
      }
      for (const key of monthsInRow) {
        if (!monthRanges[key]) {
          monthRanges[key] = { startRow: i, endRow: i };
        } else {
          monthRanges[key].endRow = i;
        }
      }
    }

    const dateLeft = this.GAP;
    const dateWidth = this.DATE_COLS * this.CELL_W + (this.DATE_COLS - 1) * this.GAP;

    // 确保 _bodyEl 作为水印绝对定位的锚点
    this._bodyEl.style.position = 'relative';

    for (const key in monthRanges) {
      const seg = monthRanges[key];
      const [yearNum, monthNum] = key.split('-').map(Number);

      const topPx = this.GAP + seg.startRow * this.STEP_Y;
      const heightPx = (seg.endRow - seg.startRow + 1) * this.CELL_H
                     + (seg.endRow - seg.startRow) * this.GAP;

      const label = this._i18n.yearFirst
        ? String(yearNum) + this._i18n.year + ' ' + this._i18n.months[monthNum]
        : this._i18n.months[monthNum] + ' ' + String(yearNum);

      const el = document.createElement('div');
      el.textContent = label;
      el.style.cssText = [
        'position:absolute',
        'left:' + dateLeft + 'px',
        'top:' + topPx + 'px',
        'width:' + dateWidth + 'px',
        'height:' + heightPx + 'px',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'color:' + this.options.textColor,
        'opacity:0.2',
        'font-size:40px',
        'font-style:italic',
        'font-weight:700',
        'pointer-events:none',
        'user-select:none',
        'white-space:nowrap',
        'overflow:hidden',
      ].join(';');
      this._bodyEl.appendChild(el);
    }
  }

  /** 表头颜色同步：按列取第一行数据格的颜色，给每个表头格设背景色 */
  _syncHeaderColors() {
    if (!this._headerCells || this._headerCells.length === 0) return;

    const scheme = getActiveScheme(this.options);
    const schemeColors = scheme.colors;
    const schemeLen = schemeColors.length;
    const cs = this.state._colorShift;
    const rowDate = this._getDateOfWeekRow(this._renderBaseRow);

    const colors = [];

    // 年/月列（仅 column 模式显示）
    if (this._hasSidebar) {
      const yKeys = [rowDate.getFullYear()];
      colors.push(saturateColor(schemeColors[(yKeys[0] + 2 + cs) % schemeLen], 0.08));
      colors.push(saturateColor(schemeColors[(rowDate.getMonth() + cs) % schemeLen], 0.04));
    }

    // 日期列（7天逐列取月份色）
    for (let col = 0; col < 7; col++) {
      const d = new Date(rowDate);
      d.setDate(rowDate.getDate() + col);
      colors.push(schemeColors[(d.getMonth() + cs) % schemeLen]);
    }

    // 时间列（取首月色调，降低饱和度以示区分）
    if (this.state.isTimeEnabled()) {
      const baseTimeColor = schemeColors[(rowDate.getMonth() + cs) % schemeLen];
      colors.push(saturateColor(baseTimeColor, 0.06));
      colors.push(saturateColor(baseTimeColor, 0.06));
    }

    this._headerCells.forEach((cell, idx) => {
      if (idx < colors.length) {
        cell.style.background = colors[idx];
      }
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  时间滚轮
  // ════════════════════════════════════════════════════════════════

  _initTimeWheel() {
    if (!this.state.isTimeEnabled()) {
      this.timeWheel = null;
      return;
    }
    if (!this._timePanelEl) return;

    this._timePanelEl.innerHTML = '';

    const isRange = this.state.isTimeRange();

    // 时间面板高度 — 根据模式计算
    let timeContentH;
    if (isRange) {
      // 范围模式：标题(36) + gap(1) + 时分区(110) + gap(1) + 标题(36) + gap(1) + 时分区(110) = 295
      timeContentH = this.CELL_H * 8 + this.GAP * 7;
    } else {
      // 单时间模式：满高（8行 = 295px），规范要求
      timeContentH = this.CELL_H * 8 + this.GAP * 7;
    }
    this._timePanelEl.style.height = timeContentH + 'px';
    this._timePanelEl.style.width = (this.CELL_W * 2 + this.GAP) + 'px';
    this._timePanelEl.style.display = 'flex';
    this._timePanelEl.style.flexDirection = 'column';

    // ─── 数据模型 ───
    const data = {
      startHour: 0, startMinute: 0,
      endHour: 0, endMinute: 0,
    };
    const self = this;

    // ─── 工具：取环绕中心值的可见值列表 ───
    function getTimeVals(center, all, count) {
      const half = Math.floor(count / 2);
      const r = [];
      for (let i = -half; i <= half; i++) {
        r.push(((center + i) % all.length + all.length) % all.length);
      }
      return r;
    }

    // ─── TimeColumn：时/分列的独立对象 ───
    function TimeColumn(cfg) {
      this.getVal = cfg.getVal;
      this.setVal = cfg.setVal;
      this.allVals = cfg.allVals;
      this.spanCount = cfg.spanCount;
      this.prefix = cfg.prefix;
      this._onStep = cfg.onStep || function () {};
      this.spans = [];
      this.el = null;
      this._init(cfg.colBg, cfg.h, cfg.cellW);
    }

    TimeColumn.prototype._init = function (colBg, h, cellW) {
      const col = document.createElement('div');
      col.className = 'dp-time-col';
      col.style.cssText = `height:${h}px;width:${cellW}px;display:flex;flex-direction:column;background:${colBg}`;
      const cur = this.getVal();
      getTimeVals(cur, this.allVals, this.spanCount).forEach(function (v, idx) {
        const s = document.createElement('span');
        s.id = this.prefix + '-' + idx;
        s.textContent = String(v).padStart(2, '0');
        if (v === cur) s.className = 'dp-selected';
        col.appendChild(s);
        this.spans.push(s);
      }, this);
      this.el = col;
    };

    /** 按方向步进：dir = +1 或 -1 */
    TimeColumn.prototype.step = function (dir) {
      const cur = this.getVal();
      const next = ((cur + dir) % this.allVals.length + this.allVals.length) % this.allVals.length;
      this.setVal(next);

      const vals = getTimeVals(next, this.allVals, this.spanCount);
      for (let i = 0; i < this.spans.length; i++) {
        const sp = this.spans[i];
        sp.textContent = String(vals[i]).padStart(2, '0');
        sp.className = vals[i] === next ? 'dp-selected' : '';
      }
      this._onStep();
    };

    // ─── EventCenter：采集输入事件，归一化后驱动 TimeColumn ───
    function EventCenter() {
      this.cols = [];        // { col: TimeColumn, el: HTMLElement }
      this._dragState = null; // { startY, acc }
    }

    EventCenter.prototype.attach = function (col, floaterInfo) {
      this.cols.push(col);
      const el = col.el;

      // 滚轮
      el.addEventListener('wheel', function (e) {
        e.preventDefault();
        col.step(e.deltaY > 0 ? 1 : -1);
      });

      // 鼠标拖动
      el.addEventListener('mousedown', function (e) {
        e.preventDefault();
        self._dragging = true;
        this._dragState = { lastY: e.clientY };
        // 显示放大浮层
        if (floaterInfo) {
          self._timeFloater.show(floaterInfo.el, floaterInfo.type, floaterInfo.getVal, floaterInfo.min, floaterInfo.max, floaterInfo.bgColor);
        }
        const doc = el.ownerDocument;
        const onMove = function (e2) {
          e2.preventDefault();
          const dy = e2.clientY - this._dragState.lastY;
          if (Math.abs(dy) >= 18) {
            const dir = dy > 0 ? 1 : -1;
            const steps = Math.floor(Math.abs(dy) / 18);
            for (let i = 0; i < steps; i++) col.step(dir);
            this._dragState.lastY = e2.clientY;
          }
          // 更新放大浮层
          if (floaterInfo) {
            self._timeFloater.update(floaterInfo.getVal, floaterInfo.min, floaterInfo.max);
          }
        }.bind(this);
        const onUp = function () {
          doc.removeEventListener('mousemove', onMove);
          doc.removeEventListener('mouseup', onUp);
          this._dragState = null;
          // 隐藏放大浮层
          if (floaterInfo) self._timeFloater.hide();
          // 延迟清除拖动标志，让紧随的 click 事件仍能看到 _dragging=true，避免关闭选择器
          setTimeout(function () { self._dragging = false; }, 0);
        }.bind(this);
        doc.addEventListener('mousemove', onMove);
        doc.addEventListener('mouseup', onUp);
      }.bind(this));

      // 触控滑动
      el.addEventListener('touchstart', function (e) {
        self._dragging = true;
        this._dragState = { lastY: e.touches[0].clientY };
        // 显示放大浮层
        if (floaterInfo) {
          self._timeFloater.show(floaterInfo.el, floaterInfo.type, floaterInfo.getVal, floaterInfo.min, floaterInfo.max, floaterInfo.bgColor);
        }
      }.bind(this));

      el.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (!this._dragState) return;
        const dy = e.touches[0].clientY - this._dragState.lastY;
        if (Math.abs(dy) >= 18) {
          const dir = dy > 0 ? 1 : -1;
          const steps = Math.floor(Math.abs(dy) / 18);
          for (let i = 0; i < steps; i++) col.step(dir);
          this._dragState.lastY = e.touches[0].clientY;
        }
        // 更新放大浮层
        if (floaterInfo) {
          self._timeFloater.update(floaterInfo.getVal, floaterInfo.min, floaterInfo.max);
        }
      }.bind(this));

      el.addEventListener('touchend', function () {
        this._dragState = null;
        // 隐藏放大浮层
        if (floaterInfo) self._timeFloater.hide();
        setTimeout(function () { self._dragging = false; }, 0);
      }.bind(this));
    };

    EventCenter.prototype.destroy = function () {
      this.cols = [];
      this._dragState = null;
    };

    // ─── 创建 EventCenter 与放大浮层 ───
    const eventCenter = new EventCenter();
    self._timeFloater = new TimeFloater({
      panel: self.panel,
      selectedColor: this.options.selectedColor,
      textColor: this.options.textColor,
      selectedTextColor: this.options.selectedTextColor,
    });

    // ─── 装配辅助 ───
    function makeCol(getVal, setVal, allVals, spanCount, colBg, prefix, h) {
      const col = new TimeColumn({
        getVal, setVal, allVals, spanCount, prefix, colBg,
        h: h || timeContentH,
        cellW: self.CELL_W,
        onStep: function () { if (self.timeWheel && self.timeWheel.onTimeChange) self.timeWheel.onTimeChange(); },
      });
      eventCenter.attach(col, {
        el: col.el,
        type: prefix,
        getVal: getVal,
        min: allVals[0],
        max: allVals[allVals.length - 1],
        bgColor: colBg,
      });
      return col;
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const mins = Array.from({ length: 60 }, (_, i) => i);

    const scheme = getActiveScheme(this.options);
    const sc = scheme.colors;
    const sLen = sc.length;
    const cs = this.state._colorShift;

    if (isRange) {
      if (this._startColorIdx === undefined) {
        this._startColorIdx = Math.floor(Math.random() * sLen);
        do { this._endColorIdx = Math.floor(Math.random() * sLen); } while (this._endColorIdx === this._startColorIdx);
      }
      const startIdx = (this._startColorIdx + cs) % sLen;
      const endIdx = (this._endColorIdx + cs) % sLen;

      const colsH = Math.floor((timeContentH - 2 * self.CELL_H - 3 * self.GAP) / 2);

      // 开始标题
      const stTitle = document.createElement('div');
      stTitle.className = 'dp-title-bar';
      stTitle.style.width = (this.CELL_W * 2 + this.GAP) + 'px';
      stTitle.style.background = saturateColor(sc[startIdx], 0.06);
      const stLabel = document.createElement('span');
      stLabel.textContent = this._i18n.start;
      stTitle.appendChild(stLabel);
      this._timePanelEl.appendChild(stTitle);

      // 开始列组
      const stCols = document.createElement('div');
      stCols.className = 'dp-time-columns';
      stCols.style.background = 'transparent';
      stCols.style.height = colsH + 'px';
      stCols.appendChild(makeCol(function () { return data.startHour; }, function (v) { data.startHour = v; }, hours, 5, saturateColor(sc[startIdx], 0.04), 'sh', colsH).el);
      stCols.appendChild(makeCol(function () { return data.startMinute; }, function (v) { data.startMinute = v; }, mins, 5, saturateColor(sc[startIdx], 0.02), 'sm', colsH).el);
      this._timePanelEl.appendChild(stCols);

      // 结束标题
      const edTitle = document.createElement('div');
      edTitle.className = 'dp-title-bar';
      edTitle.style.width = (this.CELL_W * 2 + this.GAP) + 'px';
      edTitle.style.background = saturateColor(sc[endIdx], 0.06);
      const edLabel = document.createElement('span');
      edLabel.textContent = this._i18n.end;
      edTitle.appendChild(edLabel);
      this._timePanelEl.appendChild(edTitle);

      // 结束列组
      const edCols = document.createElement('div');
      edCols.className = 'dp-time-columns';
      edCols.style.background = 'transparent';
      edCols.style.height = colsH + 'px';
      edCols.appendChild(makeCol(function () { return data.endHour; }, function (v) { data.endHour = v; }, hours, 5, saturateColor(sc[endIdx], 0.04), 'eh', colsH).el);
      edCols.appendChild(makeCol(function () { return data.endMinute; }, function (v) { data.endMinute = v; }, mins, 5, saturateColor(sc[endIdx], 0.02), 'em', colsH).el);
      this._timePanelEl.appendChild(edCols);
    } else {
      // 单时间模式
      if (this._singleColorIdx === undefined) {
        this._singleColorIdx = Math.floor(Math.random() * sLen);
      }
      const singleIdx = (this._singleColorIdx + cs) % sLen;

      const cols = document.createElement('div');
      cols.className = 'dp-time-columns';
      cols.style.background = 'transparent';
      cols.style.height = timeContentH + 'px';
      cols.appendChild(makeCol(function () { return data.startHour; }, function (v) { data.startHour = v; data.endHour = v; }, hours, 9, saturateColor(sc[singleIdx], 0.06), 'h').el);
      cols.appendChild(makeCol(function () { return data.startMinute; }, function (v) { data.startMinute = v; data.endMinute = v; }, mins, 9, saturateColor(sc[singleIdx], 0.02), 'm').el);
      this._timePanelEl.appendChild(cols);
      this._timePanelEl.style.justifyContent = 'center';
    }

    // 兼容 timeWheel 接口
    this.timeWheel = {
      data,
      get startHour() { return data.startHour; },
      set startHour(v) { data.startHour = v; },
      get startMinute() { return data.startMinute; },
      set startMinute(v) { data.startMinute = v; },
      get endHour() { return data.endHour; },
      set endHour(v) { data.endHour = v; },
      get endMinute() { return data.endMinute; },
      set endMinute(v) { data.endMinute = v; },
      clear() {
        data.startHour = 0; data.startMinute = 0;
        data.endHour = 0; data.endMinute = 0;
      },
      render() {},
      destroy() {
        if (self._timeFloater) { self._timeFloater.destroy(); self._timeFloater = null; }
        eventCenter.destroy();
        self.timeWheel = null;
      },
      onTimeChange: null,
      clearHoverFills() {},
    };

    this.picker.timeWheel = this.timeWheel;
    // 注册时间变化通知 → picker._fireChange()
    this.timeWheel.onTimeChange = () => this.picker._fireChange();
  }

  // ════════════════════════════════════════════════════════════════
  //  事件绑定
  // ════════════════════════════════════════════════════════════════

  bindEvents() {
    // 日期点击（拖拽中不触发选中）
    this._bodyEl.addEventListener('click', (e) => {
      if (this._dragging) return;
      const dayEl = e.target.closest('.dp-day-cell');
      if (!dayEl) return;
      const ds = dayEl.dataset.date;
      if (!ds) return;
      const d = parseDate(ds);
      if (d) this.picker._handleDateClick(d);
    });

    // 鼠标拖拽日历内容滚动（wheel/touch 保持原生流畅滚动）
    this._bodyEl.addEventListener('mousedown', (e) => {
      // 忽略滚动条和交互元素上的 mousedown
      if (e.button !== 0) return;
      const bodyState = { lastY: e.clientY, moved: false };
      const doc = this._bodyEl.ownerDocument;
      const onMove = (e2) => {
        const dy = bodyState.lastY - e2.clientY;
        if (!bodyState.moved) {
          if (Math.abs(dy) < 5) return;
          bodyState.moved = true;
          this._dragging = true;
        }
        this._bodyEl.scrollTop += dy;
        bodyState.lastY = e2.clientY;
        // 拖拽时也检测边界触发重居中（与 wheel 事件同机制）
        if (!this._recenterRAF) {
          this._recenterRAF = requestAnimationFrame(() => {
            this._recenterRAF = null;
            this._recenterRender();
          });
        }
      };
      const onUp = () => {
        doc.removeEventListener('mousemove', onMove);
        doc.removeEventListener('mouseup', onUp);
        if (bodyState.moved) {
          setTimeout(() => { this._dragging = false; }, 0);
        }
      };
      doc.addEventListener('mousemove', onMove);
      doc.addEventListener('mouseup', onUp);
    });

    // 滚动更新年份（scroll 事件只用来更新年份，因为到底/顶后 scroll 不再触发）
    this._bodyEl.addEventListener('scroll', () => {
      if (this._scrollRAF) return;
      this._scrollRAF = requestAnimationFrame(() => {
        this._scrollRAF = null;
        const rowH = this.CELL_H + this.GAP;
        const scrollTop = this._bodyEl.scrollTop;
        const centerDomRow = Math.floor(scrollTop / rowH) + Math.floor(this.VISIBLE_DATE_ROWS / 2);
        const centerDataRow = centerDomRow + this._renderBaseRow;
        const d = this._getDateOfWeekRow(centerDataRow);
        this.state._visibleYear = d.getFullYear();
      });
    });

    // 用 wheel 事件检测边界触发重居中（scroll 到底/顶后不再触发，wheel 始终触发）
    this._bodyEl.addEventListener('wheel', () => {
      if (this._recenterRAF) return;
      this._recenterRAF = requestAnimationFrame(() => {
        this._recenterRAF = null;
        this._recenterRender();
      });
    });

  }

  // ════════════════════════════════════════════════════════════════
  //  导航
  // ════════════════════════════════════════════════════════════════

  goToDate(date, smooth) {
    if (!this._bodyEl) return;
    const MS_PER_DAY = 86400000;
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const daysDiff = Math.round((targetDate - this.state.startOfWeekZero) / MS_PER_DAY);
    const targetRow = Math.floor(daysDiff / 7);
    const rowH = this.CELL_H + this.GAP;
    // 重设 baseRow 使目标行处于渲染窗口中间
    this._renderBaseRow = targetRow - Math.floor(52 / 2);
    this.renderCalendar();
    const targetScroll = (targetRow - this._renderBaseRow) * rowH - 3 * rowH;
    requestAnimationFrame(() => {
      if (smooth) {
        this._bodyEl.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      } else {
        this._bodyEl.scrollTop = Math.max(0, targetScroll);
      }
    });
  }

  /**
   * 无限滚动重居中——当 DOM 滚动接近渲染窗口边界时，
   * 调整 _renderBaseRow 并重绘，补偿 scrollTop 以保持视觉位置不变。
   */
  _recenterRender() {
    if (!this._bodyEl) return;
    const rowH = this.CELL_H + this.GAP;
    const scrollTop = this._bodyEl.scrollTop;
    const maxScroll = this._bodyEl.scrollHeight - this._bodyEl.clientHeight;
    const centerDomRow = scrollTop / rowH;
    const TH = this._RECENTER_THRESHOLD;
    const HALF = Math.floor(52 / 2); // 每次偏移半个窗口

    let shift = 0;
    if (centerDomRow < TH) {
      // 接近顶部 → 向过去偏移（减小 baseRow），补偿 scrollTop
      shift = -HALF;
    } else if (centerDomRow >= 52 - TH) {
      // 接近底部 → 向未来偏移（增大 baseRow），补偿 scrollTop
      shift = HALF;
    }

    if (shift === 0) return;

    const prevScrollTop = scrollTop;
    this._renderBaseRow += shift;
    this.renderCalendar();
    // 补偿 scrollTop：内容偏移了 shift 行，滚动位置反向调整（shift 正→内容下移→scrollTop 减小）
    this._bodyEl.scrollTop = prevScrollTop - shift * rowH;
  }

  _goToToday() {
    this.goToDate(this.state.today, true);
  }

  // ════════════════════════════════════════════════════════════════
  //  尺寸更新
  // ════════════════════════════════════════════════════════════════

  _updateSVGSize() {
    this.SVG_W = this._calcTotalWidth();
    this.SVG_H = this._calcTotalHeight();
    this.picker.SVG_W = this.SVG_W;
    if (this.panel) this.panel.style.width = this.SVG_W + 'px';
  }

  // ════════════════════════════════════════════════════════════════
  //  销毁
  // ════════════════════════════════════════════════════════════════

  destroy() {
    if (this._scrollRAF) { cancelAnimationFrame(this._scrollRAF); this._scrollRAF = null; }
    if (this._recenterRAF) { cancelAnimationFrame(this._recenterRAF); this._recenterRAF = null; }
    if (this.timeWheel) { this.timeWheel.destroy(); this.timeWheel = null; }
    if (this.container) { this.container.remove(); this.container = null; }
    this._headerCells = [];
    this._rowCache.clear();
  }
}

export default HtmlRenderer;
