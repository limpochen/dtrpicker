/**
 * dtrPicker — TypeScript type declarations for the date range picker
 *
 * @version 2.1.11
 * @license MIT
 */

/* ================================================================
   Value Types
   ================================================================ */

/** Formatted string value (default) */
export interface ValueObject {
  start: string;
  end?: string;
}

/** Date object value */
export interface DateValue {
  start: Date;
  end?: Date;
}

/** Expanded numeric object value */
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

/** Return value format */
export type ValueFormat = 'string' | 'date' | 'object';

/** Change metadata */
export interface ChangeMeta {
  /** Change source */
  source: 'user' | 'programmatic';
  /** Change action */
  action: 'confirmed' | 'cleared';
}

/** onChange callback */
export type ChangeCallback = (value: ValueObject | null, meta: ChangeMeta) => void;

export type LifecycleCallback = () => void;

/* ================================================================
   Configuration Options
   ================================================================ */

export type PickerMode = 'date' | 'dateTime' | 'dateRange' | 'dateTimeRange';

export interface PickerOptions {
  /** Selection mode (required) */
  mode: PickerMode;
  /** BCP 47 language tag */
  locale?: string;
  /** First day of the week: 0=Sunday, 1=Monday */
  firstDay?: 0 | 1;
  /** Color scheme */
  colorScheme?: string;
  /** Today bar height (px) */
  todayBarHeight?: number;
  /** Wheel step (px) */
  wheelStep?: number;
  /** Selected/highlight color */
  selectedColor?: string;
  /** Grid line color */
  gridColor?: string;
  /** Cell background color */
  cellColor?: string;
  /** Primary text color */
  textColor?: string;
  /** Disabled text color */
  textColorDisabled?: string;
  /** Weekend text color */
  textColorWeekend?: string;
  /** Selected text color */
  selectedTextColor?: string;
  /** Secondary label color */
  textColorSubLabel?: string;
  /** Weekend header color */
  textColorWeekendTitle?: string;
  /** Today bar color */
  todayBarColor?: string;
}

/* ================================================================
   dtrPicker Instance
   ================================================================ */

export interface dtrPickerInstance {
  /** Trigger DOM element */
  readonly trigger: HTMLElement;
  /** Merged full configuration */
  readonly options: PickerOptions;
  /** Whether the panel is visible */
  readonly visible: boolean;

  /** Open the panel */
  open(): void;
  /** Close the panel */
  close(): void;
  /** Toggle the panel */
  toggle(): void;

  /**
   * Set the selected value.
   * @param range - Value object (start/end in YYYY-MM-DD or YYYY-MM-DD HH:mm format)
   */
  setValue(range: ValueObject): void;

  /**
   * Get the selected value.
   * @param format - Return format
   * @returns The formatted value, or null if nothing is selected
   */
  getValue(format?: ValueFormat): ValueObject | DateValue | ObjectValue | null;

  /**
   * Clear the selected value.
   * @param silent - If true, clear silently without firing callbacks
   */
  clear(silent?: boolean): void;

  /** Register a value change callback */
  onChange(callback: ChangeCallback): void;

  /** Register a panel open callback */
  onOpen(callback: LifecycleCallback): void;

  /** Register a panel close callback */
  onClose(callback: LifecycleCallback): void;

  /** Destroy the instance and release all resources */
  destroy(): void;
}

/* ================================================================
   Constructor
   ================================================================ */

export interface dtrPickerConstructor {
  /**
   * @param trigger - Trigger element or its CSS selector
   * @param options - Configuration options
   */
  new (trigger: HTMLElement | string, options: PickerOptions): dtrPickerInstance;

  /** Default configuration */
  readonly DEFAULTS: PickerOptions;
}

declare const dtrPicker: dtrPickerConstructor;

export default dtrPicker;
