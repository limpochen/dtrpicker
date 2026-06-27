/**
 * YearCell — 年列格子。
 * col=0，按纯年段跨行合并为竖长矩形。
 * 年份动画（传送带效果）封装在 startAnim/stopAnim 中。
 * @extends Cell
 */
import Cell from './cell.js';
import { saturateColor } from '../../utils/color.js';

class YearCell extends Cell {
  /**
   * @param {Object} cfg
   * @param {number} cfg.year - 年份值
   */
  constructor(cfg) {
    super(cfg);
    this.type = 'year';
    this.year = cfg.year;
    this._hoverEnabled = true;
    /** @type {string|null} 跨年混色行的背景色（由 _renderCalendar 传入），不透明度已预制 */
    this.bgFill = cfg.bgFill || null;

    // 年份动画状态
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
   * 启动"传送带"年份切换动画。
   * @param {number} oldYear
   * @param {number} newYear
   * @param {number} dir - 1=向上(年份增大), -1=向下
   * @param {number} cx - 年份列中心 X
   * @param {number} centerY - 垂直居中 Y
   * @param {number} areaY - 侧栏内容区顶部 Y
   */
  startAnim(oldYear, newYear, dir, cx, centerY, areaY) {
    this.stopAnim();
    this._animOldYear = oldYear;
    this._animNewYear = newYear;
    this._animDir = dir;
    this._animStart = performance.now();

    var DURATION = 300;
    var DISTANCE = centerY - areaY;
    var POWER = 1.3;
    var svgNS = this.g.svgNS;
    var yearGroup = this.picker.yearGroup;
    var self = this;

    function mkText(year, y) {
      var el = document.createElementNS(svgNS, 'text');
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
      var elapsed = performance.now() - self._animStart;
      var t = Math.min(1, elapsed / DURATION);

      while (yearGroup.firstChild) yearGroup.removeChild(yearGroup.firstChild);

      if (t < 1) {
        var oldY = centerY - dir * DISTANCE * Math.pow(t, POWER);
        yearGroup.appendChild(mkText(self._animOldYear, oldY));
      }

      var newY = centerY + dir * DISTANCE * Math.pow(1 - t, POWER);
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

  /** 停止年份动画 */
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
