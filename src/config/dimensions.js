/**
 * Shared dimension constants for the SVG renderer.
 *
 * Grid layout constants and today-button dimension constants are
 * defined here in one place, avoiding scattered hardcoded values
 * maintained across the rendering logic.
 *
 * @const {Object}
 */
import VERSION from './version.js';

export const DIM = {

  // ══════════════════════════════════════════════════════════════
  //  Grid Layout Constants
  // ══════════════════════════════════════════════════════════════

  /** Cell width (px)
   * Note: when it overflows on mobile, the whole SVG is scaled via CSS transform
   * by SvgRenderer._applyScale(), so a separate mobile CELL_W is not needed. */
  CELL_W: 40,
  /** Cell height (px) */
  CELL_H: 36,
  /** Grid gap (px) */
  GAP: 1,
  /** Number of sidebar columns (year + month) */
  SIDEBAR_COLS: 2,
  /** Start index of date columns (after the sidebar) */
  DATE_COL_START: 2,
  /** Number of date columns (7 days a week) */
  DATE_COLS: 7,
  /** Start index of time columns */
  TIME_COL_START: 9,
  /** Number of time columns (hour + minute) */
  TIME_COLS: 2,
  /** Header row number */
  HEADER_ROW: 0,
  /** Number of visible rows in the calendar area (within the viewport) */
  VISIBLE_DATE_ROWS: 8,
  /** Number of buffer rows above and below (for virtual scrolling) */
  BUFFER_ROWS: 12,

  /** Version number (injected from package.json at build time; falls back to 'dev' in dev mode) */
  VERSION: 'v' + VERSION,
  /** Whether to display the version number in the bottom-left corner of the container */
  SHOW_VERSION: true,

  // ══════════════════════════════════════════════════════════════
  //  Back-to-Today Button Constants
  // ══════════════════════════════════════════════════════════════

  TODAY_BTN: {
    /** Button outer diameter (px) */
    SIZE: 24,
    /** Button margin from the bottom-left corner (px) */
    MARGIN: 16,
    /** Outer ring radius (px) */
    RING_R: 7,
    /** Center dot radius (px) */
    DOT_R: 3,
    /** Outer ring stroke width (px) */
    STROKE_W: 1.5,
    /** Shadow horizontal offset (px, positive shifts right) */
    SHADOW_X: 2,
    /** Shadow vertical offset (px, positive shifts down) */
    SHADOW_Y: 2,
  },
};
