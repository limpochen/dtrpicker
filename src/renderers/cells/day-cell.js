/**
 * DayCell — day cell.
 * Columns 2-8, 7 per row. Includes selected/today/range state markers.
 * @extends Cell
 */
import Cell from './cell.js';

class DayCell extends Cell {
  /**
   * @param {Object} cfg
   * @param {Date}   cfg.date - Date object
   * @param {string} cfg.dateStr - "YYYY-MM-DD"
   * @param {number} cfg.dayNum - day number
   * @param {boolean} cfg.isToday - whether it is today
   */
  constructor(cfg) {
    super(cfg);
    this.type = 'day';
    this.date = cfg.date;
    this.dateStr = cfg.dateStr;
    this.dayNum = cfg.dayNum;
    this.isToday = cfg.isToday;
    /** @type {boolean} Whether it is within the selected range. */
    this.isInRange = false;
    /** @type {string|null} 'start' | 'end' | null */
    this.role = null;
  }

  get textWeight() { return (this.role || this.isToday) ? '700' : '500'; }
  // Text color priority: selected > weekend title > weekend > default
  get textColor() {
    if (this.role) return this.picker.options.selectedTextColor;
    const isWeekend = this.date.day === 0 || this.date.day === 6;
    if (isWeekend) return this.picker.options.textColorWeekend;
    return this.picker.options.textColor;
  }

  /**
   * Set the start/end role and range state, then re-render.
   * @param {string|null} role - 'start' | 'end' | null
   * @param {boolean} inRange - whether it is within the selected range
   */
  setRangeState(role, inRange) {
    this.role = role;
    this.isInRange = inRange;
  }

  /** Draw the start/end selected color block. */
  _drawSelectedState() {
    if (!this.role) return;
    const cls = this.role === 'start' ? 'dtrpicker-range-start-cell' : 'dtrpicker-range-end-cell';
    this._createRect(this.x, this.y, this.w, this.h, {
      fill: this.picker.options.selectedColor,
      'class': cls,
    });
  }

  /** Draw the 2px bar at the bottom of the range middle section. */
  _drawRangeLine() {
    if (!this.isInRange || this.role) return;
    this._createRect(this.x, this.y + this.h - 2, this.w, 2, {
      fill: this.picker.options.selectedColor,
      'class': 'dtrpicker-range-line',
    });
  }

  /** Draw the today bar at the top. */
  _drawTodayBar() {
    if (!this.isToday) return;
    this._createRect(this.x, this.y, this.w, this.picker.options.todayBarHeight, {
      fill: this.picker.options.todayBarColor,
      'class': 'dtrpicker-today-cell',
    });
  }

  /** Draw the day number. */
  _drawText() {
    const attrs = {
      fill: this.textColor,
      'font-size': this.textSize,
      'font-weight': this.textWeight,
      'class': 'dtrpicker-day-text',
      'data-date': this.dateStr,
    };
    const text = this._createText(this.x + this.w / 2, this.y + this.h / 2, this.dayNum, attrs);
    text.style.pointerEvents = 'none';
  }

  render() {
    this.bgColor = this._cellColor(this.date.month);
    super.render();
    this._drawSelectedState();
    this._drawRangeLine();
    this._drawTodayBar();
    this._drawText();
    this._createHitRect({ 'data-date': this.dateStr, 'class': 'dtrpicker-day-hit' });
  }
}

export default DayCell;
