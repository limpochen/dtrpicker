/**
 * date.js — dtrPicker 日期工具函数
 *
 * 纯日期运算工具集，无 DOM 依赖。
 *
 * @file       日期工具函数
 * @version    1.8.0
 * @license    MIT
 */

/**
 * 判断两个 Date 对象是否代表同一天（仅比较年月日，忽略时分秒）。
 * @param {Date|null} a
 * @param {Date|null} b
 * @returns {boolean}
 */
export function dateEqual(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/**
 * 将 Date 对象转为 YYYY-MM-DD 格式字符串。
 * @param {Date} d
 * @returns {string}
 */
export function dateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 将字符串解析为 Date 对象。
 * 优先解析 YYYY-MM-DD 格式（按本地日期），避免 UTC 时区偏移。
 * @param {string|null} s
 * @returns {Date|null}
 */
export function parseDate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(+m[1], m[2] - 1, +m[3]);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * 获取指定日期所在周的第一天。
 * @param {Date} date
 * @param {boolean} sunFirst - true=周日起始, false=周一起始
 * @returns {Date}
 */
export function getStartOfWeek(date, sunFirst) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = sunFirst ? -day : (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * 按指定模板格式化日期。
 * 占位符：YYYY、MM、DD、HH、mm、ss。
 * @param {Date|null} d
 * @param {string} fmt
 * @returns {string}
 */
export function formatDate(d, fmt) {
  if (!d) return '';
  const map = {
    'YYYY': d.getFullYear(),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0'),
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => map[m]);
}
