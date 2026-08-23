/**
 * dtrpicker.js — Date range picker core
 *
 * @file       Core script of the date range picker
 * @version    2.1.11
 * @license    MIT
 */

import { getActiveScheme } from './config/colors.js';
import { getLocale } from './config/i18n.js';
import DateTime from './utils/date.js';
import DateTimeValue from './utils/datetime-value.js';
import SvgRenderer from './renderers/svg-renderer.js';

// ==================== Default Configuration ====================

const DEFAULTS = {
  firstDay: 0,
  locale: '',
  colorScheme: 'morandi',
  todayBarHeight: 6,
  wheelStep: 40,
  /** Year/month display mode: 'watermark' overlay watermark | 'column' separate column display */
  yearMonthMode: 'watermark',
};

// ==================== Main Class ====================

/**
 * dtrPicker — Fluent date range / time picker.
 *
 * Only SVG rendering is supported (the HTML+CSS mode was removed as of 2026).
 * The mode of each instance is set at construction time and cannot be changed at runtime.
 * Create multiple instances if you need different modes.
 *
 * @class
 * @param {HTMLElement|string} trigger - Trigger DOM element or CSS selector
 * @param {Object} options - Configuration options
 * @param {string} options.mode - Required! Selection mode ('date'|'dateTime'|'dateRange'|'dateTimeRange')
 * @param {number} [options.firstDay=0] - First day of the week (0=Sunday, 1=Monday)
 * @throws {Error} Thrown when mode is missing or trigger is invalid
 */
class dtrPicker {

  /**
   * @param {HTMLElement|string} trigger - Trigger element or selector
   * @param {Object} [options={}] - Configuration options
   */
  constructor(trigger, options = {}) {
    if (typeof trigger === 'string') {
      trigger = document.querySelector(trigger);
    }
    if (!trigger || !(trigger instanceof HTMLElement)) {
      throw new Error('dtrPicker: trigger must be a valid DOM element or selector');
    }

    // ---- mode is required ----
    const validModes = ['date', 'dateTime', 'dateRange', 'dateTimeRange'];
    if (!options.mode || validModes.indexOf(options.mode) === -1) {
      throw new Error('dtrPicker: "mode" is required (' + validModes.join('|') + ')');
    }

    /** @type {HTMLElement} Trigger DOM element */
    this.trigger = trigger;
    /** @type {Object} Merged full configuration */
    this.options = Object.assign({}, DEFAULTS, options);
    // Inject the color values of the matching scheme based on colorScheme; user-provided colors take precedence
    Object.assign(this.options, getActiveScheme(this.options).defaults, options);

    // ---- Selected value ----
    /** @type {DateTimeValue} */
    this.value = new DateTimeValue(this.options.mode);

    // ---- i18n ----
    /** @type {Object} Current locale pack */
    this._i18n = getLocale(this.options.locale);

    // ---- Internal UI state ----
    /** @type {boolean} Whether the panel is visible */
    this.visible = false;

    // ---- Instance unique id ----
    /** @type {string} */
    this._instanceId = 'dp-' + Math.random().toString(36).substring(2, 10);

    // ---- Change callback list ----
    /** @type {Function[]} */
    this._changeCallbacks = [];

    // ---- Create renderer ----
    /** @type {SvgRenderer} Renderer instance */
    this._renderer = new SvgRenderer(this);
    this._renderer.createPanel();
    this._renderer.bindEvents();

    // ---- Expose renderer properties for Cell subclasses to access via this.picker ----
    this.svg = this._renderer.svg;
    this.SVG_W = this._renderer.SVG_W;
    this.yearGroup = this._renderer.yearGroup;
    this.headerArea = this._renderer.headerArea;
    this.calendarArea = this._renderer.calendarArea;
    this._hoverDisabled = this._renderer._hoverDisabled;
    this.timeWheel = this._renderer.timeWheel;
    this._colorShift = this._renderer._colorShift;

    // ---- Lifecycle callbacks ----
    /** @type {Function[]} Panel open callback list */
    this._onOpenCallbacks = [];
    /** @type {Function[]} Panel close callback list */
    this._onCloseCallbacks = [];

    this._bindEvents();
  }

  /**
   * Bind global events that are independent of the renderer.
   * @private
   */
  _bindEvents() {
    // Trigger click
    this._onTriggerClick = (e) => {
      e.stopPropagation();
      this.toggle();
    };
    this.trigger.addEventListener('click', this._onTriggerClick);

    // Close on click/touch outside
    this._docClickHandler = (e) => {
      if (!this.visible || this._renderer._dragging) return;
      const target = e.target;
      if (!this._renderer.container.contains(target) && target !== this.trigger) {
        this.close();
      }
    };
    document.addEventListener('click', this._docClickHandler, true);
    document.addEventListener('touchstart', this._docClickHandler, true);

    // Esc closes
    this._onDocumentKeyDown = (e) => {
      if (e.key === 'Escape' && this.visible) this.close();
    };
    document.addEventListener('keydown', this._onDocumentKeyDown);

    // Window resize: recompute the scale in the SVG renderer first, then reposition
    this._onWindowResize = () => {
      if (!this.visible) return;
      this._renderer._applyScale();
      this._positionDropdown();
    };
    window.addEventListener('resize', this._onWindowResize);
  }

  // ════════════════════════════════════════════════════════════════
  //  Panel Control
  // ════════════════════════════════════════════════════════════════

