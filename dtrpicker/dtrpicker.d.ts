/**
 * dtrPicker — 日期范围选择器 TypeScript 类型声明
 *
 * @version 3.0.0
 * @license MIT
 */

/* ================================================================
   值类型
   ================================================================ */

/** 格式化的字符串值（默认） */
export interface ValueObject {
  start: string;
  end?: string;
}

/** Date 对象值 */
export interface DateValue {
  start: Date;
  end?: Date;
}

/** 展开的数字对象值 */
export interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface ObjectValue {
  start: DateParts;
  end?: DateParts;
}

/** 返回值格式 */
export type ValueFormat = 'string' | 'date' | 'object';

/** 变更元信息 */
export interface ChangeMeta {
  /** 变更来源 */
  source: 'user' | 'programmatic';
  /** 变更动作 */
  action: 'selecting' | 'confirmed' | 'cleared';
}

/** onChange 回调 */
export type ChangeCallback = (value: ValueObject | null, meta: ChangeMeta) => void;

export type LifecycleCallback = () => void;

/* ================================================================
   配置选项
   ================================================================ */

export type RenderMode = 'svg' | 'html';

export type PickerMode = 'date' | 'dateTime' | 'dateRange' | 'dateTimeRange';

export interface PickerOptions {
  /** 渲染模式（必选） */
  renderMode: RenderMode;
  /** 选择模式（必选） */
  mode: PickerMode;
  /** BCP 47 语言标签 */
  locale?: string;
  /** 周起始日：0=周日, 1=周一 */
  firstDay?: 0 | 1;
  /** 色系 */
  colorScheme?: string;
  /** 面板 z-index */
  zIndex: number;
  /** 今日标记条高度(px) */
  todayBarHeight?: number;
  /** 滚轮步进(px) */
  wheelStep?: number;
  /** 选中/高亮色 */
  selectedColor?: string;
  /** 网格线色 */
  gridColor?: string;
  /** 格子背景色 */
  cellColor?: string;
  /** 主文字色 */
  textColor?: string;
  /** 禁用文字色 */
  textColorDisabled?: string;
  /** 周末文字色 */
  textColorWeekend?: string;
  /** 选中文字色 */
  selectedTextColor?: string;
  /** 次要标签色 */
  textColorSubLabel?: string;
  /** 周末表头色 */
  textColorWeekendTitle?: string;
  /** 今日标记条色 */
  todayBarColor?: string;
}

/* ================================================================
   dtrPicker 实例
   ================================================================ */

export interface dtrPickerInstance {
  /** 触发器 DOM 元素 */
  readonly trigger: HTMLElement;
  /** 合并后的完整配置 */
  readonly options: PickerOptions;
  /** 面板是否可见 */
  readonly visible: boolean;

  /** 打开面板 */
  open(): void;
  /** 关闭面板 */
  close(): void;
  /** 切换面板 */
  toggle(): void;

  /**
   * 设置选中值。
   * @param range - 值对象（start/end 为 YYYY-MM-DD 或 YYYY-MM-DD HH:mm 格式）
   */
  setValue(range: ValueObject): void;

  /**
   * 获取选中值。
   * @param format - 返回格式
   * @returns 格式化后的值，无选中返回 null
   */
  getValue(format?: ValueFormat): ValueObject | DateValue | ObjectValue | null;

  /**
   * 清除选中值。
   * @param silent - true 则静默清除，不触发回调
   */
  clear(silent?: boolean): void;

  /** 注册值变更回调 */
  onChange(callback: ChangeCallback): void;

  /** 注册面板打开回调 */
  onOpen(callback: LifecycleCallback): void;

  /** 注册面板关闭回调 */
  onClose(callback: LifecycleCallback): void;

  /** 销毁实例，清理所有资源 */
  destroy(): void;
}

/* ================================================================
   构造器
   ================================================================ */

export interface dtrPickerConstructor {
  /**
   * @param trigger - 触发器元素或其 CSS 选择器
   * @param options - 配置选项
   */
  new (trigger: HTMLElement | string, options: PickerOptions): dtrPickerInstance;

  /** 默认配置 */
  readonly DEFAULTS: PickerOptions;
}

declare const dtrPicker: dtrPickerConstructor;

export default dtrPicker;
