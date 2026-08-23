/**
 * Cell — base cell class.
 * Common abstraction shared by all cell types.
 * Positioning is based on row/column indices (row, col); no absolute pixels are stored.
 */
import { getActiveScheme } from '../../config/colors.js';
import { hexToRgba } from '../../utils/color.js';

class Cell {
  /**
   * @param {Object} cfg
   * @param {string}  cfg.type       — cell type identifier
   * @param {number}  cfg.r          — starting row index (0-based)
   * @param {number}  cfg.c          — starting column index (0-based)
   * @param {number}  [cfg.rs=1]    — row span
   * @param {number}  [cfg.cs=1]    — column span
   * @param {Object}  cfg.grid       — grid constants reference { CELL_W, CELL_H, GAP, STEP_X, STEP_Y, svgNS }
   * @param {SVGGElement} cfg.container — parent container <g>
   * @param {dtrPicker} cfg.picker   — main instance reference
   */
  constructor(cfg) {
    this.type = cfg.type;
    this.r = cfg.r;
    this.c = cfg.c;
    this.rs = cfg.rs || 1;
    this.cs = cfg.cs || 1;
    this.g = cfg.grid;
    this.container = cfg.container;
    this.picker = cfg.picker;
    /** @type {string|null} Background color, automatically drawn by the base render(). */
    this.bgColor = cfg.bgColor || null;
    /** @type {SVGElement[]} All SVG elements created by this cell. */
    this.elements = [];
    /** @type {boolean} Hover enabled by default; subclasses may set to false to disable. */
    this._hoverEnabled = true;
    /** @type {boolean} Whether the cell is currently in a hover-highlight state. */
    this._isHovered = false;
    /** @type {SVGRectElement|null} Reference to the hit area DOM element. */
    this._hitRect = null;
    // ──── Debug border (base-class property, forced on all subclasses) ────
    /** @type {string} Border color; empty string means no border. */
    this._borderColor = '#000000';
    /** @type {number} Border width (px); set to 0 to disable the debug border. */
    this._borderWidth = 0;
    /** @type {boolean} Whether to skip the automatic GAP (for absolutely positioned cells)
     *  Note: no current readers; kept for future use (user confirmed to keep, do not delete). */
    this._skipGridGap = false;
  }

  // ──── Coordinate calculation (derived from r/c/rs/cs; no absolute values stored) ────

  /** @returns {number} Left edge x. */
  get x() { return this.g.GAP + this.c * this.g.STEP_X; }
  /** @returns {number} Top edge y = GAP + r × STEP_Y. */
  get y() { return this.g.GAP + this.r * this.g.STEP_Y; }
  /** @returns {number} Width = cs × CELL_W + (cs-1) × GAP. */
  get w() { return this.cs * this.g.CELL_W + (this.cs - 1) * this.g.GAP; }
  /** @returns {number} Height = rs × CELL_H + (rs-1) × GAP. */
  get h() { return this.rs * this.g.CELL_H + (this.rs - 1) * this.g.GAP; }

  // ──── Default style getters (overridable by subclasses) ────

  /** @returns {string} Default font size. */
  get textSize()   { return '13'; }
  /** @returns {string} Default font weight. */
  get textWeight() { return '500'; }
  /** @returns {string} Default text color. */
  get textColor()  { return this.picker.options.textColor; }
  /** @returns {string} Default hover highlight color (based on the selected color at 7% opacity). */
  get hoverColor() { return hexToRgba(this.picker.options.selectedColor, 0.07); }

  /**
   * Set or clear this cell's hover-highlight state.
   * Highlighting is not allowed while picker._hoverDisabled is true.
   * @param {boolean} on - true=highlight, false=clear
   */
  setHover(on) {
    if (!this._hoverEnabled) return;
    if (on && this.picker && this.picker._hoverDisabled) return;
    this._isHovered = on;
    if (this._hitRect) {
      this._hitRect.style.fill = on ? this.hoverColor : 'transparent';
    }
  }

  /**
   * Get the background color for the current color scheme at the given offset.
   * @param {number} offset - offset index into the scheme colors array (e.g. month, year+2)
   * @returns {string} color value
   */
  _cellColor(offset) {
    const scheme = getActiveScheme(this.picker.options);
    const schemeColors = scheme.colors;
    const schemeLen = schemeColors.length;
    const cs = this.picker._colorShift;
    return schemeColors[(offset + cs) % schemeLen];
  }

  // ──── Lifecycle ────

  /** Create all SVG elements needed by this cell. Subclasses override this method. */
  render() {
    // Base class automatically draws the background color
    if (this.bgColor) {
      this._createRect(this.x, this.y, this.w, this.h, { fill: this.bgColor });
    }
  }

  /** Remove all SVG elements from the parent container. */
  destroy() {
    this.elements.forEach(function (el) { el.remove(); });
    this.elements = [];
  }

  // ──── Common helpers (called from subclass render()) ────

  _createRect(x, y, w, h, attrs) {
    if (!attrs) attrs = {};
    const rect = document.createElementNS(this.g.svgNS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    Object.keys(attrs).forEach(function (k) { rect.setAttribute(k, attrs[k]); });
    this.container.appendChild(rect);
    this.elements.push(rect);
    return rect;
  }

  _createText(x, y, content, attrs) {
    if (!attrs) attrs = {};
    const text = document.createElementNS(this.g.svgNS, 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('dy', '1.5');
    Object.keys(attrs).forEach(function (k) { text.setAttribute(k, attrs[k]); });
    text.textContent = String(content);
    this.container.appendChild(text);
    this.elements.push(text);
    return text;
  }

  _createHitRect(dataAttrs) {
    if (!this._hoverEnabled) return null;
    if (!dataAttrs) dataAttrs = {};
    const rect = document.createElementNS(this.g.svgNS, 'rect');
    rect.setAttribute('x', this.x);
    rect.setAttribute('y', this.y);
    rect.setAttribute('width', this.w);
    rect.setAttribute('height', this.h);
    rect.style.fill = 'transparent';
    Object.keys(dataAttrs).forEach(function (k) { rect.setAttribute(k, dataAttrs[k]); });
    if (this._borderWidth > 0 && this._borderColor) {
      rect.setAttribute('stroke', this._borderColor);
      rect.setAttribute('stroke-width', String(this._borderWidth));
      rect.setAttribute('x', this.x + 0.5);
      rect.setAttribute('y', this.y + 0.5);
      rect.setAttribute('width', this.w - 1);
      rect.setAttribute('height', this.h - 1);
    }
    const cell = this;
    rect.addEventListener('mouseenter', function () { cell.setHover(true); });
    rect.addEventListener('mouseleave', function () { cell.setHover(false); });
    this._hitRect = rect;
    this.container.appendChild(rect);
    this.elements.push(rect);
    return rect;
  }

  _drawDebugBorder() {
    if (!(this._borderWidth > 0 && this._borderColor)) return;
    const rect = document.createElementNS(this.g.svgNS, 'rect');
    rect.setAttribute('x', this.x + 0.5);
    rect.setAttribute('y', this.y + 0.5);
    rect.setAttribute('width', this.w - 1);
    rect.setAttribute('height', this.h - 1);
    rect.setAttribute('stroke', this._borderColor);
    rect.setAttribute('stroke-width', String(this._borderWidth));
    rect.style.fill = 'transparent';
    rect.style.pointerEvents = 'none';
    this.container.appendChild(rect);
    this.elements.push(rect);
  }
}

export default Cell;
