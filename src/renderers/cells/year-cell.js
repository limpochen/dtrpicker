/**
 * YearCell — year column cell.
 * col=0, merged across rows into a tall rectangle per pure year segment.
 * The year animation (conveyor-belt effect) is encapsulated in startAnim/stopAnim.
 * @extends Cell
 */
import Cell from './cell.js';
import { saturateColor } from '../../utils/color.js';

class YearCell extends Cell {
  /**
   * @param {Object} cfg
   * @param {number} cfg.year - year value
   */
  constructor(cfg) {
    super(cfg);
    this.type = 'year';
    this.year = cfg.year;
    this._hoverEnabled = true;
    /** @type {string|null} Background color for a blended cross-year row (injected by _renderCalendar); opacity is pre-baked. */
    this.bgFill = cfg.bgFill || null;

    // Year animation state
    this._animId = null;
    this._animOldYear = null;
    this._animNewYear = null;
    this._animDir = 0;
    this._animStart = 0;
  }

  render() {
    if (this.year !== 0) {
      this.bgColor = saturateColor(this._cellColor(this.year + 2), 0.08);
    } else if (this.bgFill) {
      this.bgColor = this.bgFill;
    }
    super.render();
    this._createHitRect();
  }

  /**
   * Start the "conveyor-belt" year switching animation.
   * @param {number} oldYear
   * @param {number} newYear
   * @param {number} dir - 1=up (year increases), -1=down
   * @param {number} cx - center X of the year column
   * @param {number} centerY - vertically centered Y
   * @param {number} areaY - top Y of the sidebar content area
   */
  startAnim(oldYear, newYear, dir, cx, centerY, areaY) {
    this.stopAnim();
    this._animOldYear = oldYear;
    this._animNewYear = newYear;
    this._animDir = dir;
    this._animStart = performance.now();

    const DURATION = 300;
    const DISTANCE = centerY - areaY;
    const POWER = 1.3;
    const svgNS = this.g.svgNS;
    const yearGroup = this.picker.yearGroup;
    const self = this;

    function mkText(year, y) {
      const el = document.createElementNS(svgNS, 'text');
      el.setAttribute('x', cx);
      el.setAttribute('y', y);
      el.setAttribute('text-anchor', 'middle');
      el.setAttribute('dominant-baseline', 'middle');
      el.setAttribute('dy', '1.5');
      el.setAttribute('fill', self.picker.options.textColorSubLabel);
      el.setAttribute('font-size', '12');
      el.setAttribute('font-weight', '700');
      el.textContent = String(year);
      return el;
    }

    function frame() {
      const elapsed = performance.now() - self._animStart;
      const t = Math.min(1, elapsed / DURATION);

      while (yearGroup.firstChild) yearGroup.removeChild(yearGroup.firstChild);

      if (t < 1) {
        const oldY = centerY - dir * DISTANCE * Math.pow(t, POWER);
        yearGroup.appendChild(mkText(self._animOldYear, oldY));
      }

      const newY = centerY + dir * DISTANCE * Math.pow(1 - t, POWER);
      yearGroup.appendChild(mkText(self._animNewYear, newY));

      if (t < 1) {
        self._animId = requestAnimationFrame(frame);
      } else {
        while (yearGroup.firstChild) yearGroup.removeChild(yearGroup.firstChild);
        yearGroup.appendChild(mkText(self._animNewYear, centerY));
        self._animId = null;
        self._animOldYear = null;
        self._animNewYear = null;
        self._animDir = 0;
      }
    }

    this._animId = requestAnimationFrame(frame);
  }

  /** Stop the year animation. */
  stopAnim() {
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
      this._animOldYear = null;
      this._animNewYear = null;
      this._animDir = 0;
    }
  }
}

export default YearCell;
