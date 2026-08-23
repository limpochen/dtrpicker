# dtrPicker — API Specification

> Version: 2.2.0
> This document defines the public interface of `dtrPicker` as an embeddable component.
> **Core principle**: The component does not care about the trigger's styling, layout, placeholder, or form integration — those are the caller's responsibility.

---

## 1. Installation & Import

### ESM (recommended)

```bash
npm install dtrpicker
```

```js
import dtrPicker from 'dtrpicker';
```

### CommonJS

```js
const dtrPicker = require('dtrpicker').default;
```

### Script tag / CDN (IIFE)

```html
<script src="dist/dtrpicker.iife.js"></script>
<script>
  const picker = new dtrPicker('#my-input', { mode: 'dateRange' });
</script>
```

---

## 2. Options (constructor config)

```js
const picker = new dtrPicker(trigger, options);
```

| Parameter | Type | Default | Required | Description |
| --- | --- | --- | --- | --- |
| `trigger` | `HTMLElement \| string` | — | ✅ | The trigger element or its CSS selector. The component uses it as the panel positioning anchor and click toggle. |
| `options` | `Object` | `{}` | — | The configuration object |
| `options.mode` | `string` | — | ✅ | Selection mode: `'date'` / `'dateTime'` / `'dateRange'` / `'dateTimeRange'` |
| `options.yearMonthMode` | `'watermark' \| 'column'` | `'watermark'` | — | Year/month display mode: `'watermark'` watermark overlay / `'column'` separate column |
| `options.locale` | `string` | `''` | — | BCP 47 language tag: `'zh-CN'` `'en-US'` `'ja-JP'`, etc. Empty string = auto-detect browser language |
| `options.firstDay` | `0 \| 1` | `0` | — | First day of the week: `0` = Sunday, `1` = Monday |
| `options.colorScheme` | `string` | `'morandi'` | — | Color scheme: `'morandi'` (Morandi) / `'nature'` (Nature) |
| `options.todayBarHeight` | `number` | `6` | — | Height of the today marker bar (px) |
| `options.wheelStep` | `number` | `40` | — | Wheel paging step coefficient |

> ⚠️ `mode`, `yearMonthMode`, `locale`, `firstDay`, `colorScheme` **cannot be changed after construction**.

Color options:

| Parameter | Default (morandi) | Description |
| --- | --- | --- |
| `selectedColor` | `'#2f54eb'` | Selected/highlight color |
| `selectedTextColor` | `'#ffffff'` | Selected-state text color |
| `gridColor` | `'#d0d0d0'` | Grid line color |
| `cellColor` | `'#ffffff'` | Cell background color |
| `textColor` | `'#262626'` | Primary text color |
| `textColorDisabled` | `'#d9d9d9'` | Disabled date text color |
| `textColorSubLabel` | `'#595959'` | Secondary label color |
| `textColorWeekend` | `'#f04040'` | Weekend date text color |
| `textColorWeekendTitle` | `'#f08080'` | Weekend header text color |
| `todayBarColor` | `'#8c00ff'` | Today marker bar color |

---

## 3. ValueObject (value object format)

```ts
// no selection
null

// date / dateTime
{ start: "2026-07-01 10:30" }

// dateRange / dateTimeRange
{ start: "2026-07-01 10:30", end: "2026-07-15 14:00" }
```

---

## 4. Public Methods

### picker.open() / picker.close() / picker.toggle()

```js
picker.open();    // Opens the panel. No-op if already open.
picker.close();   // Closes the panel. No-op if already closed.
picker.toggle();  // Toggles the panel open/closed state.
```

### picker.setValue(value)

```js
picker.setValue({ start: "2026-06-01", end: "2026-06-15" });
// or with time
picker.setValue({ start: "2026-06-01 08:30", end: "2026-06-15 17:00" });
```

- `value` is a ValueObject (see §3)
- Automatically validates the format; invalid dates are silently cleared
- Triggers the `onChange` callback (`meta.source = 'programmatic'`)

