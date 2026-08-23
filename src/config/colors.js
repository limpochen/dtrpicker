/**
 * colors.js — Unified color configuration for dtrPicker.
 *
 * ================================================================
 *  Responsibilities
 * ================================================================
 *
 * Centralizes all color values used within the picker. Each scheme
 * has its own complete palette, making them easy to adjust
 * independently later.
 *
 * ================================================================
 *  Palette Structure
 * ================================================================
 *
 * Each scheme consists of two parts:
 *
 *   1. monthColors  — Monthly background color rotation array
 *   2. defaults     — Palette options corresponding to DEFAULTS (role colors)
 *
 *  Color selection formula: monthColors[month % monthColors.length]
 *
 * ================================================================
 *  Notes
 * ================================================================
 *
 * - gridColor: SVG gray background; the 1px gaps reveal the grid lines, not an independent line color.
 * - cellColor: Cell/sidebar background color; the full-width white header background also uses this color.
 * - textColorSubLabel: Used by the year/month headers, sidebar month labels, and the year animation.
 *
 * @file       Unified color configuration
 * @version    2.1.11
 * @license    MIT
 */

// ================================================================
//  Palette Definition
// ================================================================

/**
 * Configuration for all color schemes.
 * Each scheme has its own complete palette, independent of the others,
 * making it easy to adjust them separately.
 * @const {Object<string, Object>}
 */
