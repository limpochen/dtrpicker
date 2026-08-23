/**
 * MonthCell — month column cell.
 * col=1, supports tall rectangles for pure month segments and blended rows spanning months.
 * @extends Cell
 */
import Cell from './cell.js';
import { saturateColor, blendColors } from '../../utils/color.js';

class MonthCell extends Cell {
  /**
   * @param {Object} cfg
   * @param {number} cfg.month - month value (0-11)
   * @param {boolean} [cfg.isPureSegment=false] - whether it is a pure month segment
   * @param {boolean} [cfg.blended=false] - whether it is a blended row spanning months
   * @param {Object} [cfg.blendColors] - blend colors { c1, c2, ratio }
   * @param {string} [cfg.label] - month label, e.g. "Jan"
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
