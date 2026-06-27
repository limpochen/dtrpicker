/**
 * PickerState.js — dtrPicker 数据状态管理
 *
 * ================================================================
 *  职责
 * ================================================================
 *
 * 专注管理选择器的全部数据状态，不涉及任何 DOM/UI 操作：
 *
 *   - 日期范围（rangeStart / rangeEnd / hoverDate）
 *   - 时间值（startHour/Minute / endHour/Minute）
 *   - 滚轮滚动偏移（translateY）
 *   - 模式判断（single / range / time 等）
 *   - 日期选择状态机（handleDateClick）
 *   - 输出值格式化（getValue）
 *   - 回调注册与管理（onChange）
 *
 * ================================================================
 *  与 UI 层的契约
 * ================================================================
 *
 * - UI 层（dtrPicker）读取 state 属性进行渲染
 * - UI 层通过 handleDateClick / setValue / clear 修改 state
 * - state 变更后通过 onChange 回调通知 UI 层
 * - timeWheel 的时间值通过 syncTimeFrom 与 state 同步
 *
 * @file       数据状态管理
 * @version    2.2.0
 * @license    MIT
 */

import { dateEqual, parseDate, formatDate, getStartOfWeek } from '../utils/date.js';

/**
 * 状态管理模式枚举。
 * 由 options.mode 派生，互斥。
 * @enum {string}
 */
const MODE = {
  SINGLE_DATE: 'date',
  SINGLE_DATETIME: 'dateTime',
  RANGE_DATE: 'dateRange',
  RANGE_DATETIME: 'dateTimeRange',
};

class PickerState {
  /**
   * @param {Object} options - 合并后的完整配置选项
   */
  constructor(options) {
    /** @type {Object} 合并后的完整配置（与 dtrPicker.options 引用同一对象） */
    this.options = options;
    /** @type {Date|null} 选中范围的起始日期 */
    this.rangeStart = null;
    /** @type {Date|null} 选中范围的结束日期 */
    this.rangeEnd = null;
    /** @type {Date|null} 当前鼠标悬停日期 */
    this.hoverDate = null;
    /** @type {Date} 今日（构造时快照） */
    this.today = new Date();
    /** @type {Date} 拖拽基准日期 */
    this.baseDate = new Date();
    /** @type {Date} baseDate 所在周第一天 */
    this.startOfWeekZero = getStartOfWeek(this.baseDate, this.options.firstDay === 0);
    /** @type {number} 当前垂直滚动偏移（px） */
    this.translateY = 0;
    /** @type {number} 滚轮目标偏移（平滑动画用） */
    this._wheelTargetY = 0;
    /** @type {number} 色系随机偏移（月/日/时分底色轮换） */
    this._colorShift = Math.floor(Math.random() * 100);
    /** @type {number|null} 当前可见年份 */
    this._visibleYear = null;
    /** @type {Function[]} 值变更回调列表 */
    this._changeCallbacks = [];

    // ── 时间滚轮值 ──
    this.startHour = 0;
    this.startMinute = 0;
    this.endHour = 0;
    this.endMinute = 0;
  }

  // ════════════════════════════════════════════════════════════════
  //  模式判断
  // ════════════════════════════════════════════════════════════════

  /** @returns {boolean} 是否启用时间选择（dateTime / dateTimeRange） */
  isTimeEnabled() {
    return this.options.mode === MODE.SINGLE_DATETIME || this.options.mode === MODE.RANGE_DATETIME;
  }

  /** @returns {boolean} 是否时间范围模式（dateTimeRange） */
  isTimeRange() {
    return this.options.mode === MODE.RANGE_DATETIME;
  }

  /** @returns {boolean} 是否单日期模式（date / dateTime） */
  isSingle() {
    return this.options.mode === MODE.SINGLE_DATE || this.options.mode === MODE.SINGLE_DATETIME;
  }

  /** @returns {boolean} 是否范围模式（dateRange / dateTimeRange） */
  isRange() {
    return this.options.mode === MODE.RANGE_DATE || this.options.mode === MODE.RANGE_DATETIME;
  }

  // ════════════════════════════════════════════════════════════════
  //  日期选择状态机
  // ════════════════════════════════════════════════════════════════

  /**
   * 处理日期点击 — 纯状态机逻辑，不涉及渲染。
   *
   * 内部不触发 _fireChange，由调用方（dtrPicker）在适当时机统一调度。
   *
   * 只分两种情况：
   *   同天范围（1天）→ 点不同日则扩展，点同天不变
   *   其他（空/不同天）→ 起止=点击日（1 天范围）
   *
   * @param {Date} d - 被点击的日期
   * @returns {{ changed: boolean, action: string|null }}
   */
  handleDateClick(d) {
    // ── 同天范围 → 扩展 ──
    if (this.rangeStart && dateEqual(this.rangeStart, this.rangeEnd)) {
      if (d < this.rangeStart) {
        this.rangeStart = new Date(d);
      } else if (d > this.rangeEnd) {
        this.rangeEnd = new Date(d);
      }
      this.hoverDate = null;
      return { changed: true, action: 'confirmed' };
    }

    // ── 空 / 不同天 → 起止=点击日（1 天范围）──
    this.rangeStart = new Date(d);
    this.rangeEnd = new Date(d);
    this.hoverDate = null;
    // dateTimeRange 模式下同天选择，起止时间设为 00:00 - 23:59
    if (this.isTimeRange()) {
      this.startHour = 0;
      this.startMinute = 0;
      this.endHour = 23;
      this.endMinute = 59;
    }
    return { changed: true, action: 'confirmed' };
  }

