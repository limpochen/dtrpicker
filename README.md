# dtrPicker

**English** | [简体中文](docs/README_cn.md)

> A streaming date/time range picker component rendered with SVG, focused on being lightweight, fluid, and customizable.

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

```js
import dtrPicker from 'dist/dtrpicker.js';

const picker = new dtrPicker('#my-input', {
  mode: 'dateRange',
});

picker.onChange((value, meta) => {
  console.log('Selected value:', value);
  console.log('Change source:', meta.source, 'Action:', meta.action);
});
```

> For the full API reference, see [`docs/api-spec.md`](docs/api-spec.md).

---

## API Overview

### Constructor

```js
const picker = new dtrPicker(trigger, options);
```

| Parameter | Description |
| --- | --- |
| `trigger` | The trigger element or its CSS selector, used as the panel anchor and click toggle |
| `options.mode` | **Required**. `'date'` / `'dateTime'` / `'dateRange'` / `'dateTimeRange'` |
| `options.locale` | BCP 47 language tag (`'zh-CN'` / `'en-US'` / `'ja-JP'`); an empty string auto-detects the browser language |
| `options.firstDay` | First day of the week: `0` = Sunday, `1` = Monday |
| `options.colorScheme` | Color scheme: `'morandi'` / `'nature'` / `'ocean'` / `'forest'` / `'night'` |
| Color options | `selectedColor`, `gridColor`, `textColor`, etc., each can be overridden |

### Methods

| Method | Description |
| --- | --- |
| `open()` / `close()` / `toggle()` | Open / close / toggle the panel |
| `setValue(value)` | Programmatically set the selected value (`{start, end}`) |
| `getValue([format])` | Read the value: `'string'` (default) / `'date'` / `'object'` |
| `clear([silent])` | Clear the selected value; callbacks are not fired when `silent=true` |
| `onChange(cb)` | Listen for value changes, callback `(value, meta)` |
| `onOpen(cb)` / `onClose(cb)` | Panel lifecycle callbacks |
| `destroy()` | Destroy the instance and clean up the DOM |

### Multiple Instances

`mode` cannot be changed after construction. When you need different modes / languages on the same page, simply create multiple instances; multiple instances bound to the same trigger are supported.

---

## Build

```bash
npm run build
```

The output goes to the `dist/` directory.

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

MIT
