/**
 * TimeCell — hour/minute column cell.
 *
 * Each hour/minute column is managed by one TimeCell; each internal row is an independent <g> sub-container:
 *   hit area <rect>  → mouse events (hover, mousedown click feedback)
 *   highlight <rect> → blue background of the currently selected row (middle row only, pointer-events:none)
 *   number <text>    → value display (topmost layer, pointer-events:none)
 *
 * Design: the first render() creates a fixed number of DOM nodes and caches references;
 *      subsequent setValue() calls only update the text and style attributes of existing DOM,
 *      never creating/destroying nodes, reducing layout thrash and GC pressure.
 * @extends Cell
 */
import Cell from './cell.js';
import { hexToRgba } from '../../utils/color.js';

class TimeCell extends Cell {
  /**
   * @param {Object} cfg
   * @param {string} cfg.subType - 'hour'|'minute'|'startHour'|'startMinute'|'endHour'|'endMinute'
   * @param {number} cfg.currentValue - current selected value
   * @param {number} cfg.min - minimum value
   * @param {number} cfg.max - maximum value
   * @param {number} cfg.rowCount - number of visible rows
   */
  constructor(cfg) {
    super(cfg);
    this.type = 'time';
    this.subType = cfg.subType;
    this.currentValue = cfg.currentValue;
    this.min = cfg.min;
    this.max = cfg.max;
    this.rowCount = cfg.rowCount;
    this._hoverEnabled = false;
    /** @type {SVGRectElement|null} Highlight row rect. */
    this._highlightRect = null;
    /**
     * Per-row sub-container info; length always equals rowCount.
     * @type {Array<{g: SVGGElement, hitRect: SVGRectElement, text: SVGTextElement}>}
     */
    this._rowGroups = [];
  }

  /** Row height: inherits the base Cell height of rs × CELL_H by default (a single time column spans rs rows). */
  get h() { return super.h; }
  /** Column width: fixed single-column width CELL_W (each time column is one cell, no spanning). */
  get w() { return this.g.CELL_W; }

  /** @private Compute the row layout parameters. */
  _layout() {
    const cellH = this.h;
    const rowCount = this.rowCount;
    const rowH = Math.floor(cellH / rowCount);
    const contentH = rowCount * rowH;
    const offsetY = Math.floor((cellH - contentH) / 2);
    const baseY = this.y + offsetY;
    const centerIdx = Math.floor(rowCount / 2);
    return { rowCount, rowH, baseY, centerIdx };
  }

  /**
   * @private Get the wrapped value at the given offset.
   * Note: only wraps once by ±range, suitable for small offsets (on the order of visible rows);
   * if currentValue is initially out of range or the offset is too large it may still be out of range
   * (current callers guarantee validity, kept).
   */
  _wrapVal(offset) {
    const range = this.max - this.min + 1;
    let val = this.currentValue + offset;
    if (val < this.min) val += range;
    if (val > this.max) val -= range;
    return val;
  }

  /**
   * Update the current value — only changes the text and styles of existing DOM, without creating/destroying elements.
   * @param {number} newVal
   */
  setValue(newVal) {
    this.currentValue = newVal;
    this._updateDisplay();
  }

