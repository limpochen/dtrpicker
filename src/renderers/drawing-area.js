/**
 * DrawingArea — 作画区域。
 * 不渲染任何 SVG 元素，仅定义网格子区域并管理子格子。
 * 子格子使用相对坐标 (r, c, rs, cs)，超出区域范围的不绘制。
 */
class DrawingArea {
  /**
   * @param {Object} cfg
   * @param {number}  cfg.r       — 绝对行号
   * @param {number}  cfg.c       — 绝对列号
   * @param {number}  cfg.rs      — 行跨度
   * @param {number}  cfg.cs      — 列跨度
   * @param {boolean} [cfg.scrollable=false] — 是否可滚动（CalendarArea）
   * @param {SVGSVGElement} cfg.parentSvg — 父 SVG，用于创建内部容器
   * @param {string}  cfg.containerId — 内部容器 id
   * @param {Object}  cfg.grid    — 网格常量
   * @param {dtrPicker} cfg.picker — 主实例引用
   */
  constructor(cfg) {
    this.r = cfg.r;
    this.c = cfg.c;
    this.rs = cfg.rs;
    this.cs = cfg.cs;
    this.grid = cfg.grid;
    this.picker = cfg.picker;
    this.scrollable = cfg.scrollable || false;
    this._translateY = 0;
    this.children = [];

    // 创建内部 SVG <g> 容器
    this.container = document.createElementNS(cfg.grid.svgNS, 'g');
    this.container.setAttribute('id', cfg.containerId);
    cfg.parentSvg.appendChild(this.container);
  }

  /**
   * 向区域内添加一个子格子。
   * 相对坐标超出区域范围则不创建。
   * @param {Object} cfg
   * @param {Function} cfg.cellClass — Cell 子类构造函数
   * @param {number} cfg.r  — 区域内相对行号
   * @param {number} cfg.c  — 区域内相对列号
   * @param {number} [cfg.rs=1] — 行跨度
   * @param {number} [cfg.cs=1] — 列跨度
   * @param {Object} [cfg.extra={}] — 传递给 Cell 构造函数的其他参数
   * @returns {Cell|null}
   */
  addChild(cfg) {
    // 保留备用：当前库内无调用（用户确认保留，勿删）
    const relR = cfg.r; const relC = cfg.c;
    const rs = cfg.rs || 1; const cs = cfg.cs || 1;
    if (relR < 0 || relR + rs > this.rs) return null;
    if (relC < 0 || relC + cs > this.cs) return null;
    const absR = this.r + relR;
    const absC = this.c + relC;
    const extra = cfg.extra || {};
    const cell = new cfg.cellClass(
      Object.assign({
        bgColor: extra.bgColor || null,
      }, extra, {
        r: absR, c: absC, rs: rs, cs: cs,
        grid: this.grid, container: this.container,
        picker: this.picker,
      })
    );
    cell.render();
    this.children.push(cell);
    return cell;
  }

  /** 清空所有子格子 */
  clear() {
    this.children.forEach(function (c) { c.destroy(); });
    this.children = [];
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  /** 销毁此区域：清空子格子 + 从父节点移除 <g> 容器 */
  destroy() {
    this.clear();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /** 设置滚动偏移（仅 scrollable=true 时有效） */
  setScroll(y) {
    if (!this.scrollable) return;
    this._translateY = y;
    this.container.setAttribute('transform', 'translate(0,' + y + ')');
  }

  /** 获取当前滚动偏移 */
  getScroll() { return this._translateY; }
}

export default DrawingArea;
