/**
 * color.js — dtrPicker 色彩工具函数
 *
 * 纯颜色运算工具集，无 DOM 依赖。
 *
 * @file       色彩工具函数
 * @version    2.1.10
 * @license    MIT
 */

/**
 * 将十六进制颜色转换为 rgba 字符串。
 * @param {string} hex - 十六进制颜色（如 '#2f54eb'）
 * @param {number} alpha - 透明度（0-1）
 * @returns {string} rgba 字符串
 */
export function hexToRgba(hex, alpha) {
  // 注：无非法输入防护，调用方须传合法 #rrggbb（如色板颜色），否则 parseInt 得 NaN
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

/**
 * 按比例混合两个十六进制颜色。
 * @param {string} c1 - 颜色 1（十六进制字符串）
 * @param {string} c2 - 颜色 2
 * @param {number} ratio - c2 的权重（0=纯 c1, 1=纯 c2）
 * @returns {string} 混合后的颜色，格式 #rrggbb
 */
export function blendColors(c1, c2, ratio) {
  // 注：无非法输入防护，调用方须传合法 #rrggbb，否则 parseInt 得 NaN
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * 在 HSL 空间中降低颜色的明度（Lightness），保持色相和饱和度不变。
 * 使侧栏月份列比日期格略暗，视觉上形成层次区分。
 *
 * 使用闭包缓存 memoize 结果：色板颜色数 × factor 种类 ≤ 5×3 = 15 种组合，
 * 首次渲染后全部命中缓存，后续 O(1) 查表返回，避免每帧反复 HSL 变换。
 *
 * @param {string} hex - 颜色值（十六进制字符串）
 * @param {number} factor - 明度降低比例（0=不变, 0.08=降8%）
 * @returns {string} 调暗后的颜色
 */
export const saturateColor = (function () {
  const cache = {};
  return function (hex, factor) {
    const key = hex + '_' + factor;
    if (cache[key]) return cache[key];
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    const clampedFactor = Math.max(0, Math.min(1, factor));
    const newL = Math.max(0, l * (1 - clampedFactor));
    if (s === 0) { r = g = b = newL; }
    else {
      const q = newL < 0.5 ? newL * (1 + s) : newL + s - newL * s;
      const p = 2 * newL - q;
      const hue2rgb = function (t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      r = hue2rgb(h + 1 / 3);
      g = hue2rgb(h);
      b = hue2rgb(h - 1 / 3);
    }
    const toHex = function (v) { return Math.round(v * 255).toString(16).padStart(2, '0'); };
    cache[key] = '#' + toHex(r) + toHex(g) + toHex(b);
    return cache[key];
  };
})();