  open() {
    if (this.visible) return;
    this.visible = true;
    this._renderer.resetScroll();
    this._positionDropdown();
    this._renderer.container.style.visibility = 'visible';
    this._renderer.container.style.opacity = '1';
    this._renderer.container.style.transform = 'translateY(0)';
    this.trigger.style.borderColor = this.options.selectedColor;
    this._renderer.renderCalendar();
    if (this._renderer.timeWheel) this._renderer.timeWheel.render();
    this._renderer._syncHeaderColors();
    if (this.value.start) {
      this._renderer.goToDate(this.value.start);
    } else {
      this._renderer.goToDate(DateTime.today());
    }
    this._onOpenCallbacks.forEach(function (fn) { fn(); });

    // Close the picker on page scroll (excluding scrolls inside the panel)
    this._onPageScroll = (e) => {
      if (this._renderer.container.contains(e.target)) return;
      this.close();
    };
    document.addEventListener('wheel', this._onPageScroll, { passive: true });
    document.addEventListener('touchmove', this._onPageScroll, { passive: true });
  }

  close() {
    if (!this.visible) return;
    this.visible = false;
    this._renderer.container.style.visibility = 'hidden';
    this._renderer.container.style.opacity = '0';
    this._renderer.container.style.transform = 'translateY(-8px)';
    this.trigger.style.borderColor = '';
    this._onCloseCallbacks.forEach(function (fn) { fn(); });

    // Remove page scroll listeners
    if (this._onPageScroll) {
      document.removeEventListener('wheel', this._onPageScroll);
      document.removeEventListener('touchmove', this._onPageScroll);
      this._onPageScroll = null;
    }
  }

  toggle() {
    this.visible ? this.close() : this.open();
  }

  /**
   * Compute and set the absolute position of the dropdown panel.
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

    // SVG renderer: scale via CSS transform
    this._renderer._applyScale();
    const scaledW = this._renderer.SVG_W * this._renderer._scaleFactor;

    let left = rect.left;
    if (left + scaledW > window.innerWidth) {
      left = window.innerWidth - scaledW - 10;
    }
    if (left < 0) left = 4;

    this._renderer.container.style.top = top + 'px';
    this._renderer.container.style.left = left + 'px';
  }

  // ════════════════════════════════════════════════════════════════
  //  Public API
  // ════════════════════════════════════════════════════════════════

  /**
   * Handle date clicks.
   * @param {Date} d
   * @private
   */
  _handleDateClick(d) {
    const result = this.value.handleDateClick(d);
    if (result.changed) {
      if (result.action === 'confirmed') {
        // Sync the possibly-updated time values in value (e.g. 23:59 on the same day)
        // to the TimeWheel so that the later _fireChange → syncTimeFrom won't override the value update
        if (this.value.isTimeRange && this._renderer.timeWheel) {
          this._renderer.timeWheel.startHour = this.value.start.hour;
          this._renderer.timeWheel.startMinute = this.value.start.minute;
          this._renderer.timeWheel.endHour = this.value.end.hour;
          this._renderer.timeWheel.endMinute = this.value.end.minute;
          this._renderer.timeWheel.render();
        }
        this._fireChange({ source: 'user', action: 'confirmed' });
      }
      this._renderer.renderCalendar();
    }
  }

  /**
   * Fire the change callbacks.
   * @param {Object} [meta] - Change metadata
   * @private
   */
  _fireChange(meta) {
    if (this._renderer.timeWheel) {
      this.value.syncTimeFrom(this._renderer.timeWheel);
    }
    const val = this.value.toJSON();
    meta = meta || { source: 'user', action: 'confirmed' };
    this._changeCallbacks.forEach(function (fn) { fn(val, meta); });
  }

  /**
   * Get the selected value.
   * @param {'string'|'date'|'object'} [format='string'] - Return format
   * @returns {Object|null}
   */
  getValue(format) {
    if (format === 'date') return this.value.toDate();
    if (format === 'object') return this.value.toParts();
    return this.value.toJSON();
  }

  setValue(range) {
    if (!range) return;
    this.value.setFrom(range);
    // Sync the hour/minute values of value to the TimeWheel so the wheel renders correctly after a programmatic setValue
    if (this._renderer.timeWheel && this.value.start) {
      this._renderer.timeWheel.startHour = this.value.start.hour;
      this._renderer.timeWheel.startMinute = this.value.start.minute;
      if (this.value.end) {
        this._renderer.timeWheel.endHour = this.value.end.hour;
        this._renderer.timeWheel.endMinute = this.value.end.minute;
      }
    }
    this._renderer.renderCalendar();
    if (this._renderer.timeWheel) this._renderer.timeWheel.render();
    this._fireChange({ source: 'programmatic', action: 'confirmed' });
  }

  clear(silent = false) {
    this.value.clear();
    if (this._renderer.timeWheel) this._renderer.timeWheel.clear();
    this._renderer.renderCalendar();
    if (this._renderer.timeWheel) this._renderer.timeWheel.render();
    if (!silent) this._fireChange({ source: 'programmatic', action: 'cleared' });
  }

  onChange(fn) {
    if (typeof fn === 'function') this._changeCallbacks.push(fn);
  }

  /**
   * Register a panel open callback.
   * @param {Function} fn - () => void
   */
  onOpen(fn) {
    if (typeof fn === 'function') this._onOpenCallbacks.push(fn);
  }

  /**
   * Register a panel close callback.
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
    this._changeCallbacks = [];
    this._onOpenCallbacks = [];
    this._onCloseCallbacks = [];
  }
}

// ==================== Exports ====================

dtrPicker.DEFAULTS = DEFAULTS;

export default dtrPicker;
