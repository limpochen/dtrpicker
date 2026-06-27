/**
 * TimeWheel — 时间滚轮选择器
 *
 * 在给定的 SVG <g> 容器内渲染时分滚轮列，支持鼠标滚轮滚动和拖拽调节。
 */
import TimeCell from './time-cell.js';
import TitleBarCell from './title-bar-cell.js';
import TimeWheelFloater from './time-wheel-floater.js';

class TimeWheel {
  constructor(cfg) {
    this.svgNS = cfg.svgNS;
    this.timeGroup = cfg.timeGroup;
    this.cellW = cfg.cellW;
    this.cellH = cfg.cellH;
    this.gap = cfg.gap;
    this.stepX = cfg.stepX;
    this.stepY = cfg.stepY;
    this.svgH = cfg.svgH;
    this.timeColStart = cfg.timeColStart;
    this.colorShift = cfg.colorShift;
    this.options = cfg.options;
    this.getActiveScheme = cfg.getActiveScheme;
    this.saturateColor = cfg.saturateColor;
    this._isTimeRange = cfg.isTimeRange;
    this._isTimeEnabled = cfg.isTimeEnabled;
    this._i18n = cfg.i18n;
    this.picker = cfg.picker;
    this.onTimeChange = cfg.onTimeChange;
    this.onDragStart = cfg.onDragStart;
    this.onDragStateChange = cfg.onDragStateChange;
    this.svg = cfg.svg;
    this.containerEl = cfg.containerEl;
    this.selectedColor = cfg.selectedColor;
    this.todayBarColor = cfg.todayBarColor;
    this.textColor = cfg.textColor;
    this.selectedTextColor = cfg.selectedTextColor;

    this.startHour = 0;
    this.startMinute = 0;
    this.endHour = 0;
    this.endMinute = 0;

    this._dragState = null;
    this._dragActive = false;
    this._colLayouts = {};
    /** @type {Object<string,string>} 各列背景色映射（供放大器直读） */
    this._colBgColors = {};
    /** @type {Object<string,TimeCell>} 各列 TimeCell 实例映射 */
    this._timeCells = {};
    /** @type {boolean} 本次拖拽是否发生过位移（用于区分点击/拖拽） */
    this._dragMoved = false;

    /** @type {DragController} 拖拽事件共享层（由父级传入） */
    this._dragController = cfg.dragController;
    /** @type {string} 此 TimeWheel 的 session ID */
    this._dragSessionId = cfg.dragSessionId;
    this._isDragActive = cfg.isDragActive;

    this._bindEvents();

    if (this.svg) {
      this._floater = new TimeWheelFloater({
        svgNS: this.svgNS,
        svg: this.svg,
        todayBarColor: this.todayBarColor,
        selectedColor: this.selectedColor,
        textColor: this.textColor,
        selectedTextColor: this.selectedTextColor,
        getTimeCell: (type) => this._timeCells ? this._timeCells[type] : null,
        getBgColor: (type) => this._colBgColors[type] || null,
      });
    }
  }

  render() {
    while (this.timeGroup.firstChild) this.timeGroup.removeChild(this.timeGroup.firstChild);
    if (!this._isTimeEnabled()) { this.timeGroup.style.display = 'none'; return; }
    this.timeGroup.style.display = '';

    const areaY = this.stepY;
    const areaH = this.svgH - this.stepY;

    if (this._isTimeRange()) {
      this._renderRangeMode(areaY, areaH);
    } else {
      this._renderSingleMode(areaY, areaH);
    }
  }

