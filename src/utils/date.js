/**
 * DateTime — dtrPicker 日期核心类
 *
 * 封装日期运算，替代纯函数模块。所有 Date 操作集中管理，
 * 提供只读属性、原地修改方法、查询比较、格式化和静态工厂。
 *
 * @file       日期核心类
 * @version    2.0.0
 * @license    MIT
 */

class DateTime {
  /**
   * 构造 DateTime 实例。
   *
   * 入参兼容多种形式：
   *   - 无参：当前时刻
   *   - Date：包装该 Date 对象
   *   - DateTime：克隆
   *   - 字符串：由 parse 解析（YYYY-MM-DD 优先）
   *   - 多个数字：(year, month, date[, hour[, minute[, second]]])
   *
   * @param {...*} args
   */
  constructor(...args) {
    if (args.length === 0) {
      this._d = new Date();
      return;
    }

    if (args.length === 1) {
      const v = args[0];
      if (v instanceof DateTime) {
        this._d = new Date(v._d);
      } else if (v instanceof Date) {
        this._d = new Date(v);
      } else if (typeof v === 'string') {
        const parsed = DateTime.parse(v);
        this._d = parsed ? new Date(parsed._d) : new Date(v);
      } else {
        this._d = new Date(v);
      }
      return;
    }

    // 多参数：(year, month, date, hour, minute, second)
    const year = args[0];
    const month = args[1];
    const date = args.length > 2 ? args[2] : 1;
    const hour = args.length > 3 ? args[3] : 0;
    const minute = args.length > 4 ? args[4] : 0;
    const second = args.length > 5 ? args[5] : 0;
    this._d = new Date(year, month, date, hour, minute, second);
  }

  // ── 只读属性 ────────────────────────────────────────────────────

  /** @returns {number} 年份（四位） */
  get year() { return this._d.getFullYear(); }

  /** @returns {number} 月份（0-11） */
  get month() { return this._d.getMonth(); }

  /** @returns {number} 日期（1-31） */
  get date() { return this._d.getDate(); }

  /** @returns {number} 小时（0-23） */
  get hour() { return this._d.getHours(); }

  /** @returns {number} 分钟（0-59） */
  get minute() { return this._d.getMinutes(); }

  /** @returns {number} 秒（0-59） */
  get second() { return this._d.getSeconds(); }

  /** @returns {number} 星期几（0=周日, 1=周一, ...） */
  get day() { return this._d.getDay(); }

  /** @returns {number} 时间戳（ms） */
  get timestamp() { return this._d.getTime(); }

  // ── 修改方法（原地修改，返回 this）─────────────────────────────

  /**
   * 设置日期（1-31），跨月自动回滚。
   * @param {number} n
   * @returns {this}
   */
  setDate(n) {
    this._d.setDate(n);
    return this;
  }

  /**
   * 设置月份（0-11）。
   * @param {number} n
   * @returns {this}
   */
  setMonth(n) {
    this._d.setMonth(n);
    return this;
  }

  /**
   * 设置年份。
   * @param {number} y
   * @returns {this}
   */
  setFullYear(y) {
    this._d.setFullYear(y);
    return this;
  }

  /**
   * 设置小时（0-23）。
   * @param {number} n
   * @returns {this}
   */
  setHour(n) {
    this._d.setHours(n);
    return this;
  }

  /**
   * 设置分钟（0-59）。
   * @param {number} n
   * @returns {this}
   */
  setMinute(n) {
    this._d.setMinutes(n);
    return this;
  }

  /**
   * 加减天数（n 可为负）。
   * @param {number} n
   * @returns {this}
   */
  addDays(n) {
    this._d.setDate(this._d.getDate() + n);
    return this;
  }

  // ── 查询方法 ────────────────────────────────────────────────────

  /**
   * 比较两个 DateTime 是否同一天（仅比较年月日）。
   * @param {DateTime|Date|null} other
   * @returns {boolean}
   */
  equals(other) {
    if (!other) return false;
    const o = other instanceof DateTime ? other : new DateTime(other);
    return this.year === o.year && this.month === o.month && this.date === o.date;
  }

  /**
   * 是否早于 other（比较时间戳）。
   * @param {DateTime|Date} other
   * @returns {boolean}
   */
  isBefore(other) {
    const o = other instanceof DateTime ? other : new DateTime(other);
    return this.timestamp < o.timestamp;
  }

  /**
   * 是否晚于 other（比较时间戳）。
   * @param {DateTime|Date} other
   * @returns {boolean}
   */
  isAfter(other) {
    const o = other instanceof DateTime ? other : new DateTime(other);
    return this.timestamp > o.timestamp;
  }

  /**
   * 是否在 a 和 b 之间（不含两端）。
   * @param {DateTime|Date} a
   * @param {DateTime|Date} b
   * @returns {boolean}
   */
  isBetween(a, b) {
    const ta = a instanceof DateTime ? a : new DateTime(a);
    const tb = b instanceof DateTime ? b : new DateTime(b);
    return this.timestamp > ta.timestamp && this.timestamp < tb.timestamp;
  }

  // ── 格式化 ──────────────────────────────────────────────────────

  /**
   * 格式化为 YYYY-MM-DD。
   * @returns {string}
   */
  toDateString() {
    const y = this.year;
    const m = String(this.month + 1).padStart(2, '0');
    const d = String(this.date).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 按指定模板格式化日期。
   * 占位符：YYYY、MM、DD、HH、mm、ss。
   * @param {string} fmt
   * @returns {string}
   */
  format(fmt) {
    const map = {
      YYYY: String(this.year),
      MM: String(this.month + 1).padStart(2, '0'),
      DD: String(this.date).padStart(2, '0'),
      HH: String(this.hour).padStart(2, '0'),
      mm: String(this.minute).padStart(2, '0'),
      ss: String(this.second).padStart(2, '0'),
    };
    return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => map[m]);
  }

  // ── 工具方法 ────────────────────────────────────────────────────

  /**
   * 深拷贝。
   * @returns {DateTime}
   */
  clone() {
    return new DateTime(this);
  }

  /**
   * 获取所在周的第一天。
   * @param {boolean} sunFirst - true=周日起始, false=周一起始
   * @returns {DateTime}
   */
  startOfWeek(sunFirst) {
    const d = new DateTime(this.year, this.month, this.date);
    const day = d.day;
    const diff = sunFirst ? -day : (day === 0 ? -6 : 1 - day);
    d.setDate(d.date + diff);
    return d;
  }

  /**
   * 转换为原生 Date 对象。
   * @returns {Date}
   */
  toNativeDate() {
    return new Date(this._d);
  }

  // ── 静态工厂 ────────────────────────────────────────────────────

  /**
   * 从字符串解析 DateTime。
   * 优先解析 YYYY-MM-DD 格式（按本地日期），避免 UTC 时区偏移。
   * @param {string|null} s
   * @returns {DateTime|null}
   */
  static parse(s) {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return new DateTime(+m[1], +m[2] - 1, +m[3]);
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : new DateTime(d);
  }

  /**
   * 当前时刻。
   * @returns {DateTime}
   */
  static now() {
    return new DateTime();
  }

  /**
   * 今日 00:00。
   * @returns {DateTime}
   */
  static today() {
    const d = new DateTime();
    return new DateTime(d.year, d.month, d.date);
  }
}

export default DateTime;
