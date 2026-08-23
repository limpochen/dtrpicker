/**
 * DrawingArea — the drawing area.
 * Renders no SVG elements itself; it only defines grid sub-areas and manages child cells.
 * Child cells use relative coordinates (r, c, rs, cs); anything outside the area is not drawn.
 */
class DrawingArea {
  /**
   * @param {Object} cfg
   * @param {number}  cfg.r       — absolute row index
   * @param {number}  cfg.c       — absolute column index
   * @param {number}  cfg.rs      — row span
   * @param {number}  cfg.cs      — column span
   * @param {boolean} [cfg.scrollable=false] — whether scrollable (CalendarArea)
   * @param {SVGSVGElement} cfg.parentSvg — parent SVG, used to create the inner container
   * @param {string}  cfg.containerId — inner container id
   * @param {Object}  cfg.grid    — grid constants
   * @param {dtrPicker} cfg.picker — main instance reference
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

    // Create the inner SVG <g> container
    this.container = document.createElementNS(cfg.grid.svgNS, 'g');
    this.container.setAttribute('id', cfg.containerId);
    cfg.parentSvg.appendChild(this.container);
  }

  /**
   * Add a child cell to this area.
   * Skip creation when the relative coordinates fall outside the area.
   * @param {Object} cfg
   * @param {Function} cfg.cellClass — Cell subclass constructor
   * @param {number} cfg.r  — relative row index within the area
   * @param {number} cfg.c  — relative column index within the area
   * @param {number} [cfg.rs=1] — row span
   * @param {number} [cfg.cs=1] — column span
   * @param {Object} [cfg.extra={}] — extra arguments passed to the Cell constructor
   * @returns {Cell|null}
   */
  addChild(cfg) {
    // Kept for future use: no callers in the current codebase (user confirmed to keep, do not delete)
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

  /** Clear all child cells. */
  clear() {
    this.children.forEach(function (c) { c.destroy(); });
    this.children = [];
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  /** Destroy this area: clear child cells and remove the <g> container from its parent. */
  destroy() {
    this.clear();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /** Set the scroll offset (only effective when scrollable=true). */
  setScroll(y) {
    if (!this.scrollable) return;
    this._translateY = y;
    this.container.setAttribute('transform', 'translate(0,' + y + ')');
  }

  /** Get the current scroll offset. */
  getScroll() { return this._translateY; }
}

export default DrawingArea;
