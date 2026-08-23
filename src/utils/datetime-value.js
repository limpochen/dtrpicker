/**
 * DateTimeValue — the selected-value object of dtrPicker
 *
 * Encapsulates a complete selection result: start/end date-time + selection mode.
 * Handles the state machine (handleDateClick), formatted output (toJSON/toDate/toParts),
 * and programmatic set/clear. No DOM dependency, holds no callbacks.
 *
 * @file       Selected-value object
 * @version    2.1.11
 * @license    MIT
 */

import DateTime from './date.js';

/**
 * Mode enum (matches options.mode).
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
   * @param {string} mode - Selection mode ('date'|'dateTime'|'dateRange'|'dateTimeRange')
   */
  constructor(mode) {
    /** @type {string} Selection mode */
    this.mode = mode;
    /** @type {DateTime|null} Start date + time */
    this.start = null;
    /** @type {DateTime|null} End date + time */
    this.end = null;
  }

  // ── Mode checks ─────────────────────────────────────────────────

  /** @returns {boolean} Whether time selection is enabled */
  get isTimeEnabled() {
    return this.mode === MODE.SINGLE_DATETIME || this.mode === MODE.RANGE_DATETIME;
  }

  /** @returns {boolean} Whether this is a date-time range mode */
  get isTimeRange() {
    return this.mode === MODE.RANGE_DATETIME;
  }

  /** @returns {boolean} Whether this is a single-date mode */
  get isSingle() {
    return this.mode === MODE.SINGLE_DATE || this.mode === MODE.SINGLE_DATETIME;
  }

  /** @returns {boolean} Whether this is a range mode */
  get isRange() {
    return this.mode === MODE.RANGE_DATE || this.mode === MODE.RANGE_DATETIME;
  }

  // ── Date selection state machine ───────────────────────────────

  /**
   * Handle a date click — pure state machine logic.
   *
   * Three cases:
   *   Single-date mode (date/dateTime) → click replaces the selection, end stays null
   *   Same-day range (1 day) → clicking a different day extends the range; clicking the same day does nothing
   *   Otherwise (empty/different day) → start = end = clicked day (1-day range)
   *
   * @param {DateTime} d - The clicked date (a DateTime instance)
   * @returns {{ changed: boolean, action: string|null }}
   */
  handleDateClick(d) {
    // Single-date mode (date/dateTime): click replaces the selection; there is no range concept, end stays null
    if (this.isSingle) {
      this.start = d.clone();
      this.end = null;
      return { changed: true, action: 'confirmed' };
    }

    // ── Same-day range → extend ──
    if (this.start && this.start.equals(this.end)) {
      if (d.timestamp < this.start.timestamp) {
        this.start = d.clone();
      } else if (d.timestamp > this.end.timestamp) {
        this.end = d.clone();
      }
      return { changed: true, action: 'confirmed' };
    }

    // ── Empty / different day → start = end = clicked day (1-day range) ──
    this.start = d.clone();
    this.end = d.clone();
    // In dateTimeRange mode with a same-day selection, set start/end times to 00:00 - 23:59
    if (this.isTimeRange) {
      this.start.setHour(0).setMinute(0);
      this.end.setHour(23).setMinute(59);
    }
    return { changed: true, action: 'confirmed' };
  }

  // ── Output ──────────────────────────────────────────────────────

  /**
   * Output as a string-format JSON object.
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
   * Output as native Date objects.
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
   * Output as an expanded numeric object.
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

  // ── Programmatic operations ────────────────────────────────────

  /**
   * Set the value from a string range.
   * @param {{start:string, end?:string}} range
   */
  setFrom(range) {
    if (!range) return;
    // Intentional fallback: invalid date input safely fails to null instead of throwing (kept per user confirmation)
    this.start = DateTime.parse(range.start) || null;
    this.end = range.start && range.end ? (DateTime.parse(range.end) || null) : null;
  }

  /**
   * Clear all selected state.
   */
  clear() {
    this.start = null;
    this.end = null;
  }

  /**
   * Sync time values from a TimeWheel object into the DateTime instances.
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