export const SCHEMES = {

    // ────────────────────────────────────────────────────────────────
    //  Morandi scheme  —  Low saturation, soft, premium gray tone
    // ────────────────────────────────────────────────────────────────
    morandi: {
      /** Display name of the scheme */
      name: 'Morandi',

      /**
       * Monthly background color rotation array.
       * Selection: colors[month % colors.length]; adjacent months are distinguished automatically.
       * @type {string[]}
       */
      colors: [
        '#f9f0ff',   // [0]  Jan/May/Sep   Light purple
        '#e6f7ff',   // [1]  Feb/Jun/Oct   Light blue
        '#f6ffed',   // [2]  Mar/Jul/Nov   Light green
        '#fff7e6',   // [3]  Apr/Aug/Dec   Light orange
      ],

      /**
       * Default palette (corresponds to the palette options in DEFAULTS).
       * All colors used by the picker's core features; overridable via constructor options.
       * @type {Object<string, string>}
       */
      defaults: {
        /** Selected/highlight color — selected cells, today marker, time wheel highlight, target icon, etc. */
        selectedColor: '#2f54eb',
        /** SVG background color — the 1px gap reveals grid lines (not an independent line color) */
        gridColor: '#d0d0d0',
        /** Cell/sidebar background color */
        cellColor: '#ffffff',
        /** Primary date text color */
        textColor: '#262626',
        /** Disabled date text color */
        textColorDisabled: '#d9d9d9',
        /** Weekend date text color (reserved for now, not enabled) */
        textColorWeekend: '#f04040',
        /** Selected/highlight text color (overlaid on selectedColor) */
        selectedTextColor: '#ffffff',
        /** Secondary label color (weekday titles, sidebar months, sidebar years) */
        textColorSubLabel: '#595959',
        /** Weekend header text color */
        textColorWeekendTitle: '#f08080',
        /** Today marker bar color */
        todayBarColor: '#8c00ff',
      },
    },

    // ────────────────────────────────────────────────────────────────
    //  Nature scheme  —  High saturation, vibrant, close to natural flora
    // ────────────────────────────────────────────────────────────────
    nature: {
      /** Display name of the scheme */
      name: 'Nature',

      /**
       * Monthly background color rotation array. Rotates through 5 colors,
       * one more variation than morandi.
       * @type {string[]}
       */
      colors: [
        '#e8f5e9',   // [0]  Jan/Jun/Nov   Light green (foliage)
        '#fff3e0',   // [1]  Feb/Jul/Dec   Light orange (autumn leaves)
        '#e3f2fd',   // [2]  Mar/Aug       Light blue (sky)
        '#fce4ec',   // [3]  Apr/Sep       Light pink (flowers)
        '#f3e5f5',   // [4]  May/Oct       Light purple (lavender)
      ],

      /**
       * Default palette. Same structure as morandi; values currently match
       * morandi and can be adjusted independently.
       * @type {Object<string, string>}
       */
      defaults: {
        selectedColor: '#2f54eb',
        gridColor: '#e6e6e6',
        cellColor: '#ffffff',
        textColor: '#262626',
        textColorDisabled: '#d9d9d9',
        textColorWeekend: '#e08080',
        selectedTextColor: '#ffffff',
        textColorSubLabel: '#595959',
        textColorWeekendTitle: '#e08080',
        todayBarColor: '#8429c0',
      },
    },

    // ────────────────────────────────────────────────────────────────
    //  Ocean scheme  —  Bright and refreshing, sky and sea imagery
    // ────────────────────────────────────────────────────────────────
    ocean: {
      /** Display name of the scheme */
      name: 'Ocean',

      /**
       * Monthly background color rotation array.
       * @type {string[]}
       */
      colors: [
        '#e6f0fa',   // [0]  Light sky blue
        '#e0f2fe',   // [1]  Light sea blue
        '#f0f9ff',   // [2]  Very light blue
        '#e8f4fd',   // [3]  Light cyan blue
      ],

      defaults: {
        selectedColor: '#1a73e8',
        gridColor: '#c8d6e5',
        cellColor: '#ffffff',
        textColor: '#1a2a3a',
        textColorDisabled: '#d0d7de',
        textColorWeekend: '#e8604c',
        selectedTextColor: '#ffffff',
        textColorSubLabel: '#5a6a7a',
        textColorWeekendTitle: '#e8604c',
        todayBarColor: '#0d7377',
      },
    },

    // ────────────────────────────────────────────────────────────────
    //  Forest scheme  —  Natural and serene, lush foliage imagery
    // ────────────────────────────────────────────────────────────────
    forest: {
      /** Display name of the scheme */
      name: 'Forest',

      /**
       * Monthly background color rotation array.
       * @type {string[]}
       */
      colors: [
        '#e8f5e9',   // [0]  Light grass green
        '#f1f8e9',   // [1]  Light sprout green
        '#e0f2f1',   // [2]  Light pine green
        '#f0f4ec',   // [3]  Light moss green
      ],

      defaults: {
        selectedColor: '#2e7d32',
        gridColor: '#c8d6c0',
        cellColor: '#ffffff',
        textColor: '#1a2e1a',
        textColorDisabled: '#d0d8d0',
        textColorWeekend: '#d9534f',
        selectedTextColor: '#ffffff',
        textColorSubLabel: '#4a6a4a',
        textColorWeekendTitle: '#d9534f',
        todayBarColor: '#1b5e20',
      },
    },

    // ────────────────────────────────────────────────────────────────
    //  Starry Night scheme  —  Deep night sky dotted with starlight
    // ────────────────────────────────────────────────────────────────
    night: {
      /** Display name of the scheme */
      name: 'Starry Night',

      /**
       * Monthly background color rotation array.
       * @type {string[]}
       */
      colors: [
        '#1a1a2e',   // [0]  Deep blue-black
        '#16213e',   // [1]  Deep sea blue
        '#1c1c3a',   // [2]  Deep purple-black
        '#0f3460',   // [3]  Deep night blue
      ],

      defaults: {
        selectedColor: '#ffd700',
        gridColor: '#2a2a3e',
        cellColor: '#222238',
        textColor: '#e0e0e8',
        textColorDisabled: '#3a3a4e',
        textColorWeekend: '#ff6b6b',
        selectedTextColor: '#1a1a2e',
        textColorSubLabel: '#a0a0b8',
        textColorWeekendTitle: '#ff6b6b',
        todayBarColor: '#ffd700',
      },
    },
  };

  // ================================================================
  //  Utility Functions
  // ================================================================

  /**
   * Returns the complete configuration object for the specified scheme.
   * @param {string} scheme - Scheme name ('morandi' | 'nature')
   * @returns {Object} The complete palette object of the scheme
   */
  export function getScheme(scheme) {
    // Intentional fallback: invalid/missing schemes fall back to morandi (kept by user request, do not delete)
    return SCHEMES[scheme] || SCHEMES.morandi;
  }

  /**
   * Returns the currently active scheme configuration.
   * @param {Object} options - Configuration options, containing the colorScheme field
   * @returns {Object} The scheme configuration object
   */
  export function getActiveScheme(options) {
    // Intentional fallback: invalid/missing schemes fall back to morandi (kept by user request, do not delete)
    return SCHEMES[options.colorScheme] || SCHEMES.morandi;
  }

  // ================================================================
  //  Hardcoded Render Colors (literal color values referenced directly by JS rendering code)
  // ================================================================

  /**
   * Collection of literal color values required by the JS rendering code.
   * @const {Object<string, string>}
   */
  export const HARDCODED = {
    /** Fill color of the "back to today" button base */
    todayBtnFill: '#ffffff',
    /** Stroke color of the "back to today" button base */
    todayBtnStroke: '#e8e8e8',
  };
