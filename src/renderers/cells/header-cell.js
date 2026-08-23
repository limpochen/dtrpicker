/**
 * HeaderCell — header text cell.
 * One object per column; no hover.
 * @extends Cell
 */
import Cell from './cell.js';

class HeaderCell extends Cell {
  constructor(cfg) {
    super(cfg);
    this.type = 'header';
    this.container = cfg.picker.headerArea.container;
    this.label = cfg.label;
    this._hoverEnabled = false;
    this._colorOverride = cfg.colorOverride || null;
  }

  get textSize()   { return '12'; }
  get textWeight() { return '600'; }
  get textColor()  { return this._colorOverride || this.picker.options.textColorSubLabel; }

  render() {
    super.render();
    this._createText(this.x + this.w / 2, this.y + this.h / 2, this.label, {
      fill: this.textColor,
      'font-size': this.textSize,
      'font-weight': this.textWeight,
    });
    this._drawDebugBorder();
  }
}

export default HeaderCell;
