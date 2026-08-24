# dtrPicker

**English** | [简体中文](docs/README_cn.md)

> A streaming date/time range picker component rendered with SVG, focused on being lightweight, fluid, and customizable.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f)](https://limpochen.github.io/dtrpicker/)
[![npm version](https://img.shields.io/npm/v/dtrpicker)](https://www.npmjs.com/package/dtrpicker)
[![npm downloads](https://img.shields.io/npm/dm/dtrpicker)](https://www.npmjs.com/package/dtrpicker)
[![License: MIT](https://img.shields.io/npm/l/dtrpicker)](https://github.com/limpochen/dtrpicker/blob/main/LICENSE)

<!-- Screenshot: run `node server.js` and open http://localhost:16800/, capture the picker popup, and save it as docs/screenshots/picker.png -->
![Picker popup](docs/screenshots/picker.png)

---

## Features

- **Four selection modes** — `date` / `dateTime` / `dateRange` / `dateTimeRange`
- **SVG rendering** — pixel-perfect control, CSS isolation, no external UI framework required
- **Virtual scrolling** — smooth paging through calendar panels, with wheel and drag browsing
- **Internationalization** — built-in locale packs (Simplified Chinese, English, Japanese, etc.) with BCP 47 language tags
- **Multiple color schemes** — Morandi / Nature / Ocean / Forest / Night, with custom color overrides
- **TypeScript support** — complete type declarations
- **Zero runtime dependencies** — only depends on esbuild at build time

---

## Quick Start

```bash
npm install dtrpicker
```

```js
import dtrPicker from 'dtrpicker';

// 1. Create
const picker = new dtrPicker('#my-input', {
  mode: 'dateRange',
  locale: 'zh-CN',
  firstDay: 1,
  colorScheme: 'nature',
});

// 2. Listen for value changes.
//    NOTE: `value` is an object `{ start, end }` (strings in `YYYY-MM-DD`
//    or `YYYY-MM-DD HH:mm` format), NOT a single string. Use `value.start`
//    / `value.end` to display it.
picker.onChange((value, meta) => {
  if (value) {
    console.log(`Selected range: ${value.start} ~ ${value.end}`);
  }
  console.log('Change source:', meta.source, 'Action:', meta.action);
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

### Direct `<script>` via CDN

No build step needed — drop the IIFE bundle in and use the global `dtrPicker`:

```html
<script src="https://unpkg.com/dtrpicker@2.2.2/dist/dtrpicker.iife.js"></script>
<script>
  const picker = new dtrPicker('#my-input', {
    mode: 'dateRange',
  });
</script>
```

Also available on [jsDelivr](https://cdn.jsdelivr.net/npm/dtrpicker@2.2.2/dist/dtrpicker.iife.js).

---

## Installation & Import

### ESM (recommended)

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

## API Reference

### Constructor & Options

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
| `options.colorScheme` | `string` | `'morandi'` | — | Color scheme: `'morandi'` / `'nature'` / `'ocean'` / `'forest'` / `'night'` |
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

### ValueObject (value object format)

```ts
// no selection
null

// date / dateTime
{ start: "2026-07-01 10:30" }

// dateRange / dateTimeRange
{ start: "2026-07-01 10:30", end: "2026-07-15 14:00" }
```

### Public Methods

#### `open()` / `close()` / `toggle()`

```js
picker.open();    // Opens the panel. No-op if already open.
picker.close();   // Closes the panel. No-op if already closed.
picker.toggle();  // Toggles the panel open/closed state.
```

#### `setValue(value)`

```js
picker.setValue({ start: "2026-06-01", end: "2026-06-15" });
// or with time
picker.setValue({ start: "2026-06-01 08:30", end: "2026-06-15 17:00" });
```

- `value` is a ValueObject (see above)
- Automatically validates the format; invalid dates are silently cleared
- Triggers the `onChange` callback (`meta.source = 'programmatic'`)

> ⚠️ **The component does not read the trigger's display text across boundaries.** `setValue()` accepts a ValueObject (`{start, end}`), not the raw string from the trigger input. The caller is responsible for parsing the trigger's display value into the correct format before passing it in.

#### `getValue([format])`

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

> ⚠️ Despite the `'string'` format name, **`getValue()` returns an object** (`{ start, end }`), not a concatenated string — only its fields are strings. Build the display text yourself, e.g. `${value.start} ~ ${value.end}`.

`DateParts`:

```ts
{ year: number, month: number, day: number, hour: number, minute: number }
```

#### `clear([silent])`

```js
picker.clear();       // Clears the selected value and triggers onChange(null)
picker.clear(true);   // Silently clears without firing the callback
```

#### `onChange(callback)`

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

#### `destroy()`

```js
picker.destroy();
```

- Closes the panel, unbinds all event listeners, clears the callback list, and removes the DOM
- The instance cannot be used after calling this

#### Lifecycle callbacks

```js
picker.onOpen(function() { /* Panel opened */ });
picker.onClose(function() { /* Panel closed */ });
```

### Multiple-Instance Mode

The component's `mode` is determined at construction and cannot be changed. If a single page needs to use different modes (such as `date` and `dateRange` coexisting, or one instance in Chinese and one in English), create multiple independent instances.

#### Multiple triggers, multiple instances

Each instance binds to its own trigger element and works independently:

```js
const pickerA = new dtrPicker('#input-a', { mode: 'date' });
const pickerB = new dtrPicker('#input-b', { mode: 'dateRange' });
```

#### Single trigger, multiple instances

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

## Build

```bash
npm run build
```

The `dist/` directory contains four minified artifacts:

| File | Format | Use |
| --- | --- | --- |
| `dist/dtrpicker.mjs` | ESM | `import` / modern bundlers |
| `dist/dtrpicker.js` | CommonJS | `require()` / legacy tooling |
| `dist/dtrpicker.iife.js` | IIFE | `<script>` / CDN (global `dtrPicker`) |
| `dist/dtrpicker.d.ts` | TypeScript | type declarations |

The runtime version is injected from `package.json` at build time, so the version label
always matches the published version.

---

## Local Demo

```bash
node server.js
# Visit http://localhost:16800/
```

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | JavaScript (ES Module) |
| Rendering | SVG |
| Build | esbuild |
| Typing | TypeScript (type declarations) |
| Runtime | Browser (no Node.js dependency) |

---

## License

[MIT](LICENSE)
