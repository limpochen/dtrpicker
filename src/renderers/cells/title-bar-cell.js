/**
 * TitleBarCell — "Start" / "End" title bar.
 * Shown in time-range mode, spanning two columns.
 * @extends Cell
 */
import Cell from './cell.js';

class TitleBarCell extends Cell {
  /**
   * @param {Object} cfg
   * @param {string} cfg.label - "Start" / "End"
   * @param {string} cfg.bgColor - background color
   */
  constructor(cfg) {
    super(cfg);
    this.type = 'title-bar';
    this.container = cfg.picker.timeGroup;
    this.label = cfg.label;
    this._hoverEnabled = false;
    this.bgColor = cfg.bgColor;
    this.spanCols = 2;
  }

  /** Width spanning two columns. */
  get w() { return this.g.CELL_W * this.spanCols + this.g.GAP; }

  get textSize()   { return '13'; }
  get textWeight() { return '500'; }
  get textColor()  { return this.picker.options.textColor; }

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

export default TitleBarCell;
