/**
 * CellManager — cell manager.
 * Provides global registration, batch operations, and lookup by row/column.
 */
class CellManager {
  constructor() {
    /** @type {Cell[]} */
    this._all = [];
  }

  /** Register a cell. */
  add(cell) { this._all.push(cell); }

  /** Clear all cells (automatically calls destroy). */
  clear() {
    this._all.forEach(function (c) { c.destroy(); });
    this._all = [];
  }

  /** Iterate over all cells. */
  each(fn) { this._all.forEach(fn); }

  /** Filter cells by a predicate. */
  filter(fn) { return this._all.filter(fn); }

  /** Find a cell by row and column. */
  at(r, c) {
    return this._all.find(function (cell) { return cell.r === r && cell.c === c; }) || null;
  }
}

export default CellManager;
