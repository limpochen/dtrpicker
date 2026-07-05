/**
 * MonthCell — 月列格子。
 * col=1，支持纯月段竖长矩形和跨月混合行（blended）。
 * @extends Cell
 */
import Cell from './cell.js';
import { saturateColor, blendColors } from '../../utils/color.js';

class MonthCell extends Cell {
  /**
   * @param {Object} cfg
   * @param {number} cfg.month - 月份值 (0-11)
   * @param {boolean} [cfg.isPureSegment=false] - 是否纯月段
   * @param {boolean} [cfg.blended=false] - 是否跨月混合行
   * @param {Object} [cfg.blendColors] - 混合色 { c1, c2, ratio }
   * @param {string} [cfg.label] - 月份标签，如 "1月"
   */
  constructor(cfg) {
    super(cfg);
    this.type = 'month';
    this.month = cfg.month;
    this.isPureSegment = cfg.isPureSegment || false;
    this.blended = cfg.blended || false;
    this.blendColors = cfg.blendColors || null;
    this.label = cfg.label || '';
  }

  get textSize()   { return '12'; }
  get textWeight() { return '700'; }
  get textColor()  { return this.picker.options.textColorSubLabel; }

  render() {
    if (this.blended) {
      this.bgColor = saturateColor(blendColors(this.blendColors.c1, this.blendColors.c2, this.blendColors.ratio), 0.04);
    } else if (this.isPureSegment) {
      this.bgColor = saturateColor(this._cellColor(this.month), 0.04);
    }
    super.render();

    if (this.isPureSegment && this.label) {
      this._createText(this.x + this.w / 2, this.y + this.h / 2, this.label, {
        fill: this.textColor, 'font-size': this.textSize, 'font-weight': this.textWeight,
      });
    }

    this._createHitRect();
  }
}

export default MonthCell;