> ⚠️ **The component does not read the trigger's display text across boundaries.** `setValue()` accepts a ValueObject (`{start, end}`), not the raw string from the trigger input.
> The caller is responsible for parsing the trigger's display value into the correct JSON format before passing it in. Format errors are the caller's responsibility.

### picker.getValue([format])

```js
picker.getValue();
// → { start: "2026-06-01 00:00", end: "2026-06-15 23:59" } | null

picker.getValue('string');
// → same as above (default format)

picker.getValue('date');
// → { start: Date, end: Date | null } | null

picker.getValue('object');
// → { start: { year, month, day, hour, minute }, end: { ... } | null } | null
```

| format | Return type | Description |
| --- | --- | --- |
| `'string'` (default) | `ValueObject \| null` | YYYY-MM-DD HH:mm formatted strings. Single-day modes have no `end` field |
| `'date'` | `{start:Date, end:Date\|null} \| null` | JavaScript Date objects |
| `'object'` | `{start:DateParts, end:DateParts\|null} \| null` | Expanded numeric objects |

`DateParts`:

```ts
{ year: number, month: number, day: number, hour: number, minute: number }
```

### picker.clear([silent])

```js
picker.clear();       // Clears the selected value and triggers onChange(null)
picker.clear(true);   // Silently clears without firing the callback
```

### picker.onChange(callback)

```js
picker.onChange(function(value, meta) {
  // value: ValueObject | null
  // meta: { source: 'user' | 'programmatic', action: 'confirmed' | 'cleared' }
});
```

| meta field | Value | Description |
| --- | --- | --- |
| `source` | `'user'` | Triggered by user clicks/interactions |
| `source` | `'programmatic'` | Triggered by `setValue()` / `clear()` |
| `action` | `'confirmed'` | Selection completed |
| `action` | `'cleared'` | Cleared |

### picker.destroy()

```js
picker.destroy();
```

- Closes the panel, unbinds all event listeners, clears the callback list, and removes the DOM
- The instance cannot be used after calling this

### Lifecycle callbacks

```js
picker.onOpen(function() { /* Panel opened */ });
picker.onClose(function() { /* Panel closed */ });
```

---

## 5. Multiple-Instance Mode (using different modes on a single page)

The component's `mode` is determined at construction and cannot be changed. If a single page needs to use different modes (such as `date` and `dateRange` coexisting, or one instance in Chinese and one in English), create multiple independent instances.

### Multiple triggers, multiple instances

Each instance binds to its own trigger element and works independently:

```js
const pickerA = new dtrPicker('#input-a', { mode: 'date' });
const pickerB = new dtrPicker('#input-b', { mode: 'dateRange' });
```

### Single trigger, multiple instances

A single trigger element can also be associated with multiple instances (for example, switching between different modes at the same position, or mixing Chinese and English):

```js
const trigger = document.querySelector('#my-input');
const instances = [];

['dateTime', 'dateTimeRange'].forEach(function(mode) {
  const p = new dtrPicker(trigger, { mode: mode });
  instances.push(p);
});

function switchInstance(index) {
  instances.forEach(function(p, i) {
    if (i === index) p.open();
    else p.close();
  });
}
```

> When a single trigger is associated with multiple instances, the panels will be positioned overlapping at the same location. It is recommended to open only one instance at a time to avoid visual conflicts.

---

## 6. Quick Start

```js
import dtrPicker from 'path/to/dist/dtrpicker.js';

// 1. Create
const picker = new dtrPicker('#my-input', {
  mode: 'dateRange',
  locale: 'zh-CN',
  firstDay: 1,
  colorScheme: 'nature',
});

// 2. Listen for value changes
picker.onChange((value, meta) => {
  if (value) {
    console.log(`Selected range: ${value.start} ~ ${value.end}`);
  }
});

// 3. Panel open/close notifications
picker.onOpen(() => console.log('Panel opened'));
picker.onClose(() => console.log('Panel closed'));

// 4. Programmatic operations
picker.setValue({ start: '2026-07-01', end: '2026-07-10' });
const val = picker.getValue('date');
console.log(val.start.getFullYear()); // 2026

// 5. Cleanup
picker.destroy();
```
