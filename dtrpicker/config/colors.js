/**
 * colors.js — dtrPicker 统一色彩配置
 *
 * ================================================================
 *  职责
 * ================================================================
 *
 * 集中管理选择器内所有颜色值。每个色系（scheme）拥有独立的
 * 完整色板，方便后续分开调整。
 *
 * ================================================================
 *  色板结构
 * ================================================================
 *
 * 每个色系包含两部分：
 *
 *   1. monthColors  — 月份背景色轮换数组
 *   2. defaults     — 对应 DEFAULTS 的色板选项（各角色颜色）
 *
 *  取色公式：monthColors[month % monthColors.length]
 *
 * ================================================================
 *  说明
 * ================================================================
 *
 * - gridColor：SVG 灰色背景，1px 间隙露出即成网格线，并非独立线条色。
 * - cellColor：格子/侧栏背景色，表头全宽白色底也用此色。
 * - textColorSubLabel：被年/月表头、侧栏月份标签、年份动画多路径使用。
 *
 * @file       统一色彩配置
 * @version    1.6.0
 * @license    MIT
 */

// ================================================================
//  色板定义
// ================================================================

/**
 * 所有色系配置。
 * 每个色系独立包含完整色板，互不共享，便于分套调整。
 * @const {Object<string, Object>}
 */
export const SCHEMES = {

    // ────────────────────────────────────────────────────────────────
    //  莫兰迪色系  —  低饱和度、柔和、高级灰质感
    // ────────────────────────────────────────────────────────────────
    morandi: {
      /** 色系显示名称 */
      name: 'Morandi',

      /**
       * 月份背景色轮换数组。
       * 取色：colors[month % colors.length]，相邻月份自动区分。
       * @type {string[]}
       */
      colors: [
        '#f9f0ff',   // [0]  1月/5月/9月   淡紫
        '#e6f7ff',   // [1]  2月/6月/10月  淡蓝
        '#f6ffed',   // [2]  3月/7月/11月  淡绿
        '#fff7e6',   // [3]  4月/8月/12月  淡橙
      ],

      /**
       * 默认色板（对应 DEFAULTS 的色板选项）。
       * 选择器核心功能使用的全部颜色，可通过构造函数 options 覆写。
       * @type {Object<string, string>}
       */
      defaults: {
        /** 选中/高亮色——选中格、今日标记、时间滚轮高亮、靶心图标等 */
        selectedColor: '#2f54eb',
        /** SVG 背景色——1px 间隙露出即成网格线（非独立线条色） */
        gridColor: '#d0d0d0',
        /** 格子/侧栏背景色 */
        cellColor: '#ffffff',
        /** 日期主文字色 */
        textColor: '#262626',
        /** 禁用日期文字色 */
        textColorDisabled: '#d9d9d9',
        /** 周末日期文字色（当前预留，未启用） */
        textColorWeekend: '#f04040',
        /** 选中/高亮文字色（叠在 selectedColor 上） */
        selectedTextColor: '#ffffff',
        /** 次要标签色（星期标题、侧栏月份、侧栏年份） */
        textColorSubLabel: '#595959',
        /** 周末表头文字色 */
        textColorWeekendTitle: '#f08080',
        /** 今日标记条颜色 */
        todayBarColor: '#8c00ff',
      },
    },

    // ────────────────────────────────────────────────────────────────
    //  自然色系  —  高饱和度、鲜活、贴近自然草木
    // ────────────────────────────────────────────────────────────────
    nature: {
      /** 色系显示名称 */
      name: 'Nature',

      /**
       * 月份背景色轮换数组。5 色轮换，比 morandi 多一种变化。
       * @type {string[]}
       */
      colors: [
        '#e8f5e9',   // [0]  1月/6月/11月   浅绿（草木）
        '#fff3e0',   // [1]  2月/7月/12月   浅橙（秋叶）
        '#e3f2fd',   // [2]  3月/8月        浅蓝（天空）
        '#fce4ec',   // [3]  4月/9月        浅粉（花）
        '#f3e5f5',   // [4]  5月/10月       浅紫（薰衣草）
      ],

      /**
       * 默认色板。结构同 morandi，值当前与 morandi 一致，可独立调整。
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
    //  【预留】可在此处添加新色系
    //  如：ocean（海洋）、sunset（日落）、forest（森林）
    // ────────────────────────────────────────────────────────────────
  };

  // ================================================================
  //  工具函数
  // ================================================================

  /**
   * 获取指定色系的完整配置对象。
   * @param {string} scheme - 色系名（'morandi' | 'nature'）
   * @returns {Object} 该色系的完整色板对象
   */
  export function getScheme(scheme) {
    return SCHEMES[scheme] || SCHEMES.morandi;
  }

  /**
   * 获取当前激活的色系配置。
   * @param {Object} options - 配置选项，含 colorScheme 字段
   * @returns {Object} 色系配置对象
   */
  export function getActiveScheme(options) {
    return SCHEMES[options.colorScheme] || SCHEMES.morandi;
  }

  // ================================================================
  //  共享默认色板（供 dtrpicker.js DEFAULTS 引用，不包含颜色字面量）
  // ================================================================

  /**
   * 共享基础默认色板，与 morandi 色系的 defaults 值一致。
   * @const {Object<string, string>}
   */
  export const BASE_DEFAULTS = SCHEMES.morandi.defaults;

  // ================================================================
  //  渲染硬编码色（JS 渲染代码直接引用的字面颜色值）
  // ================================================================

  /**
   * JS 渲染代码中必需的字面颜色值集合。
   * @const {Object<string, string>}
   */
  export const HARDCODED = {
    /** 今日定位按钮底托填充色 */
    todayBtnFill: '#ffffff',
    /** 今日定位按钮底托描边色 */
    todayBtnStroke: '#e8e8e8',
  };
