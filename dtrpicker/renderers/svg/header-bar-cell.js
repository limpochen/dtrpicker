/**
 * HeaderBarCell — 通长标题背景渐变条。
 * 横跨整行，由 _syncHeaderColors 注入各列取色值后绘制线性渐变。
 * @extends Cell
 */
import Cell from './cell.js';

class HeaderBarCell extends Cell {
  constructor(cfg) {
    super(cfg);
    this.type = 'header-bar';
    this._hoverEnabled = false;
    /** @type {string[]} 各列取色值，由 setHeaderColors 注入 */
    this._hColors = [];
  }

  /** 通栏全宽 = 总宽 - 左右 GAP */
  get w() { return this.picker.SVG_W - this.g.GAP * 2; }
  /** 格子内容高度 = CELL_H，底部留出 GAP */
  get h() { return this.g.CELL_H; }
  /** y：从网格上边缘开始 */
  get y() { return this.g.GAP; }
  /** x：从网格左边缘开始 */
  get x() { return this.g.GAP; }

  /**
   * 注入各列取色值。
   * @param {string[]} colors - 各列色值数组
   */
  setHeaderColors(colors) {
    this._hColors = colors;
  }

  /**
   * 内部方法：按列物理位置排序的 [color] 数组。
   * @returns {string[]}
   * @private
   */
  _sortedColors() {
    const cells = this.picker._headerCells;
    if (!cells || cells.length === 0) return [];
    const fallback = this.picker.options.cellColor;
    const arr = cells.map(function (c, idx) {
      return { x: c.x, color: this._hColors[idx] || fallback };
    }, this);
    arr.sort(function (a, b) { return a.x - b.x; });
    return arr.map(function (item) { return item.color; });
  }

  render() {
    if (this._bgRect) { this._bgRect.remove(); this._bgRect = null; }

    const gradId = this.picker._instanceId + '-hdr-grad';
    const oldDef = this.picker.svg.querySelector('#' + gradId);
    if (oldDef) oldDef.remove();

    this._bgRect = document.createElementNS(this.g.svgNS, 'rect');
    this._bgRect.setAttribute('x', this.x);
    this._bgRect.setAttribute('y', this.y);
    this._bgRect.setAttribute('width', this.w);
    this._bgRect.setAttribute('height', this.h);
    this._bgRect.setAttribute('fill', this.picker.options.cellColor);

    const container = this.container;
    if (container.firstChild) {
      container.insertBefore(this._bgRect, container.firstChild);
    } else {
      container.appendChild(this._bgRect);
    }

    const sortedColors = this._sortedColors();
    if (sortedColors.length < 2) return;

    let defs = this.picker.svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(this.g.svgNS, 'defs');
      this.picker.svg.insertBefore(defs, this.picker.svg.firstChild);
    }
    const grad = document.createElementNS(this.g.svgNS, 'linearGradient');
    grad.setAttribute('id', gradId);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '0%');

    sortedColors.forEach(function (color, idx) {
      const pct = (idx / (sortedColors.length - 1)) * 100;
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop.setAttribute('offset', pct + '%');
      stop.setAttribute('stop-color', color);
      grad.appendChild(stop);
    }, this);

    const lastColor = sortedColors[sortedColors.length - 1];
    const endStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    endStop.setAttribute('offset', '100%');
    endStop.setAttribute('stop-color', lastColor);
    grad.appendChild(endStop);

    defs.appendChild(grad);
    this._bgRect.setAttribute('fill', 'url(#' + gradId + ')');
  }
}

export default HeaderBarCell;
