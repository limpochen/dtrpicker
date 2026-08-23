/**
 * DragController.js — 拖拽事件共享层
 *
 * 统一管理 window 级别的鼠标/触摸拖拽事件，
 * 消除 dtrPicker 和 TimeWheel 之间的重复监听。
 *
 * 设计原则：
 * - 仅在首次注册 session 时绑定一次 window 事件
 * - 通过 activate(id) 决定当前活跃 session
 * - 只有活跃 session 能收到 onDragMove / onDragEnd
 * - 所有 session 注销后自动解除 window 绑定
 *
 * @file       拖拽事件共享层
 * @version    2.1.11
 * @license    MIT
 */

class DragController {
  constructor() {
    /** @type {Map<string, { onDragMove: Function, onDragEnd: Function }>} */
    this._sessions = new Map();
    /** @type {string|null} 当前活跃 session id */
    this._activeSession = null;
    /** @type {boolean} 是否已绑定 window 事件 */
    this._bound = false;

    // 绑定函数引用（用于解除绑定）
    this._onMouseMove = null;
    this._onMouseUp = null;
    this._onTouchMove = null;
    this._onTouchEnd = null;
    this._onTouchCancel = null;
  }

  /**
   * 注册一个拖拽 session。
   * @param {string} id - session 唯一标识
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
   * 注销一个拖拽 session。
   * 全部注销后自动解绑 window 事件。
   * @param {string} id
   */
  unregister(id) {
    this._sessions.delete(id);
    if (this._activeSession === id) this._activeSession = null;
    if (this._sessions.size === 0) this._unbind();
  }

  /**
   * 激活某个 session，使其接收后续 move/end 事件。
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
      e.preventDefault(); // 拖拽中阻止页面滚动
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

  /** 销毁：清空所有 session 并解绑 window 事件 */
  destroy() {
    this._sessions.clear();
    this._activeSession = null;
    this._unbind();
  }
}

export default DragController;
