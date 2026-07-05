/**
 * CellManager — 格子管理器。
 * 提供全局注册、批量操作、按行列查找。
 */
class CellManager {
  constructor() {
    /** @type {Cell[]} */
    this._all = [];
  }

  /** 注册一个格子 */
  add(cell) { this._all.push(cell); }

  /** 清空所有格子（自动调用 destroy） */
  clear() {
    this._all.forEach(function (c) { c.destroy(); });
    this._all = [];
  }

  /** 遍历所有格子 */
  each(fn) { this._all.forEach(fn); }

  /** 按条件筛选格子 */
  filter(fn) { return this._all.filter(fn); }

  /** 按行列查找格子 */
  at(r, c) {
    return this._all.find(function (cell) { return cell.r === r && cell.c === c; }) || null;
  }
}

export default CellManager;
