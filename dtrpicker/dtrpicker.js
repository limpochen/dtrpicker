/**
 * dtrpicker.js — 日期范围选择器核心
 *
 * @file       日期范围选择器核心脚本
 * @version    3.3.0
 * @license    MIT
 */

import { BASE_DEFAULTS } from './config/colors.js';
import { getLocale } from './config/i18n.js';
import PickerState from './state/pickerstate.js';
import SvgRenderer from './renderers/svg/index.js';
import HtmlRenderer from './renderers/html/index.js';

// ==================== 渲染器注册表 ====================

const RENDERERS = {
  svg: SvgRenderer,
  html: HtmlRenderer,
};

// ==================== 默认配置 ====================

const DEFAULTS = Object.assign({}, BASE_DEFAULTS, {
  firstDay: 0,
  locale: '',
  colorScheme: 'morandi',
  zIndex: 9999,
  todayBarHeight: 6,
  wheelStep: 40,
});

// ==================== 主类 ====================

/**
 * dtrPicker — 流式日期范围/时间选择器。
 *
 * 支持 SVG 和 HTML+CSS 等多种渲染模式（由 renderMode 选项指定）。
 * 每个实例的 mode 在构造时设定，不可在运行时更改。
 * 如需使用不同 mode，请创建多个实例。
 *
 * @class
 * @param {HTMLElement|string} trigger - 触发器 DOM 元素或 CSS 选择器
 * @param {Object} options - 配置选项
 * @param {string} options.renderMode - 必选！渲染模式（如 'svg'）
 * @param {string} options.mode - 必选！选择模式（'date'|'dateTime'|'dateRange'|'dateTimeRange'）
 * @param {number} [options.firstDay=0] - 周起始日（0=周日, 1=周一）
 * @param {number} [options.zIndex=9999] - 下拉面板 z-index
 * @throws {Error} 缺少 renderMode 或 mode 或 trigger 无效时抛出
 */
class dtrPicker {

  /**
   * @param {HTMLElement|string} trigger - 触发器元素或选择器
   * @param {Object} [options={}] - 配置选项
   */
  constructor(trigger, options = {}) {
    if (typeof trigger === 'string') {
      trigger = document.querySelector(trigger);
    }
    if (!trigger || !(trigger instanceof HTMLElement)) {
      throw new Error('dtrPicker: trigger must be a valid DOM element or selector');
    }

    // ---- renderMode 必选校验 ----
    if (!options.renderMode) {
      throw new Error('dtrPicker: "renderMode" is required (e.g. "svg")');
    }
    const RendererClass = RENDERERS[options.renderMode];
    if (!RendererClass) {
      throw new Error('dtrPicker: unknown renderMode "' + options.renderMode + '"');
    }

        // ---- mode 必选校验 ----
    const validModes = ['date', 'dateTime', 'dateRange', 'dateTimeRange'];
    if (!options.mode || validModes.indexOf(options.mode) === -1) {
      throw new Error('dtrPicker: "mode" is required (' + validModes.join('|') + ')');
    }

    /** @type {HTMLElement} 触发器 DOM 元素 */
    this.trigger = trigger;
    /** @type {Object} 合并后的完整配置 */
    this.options = Object.assign({}, DEFAULTS, options);

    // ---- 数据状态 ----
    /** @type {PickerState} 数据状态 */
    this.state = new PickerState(this.options);

    // ---- 国际化 ----
    /** @type {Object} 当前语言包 */
    this._i18n = getLocale(this.options.locale);

    // ---- 内部 UI 状态 ----
    /** @type {boolean} 面板是否可见 */
    this.visible = false;

    // ---- 实例唯一标识 ----
    /** @type {string} */
    this._instanceId = 'dp-' + Math.random().toString(36).substring(2, 10);

    // ---- 创建渲染器 ----
    /** @type {SvgRenderer|HtmlRenderer} 渲染器实例 */
    this._renderer = new RendererClass(this);
    this._renderer.createPanel();
    this._renderer.bindEvents();

    // ---- 暴露渲染器属性供 Cell 子类通过 this.picker 访问 ----
    this.svg = this._renderer.svg;
    this.SVG_W = this._renderer.SVG_W;
    this.yearGroup = this._renderer.yearGroup;
    this.headerArea = this._renderer.headerArea;
    this.calendarArea = this._renderer.calendarArea;
    this._hoverDisabled = this._renderer._hoverDisabled;
    this.timeWheel = this._renderer.timeWheel;

    // ---- 生命周期回调 ----
    /** @type {Function[]} 面板打开回调列表 */
    this._onOpenCallbacks = [];
    /** @type {Function[]} 面板关闭回调列表 */
    this._onCloseCallbacks = [];

    this._bindEvents();
  }

