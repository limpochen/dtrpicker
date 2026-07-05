/**
 * TitleBarCell — "开始" / "结束" 标题栏。
 * 时间范围模式下显示，横跨两列。
 * @extends Cell
 */
import Cell from './cell.js';

class TitleBarCell extends Cell {
  /**
   * @param {Object} cfg
   * @param {string} cfg.label - "开始" / "结束"
   * @param {string} cfg.bgColor - 背景色
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

  /** 横跨两列宽度 */
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
