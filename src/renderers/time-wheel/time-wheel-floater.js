/**
 * TimeWheelFloater — time wheel magnifier floater (native SVG rendering)
 *
 * Draws a magnifier panel inside the SVG that shows nearby selectable values
 * of a time column at an enlarged font size. Positioned in the upper-right area
 * of the SVG; does not depend on external DOM.
 *
 * @file       Time wheel magnifier floater
 * @version    2.1.11
 * @license    MIT
 */

class TimeWheelFloater {
  /**
   * @param {Object} cfg
   * @param {string} cfg.svgNS - SVG namespace
   * @param {SVGSVGElement} cfg.svg - parent SVG element
   * @param {string} cfg.selectedColor
   * @param {string} cfg.todayBarColor
   * @param {string} cfg.textColor
   * @param {string} cfg.selectedTextColor
   * @param {Function} cfg.getTimeCell - (type) => TimeCell|null
   * @param {Function} cfg.getBgColor - (type) => string|null
   */
  constructor(cfg) {
    this.svgNS = cfg.svgNS;
    this.svg = cfg.svg;
    this.selectedColor = cfg.selectedColor;
    this.todayBarColor = cfg.todayBarColor;
    this.textColor = cfg.textColor;
    this.selectedTextColor = cfg.selectedTextColor;
    this.getTimeCell = cfg.getTimeCell;
    this.getBgColor = cfg.getBgColor;
    this._group = null;
    this._type = null;
    this._width = 48;
    this._fontSize = 18;
    this._lineHeight = 33;
    this._radius = 8;
    this._borderWidth = 3;
    this._shadowOffsetX = 8;
    this._shadowOffsetY = 12;
    this._height = 240;
    this._visibleRows = 7;
    this._fontWeight = 'normal';
    this._fontWeightCurrent = 'bold';
    this._textNodes = [];
    this._hlRect = null;
  }

  /**
   * Show the floater.
   * @param {string} type - column identifier
   */
  show(type) {
    if (this._group) this.hide();
    this._type = type;
    const tc = this.getTimeCell ? this.getTimeCell(type) : null;
    if (!tc) return;
    const bgColor = this.getBgColor ? this.getBgColor(type) : null;
    if (!bgColor) return;

    const W = this._width;
    const H = this._height;
    const svgW = Number(this.svg.getAttribute('width'));
    const svgH = Number(this.svg.getAttribute('height'));
    const fx = Math.floor(svgW / 3);
    const fy = Math.floor((svgH - H) / 2);

    const g = document.createElementNS(this.svgNS, 'g');
    g.setAttribute('class', 'dtrpicker-floater');
    g.style.pointerEvents = 'none';

    const shadow = document.createElementNS(this.svgNS, 'rect');
    shadow.setAttribute('x', fx + this._shadowOffsetX);
    shadow.setAttribute('y', fy + this._shadowOffsetY);
    shadow.setAttribute('width', W);
    shadow.setAttribute('height', H);
    shadow.setAttribute('rx', String(this._radius));
    shadow.setAttribute('fill', 'rgba(0,0,0,0.3)');
    g.appendChild(shadow);

    const cg = document.createElementNS(this.svgNS, 'g');
    cg.setAttribute('transform', 'translate(' + fx + ',' + fy + ')');
    cg.setAttribute('data-floater-content', '');
    cg.style.clipPath = 'inset(0 round ' + this._radius + 'px)';
    this._renderMagnifierContent(cg, tc, bgColor);
    g.appendChild(cg);

    const border = document.createElementNS(this.svgNS, 'rect');
    border.setAttribute('x', fx);
    border.setAttribute('y', fy);
    border.setAttribute('width', W);
    border.setAttribute('height', H);
    border.setAttribute('rx', String(this._radius));
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', this.todayBarColor);
    border.setAttribute('stroke-width', String(this._borderWidth));
    g.appendChild(border);

    this._group = g;
    this.svg.appendChild(g);
  }

  /** Update the floater values. */
  update() {
    if (!this._group || !this._type) return;
    const tc = this.getTimeCell ? this.getTimeCell(this._type) : null;
    if (!tc) return;
    if (this._textNodes.length === 0) return;

    const curVal = tc.currentValue;
    const min = tc.min;
    const max = tc.max;
    const range = max - min + 1;
    const half = Math.floor(this._visibleRows / 2);

    for (let i = 0; i < this._visibleRows; i++) {
      const offset = i - half;
      const val = (((curVal - min + offset) % range) + range) % range + min;
      const isCurrent = i === half;
      const text = String(val).padStart(2, '0');

      if (isCurrent && this._hlRect) {
        this._hlRect.setAttribute('fill', this.selectedColor);
      }
      const textNode = this._textNodes[i];
      if (textNode) {
        textNode.textContent = text;
        textNode.setAttribute('fill', isCurrent ? this.selectedTextColor : this.textColor);
      }
    }
  }

  /** @private */
  _renderMagnifierContent(target, tc, bgColor) {
    const curVal = tc.currentValue;
    const min = tc.min;
    const max = tc.max;
    const range = max - min + 1;
    const half = Math.floor(this._visibleRows / 2);
    const W = this._width;
    const H = this._height;
    const lh = this._lineHeight;
    const fs = this._fontSize;
    const rowsH = this._visibleRows * lh;
    const offsetY = Math.floor((H - rowsH) / 2);
    const selColor = this.selectedColor;
    const txtColor = this.textColor;
    const selTxtColor = this.selectedTextColor;

    this._textNodes = [];
    this._hlRect = null;

    const bg = document.createElementNS(this.svgNS, 'rect');
    bg.setAttribute('x', 0);
    bg.setAttribute('y', 0);
    bg.setAttribute('width', W);
    bg.setAttribute('height', H);
    bg.setAttribute('fill', bgColor);
    target.appendChild(bg);

    for (let i = 0; i < this._visibleRows; i++) {
      const offset = i - half;
      const val = (((curVal - min + offset) % range) + range) % range + min;
      const y = offsetY + i * lh;
      const isCurrent = i === half;

      if (isCurrent) {
        const hl = document.createElementNS(this.svgNS, 'rect');
        hl.setAttribute('x', 0);
        hl.setAttribute('y', y);
        hl.setAttribute('width', W);
        hl.setAttribute('height', lh);
        hl.setAttribute('fill', selColor);
        target.appendChild(hl);
        this._hlRect = hl;
      }

      const t = this._createMagnifierText(
        target, W / 2, y + lh / 2,
        String(val).padStart(2, '0'),
        isCurrent ? selTxtColor : txtColor,
        isCurrent ? fs + 2 : fs,
        isCurrent ? this._fontWeightCurrent : this._fontWeight,
      );
      this._textNodes.push(t);
    }
  }

  /** @private */
  _createMagnifierText(target, x, y, text, color, fontSize, fontWeight) {
    const t = document.createElementNS(this.svgNS, 'text');
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('dy', '1.5');
    t.setAttribute('fill', color);
    t.setAttribute('font-size', String(fontSize));
    t.setAttribute('font-weight', fontWeight || '700');
    t.textContent = text;
    target.appendChild(t);
    return t;
  }

  /** Hide the floater. */
  hide() {
    if (this._group) {
      this._group.remove();
      this._group = null;
    }
    this._type = null;
    this._textNodes = [];
    this._hlRect = null;
  }

  /** Destroy the floater. */
  destroy() {
    this.hide();
    this.getTimeCell = null;
    this.getBgColor = null;
    this.svg = null;
    this._textNodes = [];
    this._hlRect = null;
  }
}

export default TimeWheelFloater;