  /** @private */
  _renderSingleMode(areaY, areaH) {
    const scheme = this.getActiveScheme(this.options);
    const sc = scheme.colors;
    const sLen = sc.length;
    if (this._singleColorIdx === undefined) {
      this._singleColorIdx = Math.floor(Math.random() * sLen);
    }
    const singleCol = sc[this._singleColorIdx % sLen];

    const grid = {
      CELL_W: this.cellW, CELL_H: this.cellH, GAP: this.gap,
      STEP_X: this.stepX, STEP_Y: this.stepY, svgNS: this.svgNS,
    };

    this._colBgColors['hour'] = this.saturateColor(singleCol, 0.06);
    this._colBgColors['minute'] = this.saturateColor(singleCol, 0.02);
    this._drawTimeWheel(this.timeColStart, 1, 8,
      0, 23, this.startHour, 'hour', 9, grid,
      this.saturateColor(singleCol, 0.06), this._isDragActive);
    this._drawTimeWheel(this.timeColStart + 1, 1, 8,
      0, 59, this.startMinute, 'minute', 9, grid,
      this.saturateColor(singleCol, 0.02), this._isDragActive);
  }

  /** @private */
  _renderRangeMode(areaY, areaH) {
    const halfH = Math.floor(areaH / 2);
    const sepY = areaY + halfH;
    const scheme = this.getActiveScheme(this.options);
    const sc = scheme.colors;
    const sLen = sc.length;

    const grid = {
      CELL_W: this.cellW, CELL_H: this.cellH, GAP: this.gap,
      STEP_X: this.stepX, STEP_Y: this.stepY, svgNS: this.svgNS,
    };

    if (this._startColorIdx === undefined) {
      this._startColorIdx = Math.floor(Math.random() * sLen);
      do { this._endColorIdx = Math.floor(Math.random() * sLen); } while (this._endColorIdx === this._startColorIdx);
    }
    const startIdx = this._startColorIdx % sLen;
    const endIdx = this._endColorIdx % sLen;

    const startTop = areaY;

    this._titleBarStart = new TitleBarCell({
      r: 1, c: this.timeColStart, rs: 1, cs: 2, grid: grid,
      container: this.timeGroup, picker: { options: this.options, timeGroup: this.timeGroup },
      label: this._i18n.start,
      bgColor: this.saturateColor(sc[startIdx], 0.06),
    });
    this._titleBarStart.render();

    const colAreaY = startTop + this.gap + this.cellH + this.gap;
    this._colBgColors['startHour'] = this.saturateColor(sc[startIdx], 0.04);
    this._colBgColors['startMinute'] = this.saturateColor(sc[startIdx], 0.02);
    this._drawTimeWheel(this.timeColStart, 2, 3,
      0, 23, this.startHour, 'startHour', 5, grid,
      this.saturateColor(sc[startIdx], 0.04), this._isDragActive);
    this._drawTimeWheel(this.timeColStart + 1, 2, 3,
      0, 59, this.startMinute, 'startMinute', 5, grid,
      this.saturateColor(sc[startIdx], 0.02), this._isDragActive);

    const endTop = sepY;

    this._titleBarEnd = new TitleBarCell({
      r: 5, c: this.timeColStart, rs: 1, cs: 2, grid: grid,
      container: this.timeGroup, picker: { options: this.options, timeGroup: this.timeGroup },
      label: this._i18n.end,
      bgColor: this.saturateColor(sc[endIdx], 0.06),
    });
    this._titleBarEnd.render();

    const colAreaYEnd = endTop + this.gap + this.cellH + this.gap;
    this._colBgColors['endHour'] = this.saturateColor(sc[endIdx], 0.04);
    this._colBgColors['endMinute'] = this.saturateColor(sc[endIdx], 0.02);
    this._drawTimeWheel(this.timeColStart, 6, 3,
      0, 23, this.endHour, 'endHour', 5, grid,
      this.saturateColor(sc[endIdx], 0.04), this._isDragActive);
    this._drawTimeWheel(this.timeColStart + 1, 6, 3,
      0, 59, this.endMinute, 'endMinute', 5, grid,
      this.saturateColor(sc[endIdx], 0.02), this._isDragActive);
  }

