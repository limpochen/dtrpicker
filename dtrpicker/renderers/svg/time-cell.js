/**
 * TimeCell — 时分列格子（整列一个格子）。
 * 每个时/分列是一个整体格子，高度=3个日期格高度+2个缝隙高度=110px。
 * 内部管理所有可见行的文本布局。
 *
 * 设计：首次 render() 创建固定数量的 DOM 并缓存引用；
 *      后续 setValue() 仅更新已有元素的 textContent 和样式属性，
 *      不创建/销毁 DOM 节点，减少布局抖动和 GC 压力。
 * @extends Cell
 */
import Cell from './cell.js';

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
    /** @type {SVGTextElement[]} 行文本元素数组，长度恒等于 rowCount */
    this._textNodes = [];
  }

  get h() { return super.h; }
  get w() { return this.g.CELL_W; }

  /** @private 计算行布局参数 */
  _layout() {
    var cellH = this.h;
    var rowCount = this.rowCount;
    var rowH = Math.floor(cellH / rowCount);
    var contentH = rowCount * rowH;
    var offsetY = Math.floor((cellH - contentH) / 2);
    var baseY = this.y + offsetY;
    var centerIdx = Math.floor(rowCount / 2);
    return { rowCount, rowH, baseY, centerIdx };
  }

  /** @private 根据偏移量获取环绕后的值 */
  _wrapVal(offset) {
    var range = this.max - this.min + 1;
    var val = this.currentValue + offset;
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
    var cx = this.x;
    var { rowCount, rowH, baseY, centerIdx } = this._layout();
    var half = centerIdx;

    for (var i = 0; i < rowCount; i++) {
      var val = this._wrapVal(i - half);
      var rowTop = baseY + i * rowH;
      var isCurrent = val === this.currentValue;

      if (isCurrent) {
        this._highlightRect = this._createRect(cx, rowTop, this.w, rowH, {
          fill: this.picker.options.selectedColor,
          'data-time-type': this.subType,
          'data-time-highlight': 'true',
        });
      }

      var text = this._createText(cx + this.w / 2, rowTop + rowH / 2, String(val).padStart(2, '0'), {
        fill: isCurrent ? this.picker.options.selectedTextColor : this.picker.options.textColor,
        'font-size': '13',
        'font-weight': isCurrent ? '700' : '500',
        'data-time-type': this.subType,
        'data-time-val': String(val),
      });
      this._textNodes.push(text);
    }

    this._drawDebugBorder();
  }

  /** @private 仅更新已有 DOM 的文本内容和样式 */
  _updateDisplay() {
    var cx = this.x;
    var { rowCount, rowH, baseY, centerIdx } = this._layout();
    var half = centerIdx;
    var selectedColor = this.picker.options.selectedColor;
    var selTextColor = this.picker.options.selectedTextColor;
    var txtColor = this.picker.options.textColor;

    for (var i = 0; i < rowCount; i++) {
      var val = this._wrapVal(i - half);
      var isCurrent = val === this.currentValue;

      // 高亮 rect——始终在中行，位置不变，仅刷新颜色
      if (isCurrent && this._highlightRect) {
        this._highlightRect.setAttribute('fill', selectedColor);
      }

      // 文本——仅改内容、颜色、字重
      var text = this._textNodes[i];
      if (text) {
        text.textContent = String(val).padStart(2, '0');
        text.setAttribute('fill', isCurrent ? selTextColor : txtColor);
        text.setAttribute('font-weight', isCurrent ? '700' : '500');
        text.setAttribute('data-time-val', String(val));
      }
    }
  }

  destroy() {
    super.destroy();
    this._highlightRect = null;
    this._textNodes = [];
  }
}

export default TimeCell;
