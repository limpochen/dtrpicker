/**
 * TimeCell — 时分列格子。
 *
 * 每个时/分列由一个 TimeCell 管理，内部每行是一个独立 <g> 子容器：
 *   热区 <rect>  → 鼠标事件（hover、mousedown 点击反馈）
 *   高亮 <rect>  → 当前选中行蓝底（仅中间行，pointer-events:none）
 *   数字 <text>  → 数值显示（最上层，pointer-events:none）
 *
 * 设计：首次 render() 创建固定数量的 DOM 并缓存引用；
 *      后续 setValue() 仅更新已有 DOM 的文本和样式属性，
 *      不创建/销毁 DOM 节点，减少布局抖动和 GC 压力。
 * @extends Cell
 */
import Cell from './cell.js';
import { hexToRgba } from '../../utils/color.js';

class TimeCell extends Cell {
  /**
   * @param {Object} cfg
   * @param {string} cfg.subType - 'hour'|'minute'|'startHour'|'startMinute'|'endHour'|'endMinute'
   * @param {number} cfg.currentValue - 当前选中值
   * @param {number} cfg.min - 最小值
   * @param {number} cfg.max - 最大值
   * @param {number} cfg.rowCount - 可见行数
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
    /** @type {SVGRectElement|null} 高亮行 rect */
    this._highlightRect = null;
    /**
     * 每行子容器信息，长度恒等于 rowCount。
     * @type {Array<{g: SVGGElement, hitRect: SVGRectElement, text: SVGTextElement}>}
     */
    this._rowGroups = [];
  }

  get h() { return super.h; }
  get w() { return this.g.CELL_W; }

  /** @private 计算行布局参数 */
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

  /** @private 根据偏移量获取环绕后的值 */
  _wrapVal(offset) {
    const range = this.max - this.min + 1;
    let val = this.currentValue + offset;
    if (val < this.min) val += range;
    if (val > this.max) val -= range;
    return val;
  }

  /**
   * 更新当前值——仅改已有 DOM 的文本和样式，不创建/销毁元素。
   * @param {number} newVal
   */
  setValue(newVal) {
    this.currentValue = newVal;
    this._updateDisplay();
  }

  /**
   * 首次渲染：创建全部 DOM 元素并缓存引用。
   * 之后值变化走 setValue → _updateDisplay，不再调用此方法。
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

      // 行组容器 <g>
      const rowG = document.createElementNS(ns, 'g');
      rowG.setAttribute('data-time-type', this.subType);
      rowG.setAttribute('data-time-val', String(val));
      this.container.appendChild(rowG);
      this.elements.push(rowG);

      // 热区 rect（无边框、无背景，捕获鼠标事件）
      const hitRect = document.createElementNS(ns, 'rect');
      hitRect.setAttribute('x', cx);
      hitRect.setAttribute('y', rowTop);
      hitRect.setAttribute('width', this.w);
      hitRect.setAttribute('height', rowH);
      hitRect.style.fill = 'transparent';
      rowG.appendChild(hitRect);

      // 高亮 rect——仅当前行（中间行），独立于热区，不受 hover/clear 影响
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

      // 数字文本（最上层）
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

      // 热区存文字引用，供 mousedown 反馈时同时变白
      hitRect._timeText = text;
      // 热区事件：hover
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

  /** @private 恢复某行的 hover 高亮（如果鼠标仍在该行上） */
  _applyRowHover(row) {
    if (!row || !row._hovered) return;
    if (row.isCur) return;
    if (this.picker.isDragActive && this.picker.isDragActive()) return;
    row.hitRect.style.fill = hexToRgba(this.picker.options.selectedColor, 0.07);
  }

  /** @private 仅更新已有 DOM 的文本内容和样式 */
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

      // 当前行更新高亮 rect，非当前行清除 mousedown 反馈
      if (isCurrent) {
        if (row.hlRect) row.hlRect.setAttribute('fill', opt.selectedColor);
      } else {
        row.hitRect.style.fill = 'transparent';
      }

      // 文本——仅改内容、颜色、字重
      row.text.textContent = String(val).padStart(2, '0');
      row.text.setAttribute('fill', isCurrent ? opt.selectedTextColor : opt.textColor);
      row.text.setAttribute('font-weight', isCurrent ? '700' : '500');
      row.text.setAttribute('data-time-val', String(val));

      // 行组和热区的 data 属性
      row.g.setAttribute('data-time-val', String(val));
      row.hitRect.setAttribute('data-time-val', String(val));

      // 恢复 hover 状态（mouseenter 不会因 fill 改变而重发）
      this._applyRowHover(row);
    }

    // 同步 _highlightRect 引用（值变化后中间行变了，但 hlRect 还在原位）
    const curRow = this._rowGroups[centerIdx];
    this._highlightRect = curRow ? curRow.hlRect : null;
  }

  /** 清除所有行 hover 高亮（当前行高亮由独立的 hlRect 负责，不受影响） */
  clearHoverFills() {
    for (let i = 0; i < this._rowGroups.length; i++) {
      const row = this._rowGroups[i];
      row.hitRect.style.fill = 'transparent';
    }
    // mouseenter 不会因 fill 改变而重发，手动恢复 hover 状态
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