  /** @private */
  _drawTimeWheel(col, row, rowSpan, min, max, current, type, rowCount, grid, bgColor, isDragActive) {
    const tc = new TimeCell({
      r: row, c: col, rs: rowSpan, cs: 1, grid: grid,
      container: this.timeGroup, picker: { options: this.options, timeGroup: this.timeGroup, isDragActive: isDragActive },
      subType: type,
      currentValue: current,
      min: min,
      max: max,
      rowCount: rowCount,
      bgColor: bgColor,
    });
    tc.render();

    this._timeCells = this._timeCells || {};
    if (this._timeCells[type]) this._timeCells[type].destroy();
    this._timeCells[type] = tc;
  }

  /** @private */
  _updateValue(type, delta) {
    if (type === 'startHour' || type === 'hour') {
      this.startHour = (this.startHour + delta + 24) % 24;
    } else if (type === 'startMinute' || type === 'minute') {
      this.startMinute = (this.startMinute + delta + 60) % 60;
    } else if (type === 'endHour') {
      this.endHour = (this.endHour + delta + 24) % 24;
    } else if (type === 'endMinute') {
      this.endMinute = (this.endMinute + delta + 60) % 60;
    }
    if (!this._isTimeRange()) {
      this.endHour = this.startHour;
      this.endMinute = this.startMinute;
    }
  }

  /** @private */
  _getValue(type) {
    if (type === 'startHour' || type === 'hour') return this.startHour;
    if (type === 'startMinute' || type === 'minute') return this.startMinute;
    if (type === 'endHour') return this.endHour;
    if (type === 'endMinute') return this.endMinute;
    return 0;
  }

  /** @private */
  _refreshColumn(type) {
    if (this._timeCells && this._timeCells[type]) {
      this._timeCells[type].setValue(this._getValue(type));
    }
  }

  adjustTime(type, delta) {
    this._updateValue(type, delta);
    this._refreshColumn(type);
    if (this.onTimeChange) this.onTimeChange();
  }

  clear() {
    this.startHour = 0;
    this.startMinute = 0;
    this.endHour = 0;
    this.endMinute = 0;
  }

  clearHoverFills() {
    const cells = this._timeCells;
    if (!cells) return;
    const keys = Object.keys(cells);
    for (let i = 0; i < keys.length; i++) {
      const tc = cells[keys[i]];
      if (tc && tc.clearHoverFills) tc.clearHoverFills();
    }
  }

