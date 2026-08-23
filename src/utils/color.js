/**
 * color.js — color utility functions for dtrPicker
 *
 * A pure color computation utility set with no DOM dependencies.
 *
 * @file       Color utility functions
 * @version    2.2.0
 * @license    MIT
 */

/**
 * Convert a hex color to an rgba string.
 * @param {string} hex - Hex color (e.g. '#2f54eb')
 * @param {number} alpha - Alpha (opacity) value (0-1)
 * @returns {string} rgba string
 */
export function hexToRgba(hex, alpha) {
  // Note: no invalid input guard; the caller must pass a valid #rrggbb (e.g. palette colors), otherwise parseInt yields NaN
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

/**
 * Blend two hex colors by a given ratio.
 * @param {string} c1 - Color 1 (hex string)
 * @param {string} c2 - Color 2
 * @param {number} ratio - Weight of c2 (0=pure c1, 1=pure c2)
 * @returns {string} The blended color, in #rrggbb format
 */
export function blendColors(c1, c2, ratio) {
  // Note: no invalid input guard; the caller must pass a valid #rrggbb, otherwise parseInt yields NaN
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
 * Reduce a color's lightness in the HSL color space while keeping hue and saturation unchanged.
 * Makes the sidebar month column slightly darker than the date cells to create visual hierarchy.
 *
 * Memoizes results in a closure cache: palette color count × factor types ≤ 5×3 = 15 combinations.
 * After the first render all lookups hit the cache and return in O(1), avoiding repeated
 * HSL conversions on every frame.
 *
 * @param {string} hex - Color value (hex string)
 * @param {number} factor - Lightness reduction ratio (0=unchanged, 0.08=reduce by 8%)
 * @returns {string} The darkened color
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
