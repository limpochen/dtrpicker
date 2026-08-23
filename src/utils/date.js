/**
 * DateTime — the core date class of dtrPicker
 *
 * Encapsulates date arithmetic, replacing the pure-function module. All Date operations are
 * managed centrally, providing read-only properties, in-place mutation methods, query
 * comparison, formatting, and static factories.
 *
 * @file       Date core class
 * @version    2.2.0
 * @license    MIT
 */

class DateTime {
  /**
   * Construct a DateTime instance.
   *
   * The arguments are compatible with several forms:
   *   - no args: the current moment
   *   - Date: wraps the given Date object
   *   - DateTime: clone
   *   - string: parsed by parse (YYYY-MM-DD takes precedence)
   *   - multiple numbers: (year, month, date[, hour[, minute[, second]]])
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
        // Intentional fallback: parse only recognizes the standard format, so fall back to
        // new Date(v) to stay compatible with other formats the engine can parse (lenient parsing, kept)
        const parsed = DateTime.parse(v);
        this._d = parsed ? new Date(parsed._d) : new Date(v);
      } else {
        this._d = new Date(v);
      }
      return;
    }

    // Multiple args: (year, month, date, hour, minute, second)
    const year = args[0];
    const month = args[1];
    const date = args.length > 2 ? args[2] : 1;
    const hour = args.length > 3 ? args[3] : 0;
    const minute = args.length > 4 ? args[4] : 0;
    const second = args.length > 5 ? args[5] : 0;
    this._d = new Date(year, month, date, hour, minute, second);
  }

  // ── Read-only properties ────────────────────────────────────────

  /** @returns {number} Year (4 digits) */
  get year() { return this._d.getFullYear(); }

  /** @returns {number} Month (0-11) */
  get month() { return this._d.getMonth(); }

  /** @returns {number} Day of month (1-31) */
  get date() { return this._d.getDate(); }

  /** @returns {number} Hour (0-23) */
  get hour() { return this._d.getHours(); }

  /** @returns {number} Minute (0-59) */
  get minute() { return this._d.getMinutes(); }

  /** @returns {number} Second (0-59) */
  get second() { return this._d.getSeconds(); }

  /** @returns {number} Day of week (0=Sunday, 1=Monday, ...) */
  get day() { return this._d.getDay(); }

  /** @returns {number} Timestamp (ms) */
  get timestamp() { return this._d.getTime(); }

  // ── Mutation methods (in-place, return this) ──────────────────

  /**
   * Set the day of month (1-31); rolls over automatically across months.
   * @param {number} n
   * @returns {this}
   */
  setDate(n) {
    this._d.setDate(n);
    return this;
  }

  /**
   * Set the month (0-11).
   * @param {number} n
   * @returns {this}
   */
  setMonth(n) {
    this._d.setMonth(n);
    return this;
  }

  /**
   * Set the year.
   * @param {number} y
   * @returns {this}
   */
  setFullYear(y) {
    this._d.setFullYear(y);
    return this;
  }

  /**
   * Set the hour (0-23).
   * @param {number} n
   * @returns {this}
   */
  setHour(n) {
    this._d.setHours(n);
    return this;
  }

  /**
   * Set the minute (0-59).
   * @param {number} n
   * @returns {this}
   */
  setMinute(n) {
    this._d.setMinutes(n);
    return this;
  }

  /**
   * Add (or subtract, if n is negative) days.
   * @param {number} n
   * @returns {this}
   */
  addDays(n) {
    this._d.setDate(this._d.getDate() + n);
    return this;
  }

  // ── Query methods ──────────────────────────────────────────────

  /**
   * Compare whether two DateTime instances represent the same day (year/month/day only).
   * @param {DateTime|Date|null} other
   * @returns {boolean}
   */
  equals(other) {
    if (!other) return false;
    const o = other instanceof DateTime ? other : new DateTime(other);
    return this.year === o.year && this.month === o.month && this.date === o.date;
  }

  /**
   * Whether this is before other (compares timestamps).
   * @param {DateTime|Date} other
   * @returns {boolean}
   */
  isBefore(other) {
    const o = other instanceof DateTime ? other : new DateTime(other);
    return this.timestamp < o.timestamp;
  }

  /**
   * Whether this is after other (compares timestamps).
   * @param {DateTime|Date} other
   * @returns {boolean}
   */
  isAfter(other) {
    const o = other instanceof DateTime ? other : new DateTime(other);
    return this.timestamp > o.timestamp;
  }

  /**
   * Whether this is strictly between a and b (exclusive of both endpoints).
   * @param {DateTime|Date} a
   * @param {DateTime|Date} b
   * @returns {boolean}
   */
  isBetween(a, b) {
    const ta = a instanceof DateTime ? a : new DateTime(a);
    const tb = b instanceof DateTime ? b : new DateTime(b);
    return this.timestamp > ta.timestamp && this.timestamp < tb.timestamp;
  }

  // ── Formatting ─────────────────────────────────────────────────

  /**
   * Format as YYYY-MM-DD.
   * @returns {string}
   */
  toDateString() {
    const y = this.year;
    const m = String(this.month + 1).padStart(2, '0');
    const d = String(this.date).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Format the date according to the given template.
   * Placeholders: YYYY, MM, DD, HH, mm, ss.
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

  // ── Utility methods ────────────────────────────────────────────

  /**
   * Deep copy.
   * @returns {DateTime}
   */
  clone() {
    return new DateTime(this);
  }

  /**
   * Get the first day of the week containing this date.
   * @param {boolean} sunFirst - true=week starts on Sunday, false=week starts on Monday
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
   * Convert to a native Date object.
   * @returns {Date}
   */
  toNativeDate() {
    return new Date(this._d);
  }

  // ── Static factories ───────────────────────────────────────────

  /**
   * Parse a DateTime from a string.
   * Supports YYYY-MM-DD and YYYY-MM-DD HH:mm[:ss], both constructed in local time,
   * to avoid UTC timezone offset issues and Safari's failure to parse time strings
   * containing spaces.
   * @param {string|null} s
   * @returns {DateTime|null}
   */
  static parse(s) {
    if (!s) return null;
    // YYYY-MM-DD (in local time)
    let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return new DateTime(+m[1], +m[2] - 1, +m[3]);
    // YYYY-MM-DD HH:mm[:ss] (in local time; avoids Safari parsing differences)
    m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s);
    if (m) return new DateTime(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0);
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : new DateTime(d);
  }

  /**
   * The current moment.
   * @returns {DateTime}
   */
  static now() {
    return new DateTime();
  }

  /**
   * Today at 00:00.
   * @returns {DateTime}
   */
  static today() {
    const d = new DateTime();
    return new DateTime(d.year, d.month, d.date);
  }
}

export default DateTime;