  /** @private */
  _bindEvents() {
    const self = this;

    function getType(e) {
      const t = e.target.getAttribute && e.target.getAttribute('data-time-type');
      if (t) return t;
      let el = e.target;
      while (el && el !== self.timeGroup) {
        const attr = el.getAttribute && el.getAttribute('data-time-type');
        if (attr) return attr;
        el = el.parentNode;
      }
      return null;
    }

    self._wheelHoverTimer = null;

    this._onTimeGroupWheel = function (e) {
      e.preventDefault();
      const type = getType(e);
      if (!type) return;
      if (self.onDragStateChange) self.onDragStateChange(true);
      self.adjustTime(type, e.deltaY > 0 ? 1 : -1);
      if (self._wheelHoverTimer) clearTimeout(self._wheelHoverTimer);
      self._wheelHoverTimer = setTimeout(function () {
        if (self.onDragStateChange) self.onDragStateChange(false);
        self._wheelHoverTimer = null;
      }, 120);
    };
    this.timeGroup.addEventListener('wheel', this._onTimeGroupWheel, { passive: false });

    function onDragStart(clientY, type) {
      if (!type) return;
      self._dragState = { type, startY: clientY };
      self._dragActive = true;
      self._dragMoved = false;
      if (self.onDragStart) self.onDragStart(type);
      if (self.onDragStateChange) self.onDragStateChange(true);
      if (self._dragController) self._dragController.activate(self._dragSessionId);
    }

    this._onTimeGroupMouseDown = function (e) {
      const type = getType(e);
      if (!type) return;
      e.preventDefault();
      onDragStart(e.clientY, type);
      // onDragStart → onDragStateChange(true) → clearHoverFills 清掉了所有热区，
      // 需要重新在被点击的热区上设置点击反馈色和文字白色
      if (e.target.style) {
        e.target.style.fill = self.selectedColor;
        if (e.target._timeText) {
          e.target._timeText.setAttribute('fill', self.selectedTextColor);
        }
      }
    };
    this.timeGroup.addEventListener('mousedown', this._onTimeGroupMouseDown);

    this._onTimeGroupTouchStart = function (e) {
      const type = getType(e);
      if (!type) return;
      onDragStart(e.touches[0].clientY, type);
    };
    this.timeGroup.addEventListener('touchstart', this._onTimeGroupTouchStart, { passive: true });

    function onDragMove(clientY) {
      if (!self._dragState) return;
      const dy = clientY - self._dragState.startY;
      const stepPx = 20;
      const steps = Math.floor(Math.abs(dy) / stepPx);
      if (steps > 0) {
        self._dragMoved = true;
        self.clearHoverFills();
        const dirVal = dy > 0 ? -1 : 1;
        const dirBaseline = dy > 0 ? 1 : -1;
        for (let i = 0; i < steps; i++) {
          self._updateValue(self._dragState.type, dirVal);
        }
        self._dragState.startY += dirBaseline * steps * stepPx;
        self._refreshColumn(self._dragState.type);
        if (self._floater) {
          if (!self._floater._group) self._floater.show(self._dragState.type);
          self._floater.update();
        }
      }
    }

    function onDragEnd() {
      if (!self._dragState) return;
      self._dragActive = false;
      if (self._floater) self._floater.hide();
      if (self.onTimeChange) self.onTimeChange();
      if (self.onDragStateChange) self.onDragStateChange(false);
      self._dragState = null;
    }

    if (this._dragController && this._dragSessionId) {
      this._dragController.register(this._dragSessionId, {
        onDragMove: function (clientY) { onDragMove(clientY); },
        onDragEnd: function () { onDragEnd(); },
      });
    }

    // 点击数值直接设置
    this._onTimeGroupClick = function (e) {
      if (self._dragMoved) return;
      const type = getType(e);
      if (!type) return;
      const target = e.target;
      let valStr = target.getAttribute ? target.getAttribute('data-time-val') : null;
      if (!valStr) {
        const p = target.parentNode;
        valStr = p && p.getAttribute ? p.getAttribute('data-time-val') : null;
      }
      if (valStr === null) return;
      const val = parseInt(valStr, 10);
      if (isNaN(val)) return;
      self._setTimeValue(type, val);
    };
    this.timeGroup.addEventListener('click', this._onTimeGroupClick);
  }

  /** @private 直接设置某列的值为指定数值 */
  _setTimeValue(type, val) {
    if (type === 'startHour' || type === 'hour') this.startHour = val;
    else if (type === 'startMinute' || type === 'minute') this.startMinute = val;
    else if (type === 'endHour') this.endHour = val;
    else if (type === 'endMinute') this.endMinute = val;
    if (!this._isTimeRange()) {
      this.endHour = this.startHour;
      this.endMinute = this.startMinute;
    }
    this._refreshColumn(type);
    if (this.onTimeChange) this.onTimeChange();
  }

  destroy() {
    if (this._dragController && this._dragSessionId) {
      this._dragController.unregister(this._dragSessionId);
    }
    if (this._wheelHoverTimer) { clearTimeout(this._wheelHoverTimer); this._wheelHoverTimer = null; }
    if (this._onTimeGroupWheel) this.timeGroup.removeEventListener('wheel', this._onTimeGroupWheel);
    if (this._onTimeGroupMouseDown) this.timeGroup.removeEventListener('mousedown', this._onTimeGroupMouseDown);
    if (this._onTimeGroupTouchStart) this.timeGroup.removeEventListener('touchstart', this._onTimeGroupTouchStart);
    if (this._onTimeGroupClick) this.timeGroup.removeEventListener('click', this._onTimeGroupClick);
    if (this._floater) { this._floater.destroy(); this._floater = null; }
    this._dragState = null;
    this.onTimeChange = null;
    this._timeCells = {};
  }
}

export default TimeWheel;