  /**
   * 绑定独立于渲染器的全局事件。
   * @private
   */
  _bindEvents() {
    // trigger 点击
    this._onTriggerClick = (e) => {
      e.stopPropagation();
      this.toggle();
    };
    this.trigger.addEventListener('click', this._onTriggerClick);

    // 点击/触摸外部关闭
    this._docClickHandler = (e) => {
      if (!this.visible || this._renderer._dragging) return;
      const target = e.target;
      if (!this._renderer.container.contains(target) && target !== this.trigger) {
        this.close();
      }
    };
    document.addEventListener('click', this._docClickHandler, true);
    document.addEventListener('touchstart', this._docClickHandler, true);

    // Esc 关闭
    this._onDocumentKeyDown = (e) => {
      if (e.key === 'Escape' && this.visible) this.close();
    };
    document.addEventListener('keydown', this._onDocumentKeyDown);

    // 窗口 resize：SVG 渲染器先重算缩放，再重定位
    this._onWindowResize = () => {
      if (!this.visible) return;
      if (typeof this._renderer._applyScale === 'function') {
        this._renderer._applyScale();
      }
      this._positionDropdown();
    };
    window.addEventListener('resize', this._onWindowResize);
  }

  // ════════════════════════════════════════════════════════════════
  //  面板控制
  // ════════════════════════════════════════════════════════════════

  open() {
    if (this.visible) return;
    this.visible = true;
    this.state.translateY = 0;
    this.state._wheelTargetY = 0;
    this._positionDropdown();
    this._renderer.container.style.visibility = 'visible';
    this._renderer.container.style.opacity = '1';
    this._renderer.container.style.transform = 'translateY(0)';
    this.trigger.style.borderColor = this.options.selectedColor;
    this._renderer.renderCalendar();
    if (this._renderer.timeWheel) this._renderer.timeWheel.render();
    this._renderer._syncHeaderColors();
    if (this.state.rangeStart) {
      this._renderer.goToDate(this.state.rangeStart);
    } else {
      this._renderer.goToDate(this.state.today);
    }
    this._onOpenCallbacks.forEach(function (fn) { fn(); });
  }

  close() {
    if (!this.visible) return;
    this.visible = false;
    this._renderer.container.style.visibility = 'hidden';
    this._renderer.container.style.opacity = '0';
    this._renderer.container.style.transform = 'translateY(-8px)';
    this.trigger.style.borderColor = '';
    this._onCloseCallbacks.forEach(function (fn) { fn(); });
  }

  toggle() {
    this.visible ? this.close() : this.open();
  }

  /**
   * 计算并设置下拉面板的绝对定位。
   * @private
   */
  _positionDropdown() {
    const rect = this.trigger.getBoundingClientRect();
    const panelH = this._renderer.SVG_H + 40;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top;
    if (spaceBelow >= panelH || spaceBelow >= spaceAbove) {
      top = rect.bottom + 4;
    } else {
      top = rect.top - panelH - 4;
    }

    // ── 支持 _applyScale 的渲染器（SVG / HTML）：CSS transform 缩放 ──
    if (typeof this._renderer._applyScale === 'function') {
      this._renderer._applyScale();
      const scaledW = this._renderer.SVG_W * this._renderer._scaleFactor;

      // 面板宽度已在各渲染器 _applyScale 中设置完毕，此处只做定位
      let left = rect.left;
      if (left + scaledW > window.innerWidth) {
        left = window.innerWidth - scaledW - 10;
      }
      if (left < 0) left = 4;

      this._renderer.container.style.top = top + 'px';
      this._renderer.container.style.left = left + 'px';
      return;
    }

    // ── 旧版渲染器（降级）：直接约束面板宽度 ──
    const availW = window.innerWidth - 10;
    let renderW = this._renderer.SVG_W;
    let left = rect.left;
    if (renderW > availW) {
      renderW = availW;
      left = 4;
    } else if (left + renderW > window.innerWidth) {
      left = window.innerWidth - renderW - 10;
    }
    if (left < 0) { renderW = availW; left = 4; }

    this._renderer.panel.style.width = renderW + 'px';
    this._renderer.container.style.top = top + 'px';
    this._renderer.container.style.left = left + 'px';
  }