  /**
   * Initial render: create all DOM elements and cache references.
   * Later value changes go through setValue → _updateDisplay; this method is not called again.
   */
  render() {
    super.render();
    const self = this;
    const cx = this.x;
    const { rowCount, rowH, baseY, centerIdx } = this._layout();
    const half = centerIdx;
    const opt = this.picker.options;
    const ns = this.g.svgNS;

    for (let i = 0; i < rowCount; i++) {
      const val = this._wrapVal(i - half);
      const rowTop = baseY + i * rowH;
      const isCurrent = val === this.currentValue;

      // Row group container <g>
      const rowG = document.createElementNS(ns, 'g');
      rowG.setAttribute('data-time-type', this.subType);
      rowG.setAttribute('data-time-val', String(val));
      this.container.appendChild(rowG);
      this.elements.push(rowG);

      // Hit area rect (no border, no background; captures mouse events)
      const hitRect = document.createElementNS(ns, 'rect');
      hitRect.setAttribute('x', cx);
      hitRect.setAttribute('y', rowTop);
      hitRect.setAttribute('width', this.w);
      hitRect.setAttribute('height', rowH);
      hitRect.style.fill = 'transparent';
      rowG.appendChild(hitRect);

      // Highlight rect — current row (middle row) only, independent of the hit area, unaffected by hover/clear
      let hlRect = null;
      if (isCurrent) {
        hlRect = document.createElementNS(ns, 'rect');
        hlRect.setAttribute('x', cx);
        hlRect.setAttribute('y', rowTop);
        hlRect.setAttribute('width', this.w);
        hlRect.setAttribute('height', rowH);
        hlRect.setAttribute('fill', opt.selectedColor);
        hlRect.setAttribute('data-time-type', this.subType);
        hlRect.setAttribute('data-time-highlight', 'true');
        hlRect.style.pointerEvents = 'none';
        rowG.appendChild(hlRect);
        this._highlightRect = hlRect;
      }

      // Number text (topmost layer)
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', cx + this.w / 2);
      text.setAttribute('y', rowTop + rowH / 2);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('dy', '1.5');
      text.setAttribute('fill', isCurrent ? opt.selectedTextColor : opt.textColor);
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', isCurrent ? '700' : '500');
      text.setAttribute('data-time-type', this.subType);
      text.setAttribute('data-time-val', String(val));
      text.style.pointerEvents = 'none';
      text.textContent = String(val).padStart(2, '0');
      rowG.appendChild(text);

      // Store a text reference on the hit area so it can turn white during the mousedown feedback
      hitRect._timeText = text;
      // Hit area events: hover
      const rowInfo = { g: rowG, hitRect: hitRect, text: text, hlRect: hlRect, _hovered: false, isCur: isCurrent };
      (function (r, info) {
        r.addEventListener('mouseenter', function () {
          if (self.picker.isDragActive && self.picker.isDragActive()) return;
          if (info.isCur) return;
          info._hovered = true;
          r.style.fill = hexToRgba(self.picker.options.selectedColor, 0.07);
        });
        r.addEventListener('mouseleave', function () {
          info._hovered = false;
          if (info.isCur) return;
          r.style.fill = 'transparent';
        });
      })(hitRect, rowInfo);

      this._rowGroups.push(rowInfo);
    }

    this._drawDebugBorder();
  }

  /** @private Restore a row's hover highlight (if the mouse is still over that row). */
  _applyRowHover(row) {
    if (!row || !row._hovered) return;
    if (row.isCur) return;
    if (this.picker.isDragActive && this.picker.isDragActive()) return;
    row.hitRect.style.fill = hexToRgba(this.picker.options.selectedColor, 0.07);
  }

  /** @private Only update the text content and styles of existing DOM. */
  _updateDisplay() {
    const cx = this.x;
    const { rowCount, rowH, baseY, centerIdx } = this._layout();
    const half = centerIdx;
    const opt = this.picker.options;

    for (let i = 0; i < rowCount; i++) {
      const val = this._wrapVal(i - half);
      const isCurrent = val === this.currentValue;
      const row = this._rowGroups[i];
      if (!row) continue;

      // Update the highlight rect for the current row; clear the mousedown feedback for non-current rows
      if (isCurrent) {
        if (row.hlRect) row.hlRect.setAttribute('fill', opt.selectedColor);
      } else {
        row.hitRect.style.fill = 'transparent';
      }

      // Text — only update content, color, and font weight
      row.text.textContent = String(val).padStart(2, '0');
      row.text.setAttribute('fill', isCurrent ? opt.selectedTextColor : opt.textColor);
      row.text.setAttribute('font-weight', isCurrent ? '700' : '500');
      row.text.setAttribute('data-time-val', String(val));

      // data attributes of the row group and hit area
      row.g.setAttribute('data-time-val', String(val));
      row.hitRect.setAttribute('data-time-val', String(val));

      // Restore the hover state (mouseenter is not re-fired when fill changes)
      this._applyRowHover(row);
    }

    // Sync the _highlightRect reference (after the value changes the middle row moves, but hlRect stays in place)
    const curRow = this._rowGroups[centerIdx];
    this._highlightRect = curRow ? curRow.hlRect : null;
  }

  /** Clear all row hover highlights (the current row's highlight is handled by its own hlRect and is unaffected). */
  clearHoverFills() {
    for (let i = 0; i < this._rowGroups.length; i++) {
      const row = this._rowGroups[i];
      row.hitRect.style.fill = 'transparent';
    }
    // mouseenter is not re-fired when fill changes, so manually restore the hover state
    for (let i = 0; i < this._rowGroups.length; i++) {
      this._applyRowHover(this._rowGroups[i]);
    }
  }

  destroy() {
    super.destroy();
    this._highlightRect = null;
    this._rowGroups = [];
  }
}

export default TimeCell;
