/**
 * DateTimeValue — dtrPicker 选中值对象
 *
 * 封装一个完整的选择结果：起止日期时间 + 选择模式。
 * 负责状态机（handleDateClick）、格式化输出（toJSON/toDate/toParts）、
 * 程序化赋值/清除。不依赖 DOM，不持有回调。
 *
 * @file       选中值对象
 * @version    2.1.11
 * @license    MIT
 */

import DateTime from './date.js';

/**
 * 模式枚举（匹配 options.mode）。
 * @enum {string}
 */
const MODE = {
  SINGLE_DATE: 'date',
  SINGLE_DATETIME: 'dateTime',
  RANGE_DATE: 'dateRange',
  RANGE_DATETIME: 'dateTimeRange',
};

class DateTimeValue {
  /**
   * @param {string} mode - 选择模式（'date'|'dateTime'|'dateRange'|'dateTimeRange'）
   */
  constructor(mode) {
    /** @type {string} 选择模式 */
    this.mode = mode;
    /** @type {DateTime|null} 起始日期+时间 */
    this.start = null;
    /** @type {DateTime|null} 结束日期+时间 */
    this.end = null;
  }

  // ── 模式判断 ────────────────────────────────────────────────────

  /** @returns {boolean} 是否启用时间选择 */
  get isTimeEnabled() {
    return this.mode === MODE.SINGLE_DATETIME || this.mode === MODE.RANGE_DATETIME;
  }

  /** @returns {boolean} 是否时间范围模式 */
  get isTimeRange() {
    return this.mode === MODE.RANGE_DATETIME;
  }

  /** @returns {boolean} 是否单日期模式 */
  get isSingle() {
    return this.mode === MODE.SINGLE_DATE || this.mode === MODE.SINGLE_DATETIME;
  }

  /** @returns {boolean} 是否范围模式 */
  get isRange() {
    return this.mode === MODE.RANGE_DATE || this.mode === MODE.RANGE_DATETIME;
  }

  // ── 日期选择状态机 ──────────────────────────────────────────────

  /**
   * 处理日期点击 — 纯状态机逻辑。
   *
   * 分三种情况：
   *   单日期模式（date/dateTime）→ 点击即替换，end 恒为 null
   *   同天范围（1天）→ 点不同日则扩展，点同天不变
   *   其他（空/不同天）→ 起止=点击日（1 天范围）
   *
   * @param {DateTime} d - 被点击的日期（DateTime 实例）
   * @returns {{ changed: boolean, action: string|null }}
   */
  handleDateClick(d) {
    // 单日期模式（date/dateTime）：点击即替换，无范围概念，end 恒为 null
    if (this.isSingle) {
      this.start = d.clone();
      this.end = null;
      return { changed: true, action: 'confirmed' };
    }

    // ── 同天范围 → 扩展 ──
    if (this.start && this.start.equals(this.end)) {
      if (d.timestamp < this.start.timestamp) {
        this.start = d.clone();
      } else if (d.timestamp > this.end.timestamp) {
        this.end = d.clone();
      }
      return { changed: true, action: 'confirmed' };
    }

    // ── 空 / 不同天 → 起止=点击日（1 天范围）──
    this.start = d.clone();
    this.end = d.clone();
    // dateTimeRange 模式下同天选择，起止时间设为 00:00 - 23:59
    if (this.isTimeRange) {
      this.start.setHour(0).setMinute(0);
      this.end.setHour(23).setMinute(59);
    }
    return { changed: true, action: 'confirmed' };
  }

  // ── 输出 ────────────────────────────────────────────────────────

  /**
   * 输出为字符串格式 JSON。
   * { start: "YYYY-MM-DD HH:mm"[, end: "..."] }
   * @returns {Object|null}
   */
  toJSON() {
    if (!this.start) return null;
    if (this.isRange && !this.end) return null;

    const fmt = this.isTimeEnabled ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';
    const val = { start: this.start.format(fmt) };
    if (this.isRange && this.end) {
      val.end = this.end.format(fmt);
    }
    return val;
  }

  /**
   * 输出为原生 Date 对象。
   * { start: Date[, end: Date] }
   * @returns {Object|null}
   */
  toDate() {
    if (!this.start) return null;
    if (this.isRange && !this.end) return null;
    const val = { start: this.start.toNativeDate() };
    if (this.isRange) val.end = this.end.toNativeDate();
    return val;
  }

  /**
   * 输出为展开的数字对象。
   * { start: {year,month,day,hour,minute}[, end: {...}] }
   * @returns {Object|null}
   */
  toParts() {
    if (!this.start) return null;
    if (this.isRange && !this.end) return null;
    const toParts = (d) => ({
      year: d.year,
      month: d.month + 1,
      day: d.date,
      hour: d.hour,
      minute: d.minute,
    });
    const val = { start: toParts(this.start) };
    if (this.isRange) val.end = toParts(this.end);
    return val;
  }

  // ── 程序化操作 ──────────────────────────────────────────────────

  /**
   * 从字符串范围设置值。
   * @param {{start:string, end?:string}} range
   */
  setFrom(range) {
    if (!range) return;
    // 有意兜底：非法日期输入安全失败为 null，不抛错（用户确认保留）
    this.start = DateTime.parse(range.start) || null;
    this.end = range.start && range.end ? (DateTime.parse(range.end) || null) : null;
  }

  /**
   * 清除全部选中状态。
   */
  clear() {
    this.start = null;
    this.end = null;
  }

  /**
   * 从 TimeWheel 对象同步时间值到 DateTime 实例。
   * @param {{ startHour:number, startMinute:number, endHour:number, endMinute:number }} tv
   */
  syncTimeFrom(tv) {
    if (this.start) {
      this.start.setHour(tv.startHour).setMinute(tv.startMinute);
    }
    if (this.end) {
      this.end.setHour(tv.endHour).setMinute(tv.endMinute);
    }
  }
}

export default DateTimeValue;