  // ════════════════════════════════════════════════════════════════
  //  公共 API
  // ════════════════════════════════════════════════════════════════

  /**
   * 处理日期点击。
   * @param {Date} d
   * @private
   */
  _handleDateClick(d) {
    const result = this.state.handleDateClick(d);
    if (result.changed) {
      // 选择完成时同步时间并触发回调，选择中仅渲染
      if (result.action === 'confirmed') {
        // 将 state 中可能已更新的时间值（如同天 23:59）同步到 TimeWheel，
        // 防止后续 _fireChange → syncTimeFrom 覆盖掉 state 的更新
        if (this.state.isTimeRange() && this._renderer.timeWheel) {
          this._renderer.timeWheel.startHour = this.state.startHour;
          this._renderer.timeWheel.startMinute = this.state.startMinute;
          this._renderer.timeWheel.endHour = this.state.endHour;
          this._renderer.timeWheel.endMinute = this.state.endMinute;
          this._renderer.timeWheel.render();
        }
        this._fireChange({ source: 'user', action: 'confirmed' });
      }
      this._renderer.renderCalendar();
    }
  }

  /**
   * 触发 change 回调。
   * @param {Object} [meta] - 变更元信息
   * @private
   */
  _fireChange(meta) {
    if (this._renderer.timeWheel) {
      this.state.syncTimeFrom(this._renderer.timeWheel);
    }
    this.state._fireChange(meta);
  }

  /**
   * 获取选中值。
   * @param {'string'|'date'|'object'} [format='string'] - 返回格式
   * @returns {Object|null}
   */
  getValue(format) {
    return this.state.getValue(format);
  }

  setValue(range) {
    if (!range) return;
    this.state.setValue(range, { source: 'programmatic', action: 'confirmed' });
    // 将 state 的时分值同步到 TimeWheel，确保 programmatic setValue 后时轮显示正确
    if (this._renderer.timeWheel && this.state.rangeStart) {
      this._renderer.timeWheel.startHour = this.state.startHour;
      this._renderer.timeWheel.startMinute = this.state.startMinute;
      if (this.state.rangeEnd) {
        this._renderer.timeWheel.endHour = this.state.endHour;
        this._renderer.timeWheel.endMinute = this.state.endMinute;
      }
    }
    this._renderer.renderCalendar();
    if (this._renderer.timeWheel) this._renderer.timeWheel.render();
  }

  clear(silent = false) {
    this.state.clear(true);
    if (this._renderer.timeWheel) this._renderer.timeWheel.clear();
    this._renderer.renderCalendar();
    if (this._renderer.timeWheel) this._renderer.timeWheel.render();
    if (!silent) this._fireChange({ source: 'programmatic', action: 'cleared' });
  }

  onChange(fn) {
    this.state.onChange(fn);
  }

  /**
   * 注册面板打开回调。
   * @param {Function} fn - () => void
   */
  onOpen(fn) {
    if (typeof fn === 'function') this._onOpenCallbacks.push(fn);
  }

  /**
   * 注册面板关闭回调。
   * @param {Function} fn - () => void
   */
  onClose(fn) {
    if (typeof fn === 'function') this._onCloseCallbacks.push(fn);
  }

  destroy() {
    this.close();
    this._renderer.destroy();

    this.trigger.removeEventListener('click', this._onTriggerClick);
    document.removeEventListener('click', this._docClickHandler, true);
    document.removeEventListener('touchstart', this._docClickHandler, true);
    document.removeEventListener('keydown', this._onDocumentKeyDown);
    window.removeEventListener('resize', this._onWindowResize);

    this.trigger.style.borderColor = '';
    this.state._changeCallbacks = [];
  }
}

// ==================== 导出 ====================

dtrPicker.DEFAULTS = DEFAULTS;

export default dtrPicker;
