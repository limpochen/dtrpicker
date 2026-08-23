/**
 * HeaderBarCell — full-width header background gradient bar.
 * Spans the entire row; draws a linear gradient from the per-column sampled colors injected by _syncHeaderColors.
 * @extends Cell
 */
import Cell from './cell.js';

class HeaderBarCell extends Cell {
  constructor(cfg) {
    super(cfg);
    this.type = 'header-bar';
    this._hoverEnabled = false;
    /** @type {string[]} Sampled color per column, injected by setHeaderColors. */
    this._hColors = [];
  }

  /** Full bar width = total width - left/right GAP. */
  get w() { return this.picker.SVG_W - this.g.GAP * 2; }
  /** Cell content height = CELL_H, leaving GAP at the bottom. */
  get h() { return this.g.CELL_H; }
  /** y: starts from the top edge of the grid. */
  get y() { return this.g.GAP; }
  /** x: starts from the left edge of the grid. */
  get x() { return this.g.GAP; }

  /**
   * Inject the per-column sampled colors.
   * @param {string[]} colors - array of per-column color values
   */
  setHeaderColors(colors) {
    this._hColors = colors;
  }

  /**
   * Internal method: array of [color] sorted by physical column position.
   * @returns {string[]}
   * @private
   */
  _sortedColors() {
    const cells = this.picker._headerCells;
    if (!cells || cells.length === 0) return [];
    const fallback = this.picker.options.cellColor;
    const arr = cells.map(function (c, idx) {
      // Use the sampled color, falling back if not injected (necessary defensive measure, kept;
      // missing colors use the cell background so gradient stops are never null)
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
      const stop = document.createElementNS(this.g.svgNS, 'stop');
      stop.setAttribute('offset', pct + '%');
      stop.setAttribute('stop-color', color);
      grad.appendChild(stop);
    }, this);

    const lastColor = sortedColors[sortedColors.length - 1];
    const endStop = document.createElementNS(this.g.svgNS, 'stop');
    endStop.setAttribute('offset', '100%');
    endStop.setAttribute('stop-color', lastColor);
    grad.appendChild(endStop);

    defs.appendChild(grad);
    this._bgRect.setAttribute('fill', 'url(#' + gradId + ')');
  }
}

export default HeaderBarCell;
