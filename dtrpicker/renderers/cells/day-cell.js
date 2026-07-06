/**
 * DayCell — 日期格子。
 * cols 2-8，每行 7 个。含选中/今日/范围状态标记。
 * @extends Cell
 */
import Cell from './cell.js';

class DayCell extends Cell {
  /**
   * @param {Object} cfg
   * @param {Date}   cfg.date - Date 对象
   * @param {string} cfg.dateStr - "YYYY-MM-DD"
   * @param {number} cfg.dayNum - 日数字
   * @param {boolean} cfg.isToday - 是否今日
   */
  constructor(cfg) {
    super(cfg);
    this.type = 'day';
    this.date = cfg.date;
    this.dateStr = cfg.dateStr;
    this.dayNum = cfg.dayNum;
    this.isToday = cfg.isToday;
    /** @type {boolean} 是否在选中范围内 */
    this.isInRange = false;
    /** @type {string|null} 'start' | 'end' | null */
    this.role = null;
  }

  get textWeight() { return (this.role || this.isToday) ? '700' : '500'; }
  // 文字色优先级：选中 > 周末标题 > 周末 > 默认
  get textColor() {
    if (this.role) return this.picker.options.selectedTextColor;
    const dow = this.date.day;
    if (dow === 0 || dow === 6) return this.picker.options.textColorWeekend;
    return this.picker.options.textColor;
  }

  /**
   * 设置起止角色和范围状态，并重新渲染。
   * @param {string|null} role - 'start' | 'end' | null
   * @param {boolean} inRange - 是否在选中范围内
   */
  setRangeState(role, inRange) {
    this.role = role;
    this.isInRange = inRange;
  }

  /** 绘制起/止选中色块 */
  _drawSelectedState() {
    if (!this.role) return;
    const cls = this.role === 'start' ? 'dtrpicker-range-start-cell' : 'dtrpicker-range-end-cell';
    this._createRect(this.x, this.y, this.w, this.h, {
      fill: this.picker.options.selectedColor,
      'class': cls,
    });
  }

  /** 绘制范围中段底部 2px 条 */
  _drawRangeLine() {
    if (!this.isInRange || this.role) return;
    this._createRect(this.x, this.y + this.h - 2, this.w, 2, {
      fill: this.picker.options.selectedColor,
      'class': 'dtrpicker-range-line',
    });
  }

  /** 绘制今日顶部色条 */
  _drawTodayBar() {
    if (!this.isToday) return;
    this._createRect(this.x, this.y, this.w, this.picker.options.todayBarHeight, {
      fill: this.picker.options.todayBarColor,
      'class': 'dtrpicker-today-cell',
    });
  }

  /** 绘制日期数字 */
  _drawText() {
    const isWeekend = this.date.day === 0 || this.date.day === 6;
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
