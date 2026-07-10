/**
 * Cell — 格子基类。
 * 所有格子类型的共同抽象。
 * 定位基于行列号 (row, col)，不存绝对像素。
 */
import { getActiveScheme } from '../../config/colors.js';
import { hexToRgba } from '../../utils/color.js';

class Cell {
  /**
   * @param {Object} cfg
   * @param {string}  cfg.type       — 格子类型标识
   * @param {number}  cfg.r          — 起始行号（0-based）
   * @param {number}  cfg.c          — 起始列号（0-based）
   * @param {number}  [cfg.rs=1]    — 行跨度
   * @param {number}  [cfg.cs=1]    — 列跨度
   * @param {Object}  cfg.grid       — 网格常量引用 { CELL_W, CELL_H, GAP, STEP_X, STEP_Y, svgNS }
   * @param {SVGGElement} cfg.container — 父容器 <g>
   * @param {dtrPicker} cfg.picker   — 主实例引用
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
    /** @type {string|null} 背景色，由基类 render() 自动绘制 */
    this.bgColor = cfg.bgColor || null;
    /** @type {SVGElement[]} 此格子创建的所有 SVG 元素 */
    this.elements = [];
    /** @type {boolean} 默认允许 hover，子类可设为 false 禁止 */
    this._hoverEnabled = true;
    /** @type {boolean} 当前是否处于 hover 高亮状态 */
    this._isHovered = false;
    /** @type {SVGRectElement|null} 热区 DOM 元素引用 */
    this._hitRect = null;
    // ──── 调试边框（基类属性，所有子类强制继承）────
    /** @type {string} 边框颜色，空字符串=不显示 */
    this._borderColor = '#000000';
    /** @type {number} 边框宽度（px），设为 0 禁用调试边框 */
    this._borderWidth = 0;
    /** @type {boolean} 是否跳过自动 GAP（用于绝对定位的格子） */
    this._skipGridGap = false;
  }

  // ──── 坐标计算（由 r/c/rs/cs 换算，不存绝对值）────

  /** @returns {number} 左边缘 x */
  get x() { return this.g.GAP + this.c * this.g.STEP_X; }
  /** @returns {number} 上边缘 y = GAP + r × STEP_Y */
  get y() { return this.g.GAP + this.r * this.g.STEP_Y; }
  /** @returns {number} 宽度 = cs × CELL_W + (cs-1) × GAP */
  get w() { return this.cs * this.g.CELL_W + (this.cs - 1) * this.g.GAP; }
  /** @returns {number} 高度 = rs × CELL_H + (rs-1) × GAP */
  get h() { return this.rs * this.g.CELL_H + (this.rs - 1) * this.g.GAP; }

  // ──── 默认样式 getter（子类可覆盖）────

  /** @returns {string} 默认字号 */
  get textSize()   { return '13'; }
  /** @returns {string} 默认字重 */
  get textWeight() { return '500'; }
  /** @returns {string} 默认文字颜色 */
  get textColor()  { return this.picker.options.textColor; }
  /** @returns {string} 默认 hover 高亮色（基于选中色，7% 透明度） */
  get hoverColor() { return hexToRgba(this.picker.options.selectedColor, 0.07); }

  /**
   * 设置/清除此格子的 hover 高亮状态。
   * 当 picker._hoverDisabled 为 true 时，不允许点亮高亮。
   * @param {boolean} on - true=点亮高亮, false=清除
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
   * 根据偏移量获取当前色系下的背景色。
   * @param {number} offset - 色系数组的偏移索引（如 month、year+2 等）
   * @returns {string} 颜色值
   */
  _cellColor(offset) {
    const scheme = getActiveScheme(this.picker.options);
    const schemeColors = scheme.colors;
    const schemeLen = schemeColors.length;
    const cs = this.picker._colorShift;
    return schemeColors[(offset + cs) % schemeLen];
  }

  // ──── 生命周期 ────

  /** 创建此格子所需的所有 SVG 元素。子类重写此方法。 */
  render() {
    // 基类自动绘制背景色
    if (this.bgColor) {
      this._createRect(this.x, this.y, this.w, this.h, { fill: this.bgColor });
    }
  }

  /** 从父容器中移除所有 SVG 元素 */
  destroy() {
    this.elements.forEach(function (el) { el.remove(); });
    this.elements = [];
  }

  // ──── 通用辅助方法（子类 render() 中调用）────

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
