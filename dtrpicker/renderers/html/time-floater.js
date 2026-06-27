/**
 * TimeFloater — HTML 时间滚轮拖拽放大浮层。
 *
 * 在拖拽时/分列时，浮动显示一个 2x 放大的列内容快照，
 * 解决手指遮挡看不清数值的问题。
 *
 * 设计：首次 show() 创建全部 DOM 并缓存引用；
 *      后续 update() 仅改已有元素的 textContent，不创建/销毁元素。
 */
class TimeFloater {
  constructor(cfg) {
    this.panel = cfg.panel;
    this.selectedColor = cfg.selectedColor;
    this.textColor = cfg.textColor;
    this.selectedTextColor = cfg.selectedTextColor;

    /** @type {HTMLDivElement|null} 浮层根元素 */
    this._el = null;
    /** @type {string|null} 当前显示的列标识 */
    this._type = null;

    /** @type {HTMLDivElement|null} 浮层高亮行 */
    this._hlEl = null;
    /** @type {HTMLSpanElement[]} 行文本元素缓存 */
    this._textNodes = [];

    // 尺寸参数（与 SVG 版一致）
    this._width = 48;
    this._fontSize = 18;
    this._lineHeight = 33;
    this._height = 240;
    this._visibleRows = 7;
    this._radius = 8;
    this._borderWidth = 3;
    this._fontWeightNormal = '500';
    this._fontWeightCurrent = '700';
  }

  /**
   * 显示浮层
   * @param {HTMLElement} anchorEl - 触发列元素（用于定位）
   * @param {string} type - 列标识
   * @param {Function} getVal - () => number 获取当前值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   */
  show(anchorEl, type, getVal, min, max, bgColor) {
    this.hide();
    this._type = type;

    const W = this._width;
    const H = this._height;

    // 定位：与 SVG 版一致——相对于面板左上角 (panelW/3, (panelH - H)/2)
    const panelRect = this.panel.getBoundingClientRect();
    const fx = Math.floor(panelRect.left + panelRect.width / 3);
    const fy = Math.floor(panelRect.top + (panelRect.height - H) / 2);

    // ─── 根容器（圆角矩形 + 阴影 + 边框）───
    const el = document.createElement('div');
    el.className = 'dp-time-floater';
    el.style.cssText = [
      'position:fixed',
      'pointer-events:none',
      'z-index:100000',
      `left:${fx}px`,
      `top:${fy}px`,
      `width:${W}px`,
      `height:${H}px`,
      `border-radius:${this._radius}px`,
      'box-shadow:0 8px 28px rgba(0,0,0,0.35)',
      'border:3px solid #8c00ff',
      'overflow:hidden',
    ].join(';');

    this._renderContent(el, getVal(), min, max, bgColor);

    document.body.appendChild(el);
    this._el = el;
  }

  /**
   * 更新浮层内容（拖拽滑动中调用）
   * @param {Function} getVal - () => number
   * @param {number} min
   * @param {number} max
   */
  update(getVal, min, max) {
    if (!this._el || !this._type) return;
    if (this._textNodes.length === 0) return;

    const cur = getVal();
    const range = max - min + 1;
    const half = Math.floor(this._visibleRows / 2);

    for (let i = 0; i < this._visibleRows; i++) {
      const offset = i - half;
      const val = ((cur - min + offset) % range + range) % range + min;
      const isCurrent = i === half;

      // 高亮行——始终在中行，位置不变，仅刷新颜色
      if (isCurrent && this._hlEl) {
        this._hlEl.style.background = this.selectedColor;
      }

      // 文本——仅改内容、颜色、字重
      const node = this._textNodes[i];
      if (node) {
        node.textContent = String(val).padStart(2, '0');
        node.style.color = isCurrent ? this.selectedTextColor : this.textColor;
        node.style.fontWeight = isCurrent ? this._fontWeightCurrent : this._fontWeightNormal;
      }
    }
  }

  /** @private 创建浮层内容并缓存引用 */
  _renderContent(target, curVal, min, max, bgColor) {
    // 重置缓存
    this._textNodes = [];
    this._hlEl = null;

    const W = this._width;
    const H = this._height;
    // 内容区宽度：扣除左右边框宽度，因为 root 有 border-box
    const contentW = W - 2 * this._borderWidth;
    const lh = this._lineHeight;
    const fs = this._fontSize;
    const rowsH = this._visibleRows * lh;
    const offsetY = Math.floor((H - rowsH) / 2);
    const range = max - min + 1;
    const half = Math.floor(this._visibleRows / 2);

    // 背景——使用对应列的背景色
    const bg = document.createElement('div');
    bg.style.cssText = [
      'position:absolute',
      'left:0',
      'top:0',
      `width:${contentW}px`,
      `height:${H}px`,
      `background:${bgColor || '#f5f5f5'}`,
    ].join(';');
    target.appendChild(bg);

    for (let i = 0; i < this._visibleRows; i++) {
      const offset = i - half;
      const val = ((curVal - min + offset) % range + range) % range + min;
      const y = offsetY + i * lh;
      const isCurrent = i === half;

      if (isCurrent) {
        const hl = document.createElement('div');
        hl.style.cssText = [
          'position:absolute',
          'left:0',
          `top:${y}px`,
          `width:${contentW}px`,
          `height:${lh}px`,
          `background:${this.selectedColor}`,
        ].join(';');
        target.appendChild(hl);
        this._hlEl = hl;
      }

      const t = document.createElement('span');
      t.style.cssText = [
        'position:absolute',
        'left:0',
        `top:${y}px`,
        `width:${contentW}px`,
        `height:${lh}px`,
        `line-height:${lh}px`,
        'text-align:center',
        'padding-bottom:1px',
        'box-sizing:border-box',
        `font-size:${isCurrent ? fs + 2 : fs}px`,
        `font-weight:${isCurrent ? this._fontWeightCurrent : this._fontWeightNormal}`,
        `color:${isCurrent ? this.selectedTextColor : this.textColor}`,
      ].join(';');
      t.textContent = String(val).padStart(2, '0');
      target.appendChild(t);
      this._textNodes.push(t);
    }
  }

  /** 隐藏浮层 */
  hide() {
    if (this._el) { this._el.remove(); this._el = null; }
    this._type = null;
    this._textNodes = [];
    this._hlEl = null;
  }

  destroy() {
    this.hide();
  }
}

export default TimeFloater;