  // ════════════════════════════════════════════════════════════════
  //  值输出
  // ════════════════════════════════════════════════════════════════

  /**
   * 获取选中值，支持多格式。
   *
   * 输出格式：
   *   'string'（默认）：{ start: "YYYY-MM-DD HH:mm"[, end: ...] }
   *   'date'：         { start: Date[, end: Date|null] }
   *   'object'：       { start: {year,month,day,hour,minute}[, end: {...}] }
   *   无选中 → null
   *
   * @param {'string'|'date'|'object'} [format='string'] - 返回格式
   * @returns {Object|null}
   */
  getValue(format) {
    if (!this.rangeStart) return null;
    if (this.isRange() && !this.rangeEnd) return null;

    const baseStart = this.rangeStart;
    const baseEnd = this.rangeEnd;

    if (format === 'date') {
      const val = { start: new Date(baseStart) };
      if (this.isRange()) val.end = new Date(baseEnd);
      return val;
    }

    if (format === 'object') {
      const toParts = function (d, h, m) {
        return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: h, minute: m };
      };
      const tStartH = this.isTimeEnabled() ? this.startHour : 0;
      const tStartM = this.isTimeEnabled() ? this.startMinute : 0;
      const val = { start: toParts(baseStart, tStartH, tStartM) };
      if (this.isRange()) {
        const tEndH = this.isTimeEnabled() ? this.endHour : 0;
        const tEndM = this.isTimeEnabled() ? this.endMinute : 0;
        val.end = toParts(baseEnd, tEndH, tEndM);
      }
      return val;
    }

    // 'string'（默认）
    const baseStartStr = formatDate(baseStart, 'YYYY-MM-DD');
    const baseEndStr = formatDate(baseEnd, 'YYYY-MM-DD');
    const tStart = this.isTimeEnabled()
      ? String(this.startHour).padStart(2, '0') + ':' + String(this.startMinute).padStart(2, '0')
      : '00:00';
    const tEnd = this.isTimeEnabled()
      ? String(this.endHour).padStart(2, '0') + ':' + String(this.endMinute).padStart(2, '0')
      : '00:00';

    const val = { start: baseStartStr + ' ' + tStart };
    if (this.isRange()) {
      val.end = baseEndStr + ' ' + tEnd;
    }
    return val;
  }

  // ════════════════════════════════════════════════════════════════
  //  变更管理
  // ════════════════════════════════════════════════════════════════

  /**
   * 触发所有已注册的 change 回调。由状态变更逻辑内部调用。
   * @param {Object} [meta={ source: 'user', action: 'confirmed' }] - 变更元信息
   * @private
   */
  _fireChange(meta) {
    const val = this.getValue();
    meta = meta || { source: 'user', action: 'confirmed' };
    this._changeCallbacks.forEach(function (fn) { fn(val, meta); });
  }

  /**
   * 注册值变更回调。
   * @param {Function} fn - (value) => void
   */
  onChange(fn) {
    if (typeof fn === 'function') this._changeCallbacks.push(fn);
  }

  // ════════════════════════════════════════════════════════════════
  //  程序化操作
  // ════════════════════════════════════════════════════════════════

  /**
   * 清除全部选中状态。
   * @param {boolean} [silent=false] - true 则静默清除，不触发回调
   */
  clear(silent = false) {
    this.rangeStart = null;
    this.rangeEnd = null;
    this.hoverDate = null;
    this.startHour = 0;
    this.startMinute = 0;
    this.endHour = 0;
    this.endMinute = 0;
    if (!silent) this._fireChange({ source: 'programmatic', action: 'cleared' });
  }

  /**
   * 程序化设置日期范围。
   * @param {{start:string, end?:string}} range
   * @param {Object} [meta={ source: 'programmatic', action: 'confirmed' }] - 变更元信息
   */
  setValue(range, meta) {
    if (!range) return;
    this.rangeStart = parseDate(range.start) || null;
    this.rangeEnd = range.start && range.end ? (parseDate(range.end) || null) : null;
    this.hoverDate = null;
    if (this.isTimeEnabled() && this.rangeStart) {
      this.startHour = this.rangeStart.getHours();
      this.startMinute = this.rangeStart.getMinutes();
    }
    if (this.isTimeEnabled() && this.rangeEnd) {
      this.endHour = this.rangeEnd.getHours();
      this.endMinute = this.rangeEnd.getMinutes();
    }
    this._fireChange(meta || { source: 'programmatic', action: 'confirmed' });
  }

  /**
   * 从 TimeWheel 同步时间值到 state。
   * @param {Object} timeValues - { startHour, startMinute, endHour, endMinute }
   */
  syncTimeFrom(timeValues) {
    this.startHour = timeValues.startHour;
    this.startMinute = timeValues.startMinute;
    this.endHour = timeValues.endHour;
    this.endMinute = timeValues.endMinute;
  }
}

export default PickerState;
