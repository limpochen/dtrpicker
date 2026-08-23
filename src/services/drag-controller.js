/**
 * DragController.js — shared drag event layer
 *
 * Uniformly manages window-level mouse/touch drag events,
 * eliminating duplicate listeners between dtrPicker and TimeWheel.
 *
 * Design principles:
 * - Binds window events only once, on the first session registration
 * - activate(id) determines the currently active session
 * - Only the active session receives onDragMove / onDragEnd
 * - Window listeners are automatically removed once all sessions are unregistered
 *
 * @file       Shared drag event layer
 * @version    2.2.0
 * @license    MIT
 */

class DragController {
  constructor() {
    /** @type {Map<string, { onDragMove: Function, onDragEnd: Function }>} */
    this._sessions = new Map();
    /** @type {string|null} Currently active session id. */
    this._activeSession = null;
    /** @type {boolean} Whether window events are bound. */
    this._bound = false;

    // Bound function references (used for unbinding)
    this._onMouseMove = null;
    this._onMouseUp = null;
    this._onTouchMove = null;
    this._onTouchEnd = null;
    this._onTouchCancel = null;
  }

  /**
   * Register a drag session.
   * @param {string} id - unique session identifier
   * @param {Object} handlers
   * @param {Function} handlers.onDragMove - (clientY) => void
   * @param {Function} handlers.onDragEnd - () => void
   */
  register(id, handlers) {
    if (this._sessions.has(id)) {
      console.warn('DragController: session "' + id + '" already exists, will be overwritten');
    }
    this._sessions.set(id, {
      onDragMove: handlers.onDragMove,
      onDragEnd: handlers.onDragEnd,
    });
    if (!this._bound) this._bind();
  }

  /**
   * Unregister a drag session.
   * Window events are automatically unbound once all sessions are removed.
   * @param {string} id
   */
  unregister(id) {
    this._sessions.delete(id);
    if (this._activeSession === id) this._activeSession = null;
    if (this._sessions.size === 0) this._unbind();
  }

  /**
   * Activate a session so it receives subsequent move/end events.
   * @param {string} id
   */
  activate(id) {
    if (!this._sessions.has(id)) {
      console.warn('DragController: unknown session "' + id + '", activate ignored');
      return;
    }
    this._activeSession = id;
  }

    /** @private */
  _bind() {
    const self = this;

    this._onMouseMove = function (e) {
      if (!self._activeSession) return;
      const s = self._sessions.get(self._activeSession);
      if (s) s.onDragMove(e.clientY);
    };

    this._onMouseUp = function () {
      if (!self._activeSession) return;
      const s = self._sessions.get(self._activeSession);
      if (s) s.onDragEnd();
      self._activeSession = null;
    };

    this._onTouchMove = function (e) {
      if (!self._activeSession) return;
      e.preventDefault(); // Prevent page scrolling while dragging
      const s = self._sessions.get(self._activeSession);
      if (s) s.onDragMove(e.touches[0].clientY);
    };

    this._onTouchEnd = function () {
      if (!self._activeSession) return;
      const s = self._sessions.get(self._activeSession);
      if (s) s.onDragEnd();
      self._activeSession = null;
    };

    this._onTouchCancel = function () {
      if (!self._activeSession) return;
      const s = self._sessions.get(self._activeSession);
      if (s) s.onDragEnd();
      self._activeSession = null;
    };

    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('touchmove', this._onTouchMove, { passive: false });
    window.addEventListener('touchend', this._onTouchEnd);
    window.addEventListener('touchcancel', this._onTouchCancel);
    this._bound = true;
  }

  /** @private */
  _unbind() {
    if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
    if (this._onMouseUp) window.removeEventListener('mouseup', this._onMouseUp);
    if (this._onTouchMove) window.removeEventListener('touchmove', this._onTouchMove);
    if (this._onTouchEnd) window.removeEventListener('touchend', this._onTouchEnd);
    if (this._onTouchCancel) window.removeEventListener('touchcancel', this._onTouchCancel);
    this._onMouseMove = null;
    this._onMouseUp = null;
    this._onTouchMove = null;
    this._onTouchEnd = null;
    this._onTouchCancel = null;
    this._bound = false;
  }

  /** Destroy: clear all sessions and unbind window events. */
  destroy() {
    this._sessions.clear();
    this._activeSession = null;
    this._unbind();
  }
}

export default DragController;
