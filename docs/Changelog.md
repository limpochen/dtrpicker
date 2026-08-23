# Changelog

## [2.1.11] - 2026-08-23

### Fixed

- Fixed the demo `getDemoLocale()` matching logic so `zh-TW` correctly resolves to the Traditional Chinese
  locale pack instead of being captured by the `zh-CN` prefix match (exact match now takes priority).
  Involved file: `js/demo.js` → `getDemoLocale()`

### Added

- Added `zh-TW` (Traditional Chinese), `ja-JP` (Japanese), and `ko-KR` (Korean) locale packs for the demo page.
- Brought all demo page UI text into the i18n system: `title` hints, option texts (`Default`, `Auto`,
  `Dev Code`, `Bundle Code`, etc.) now follow the selected demo language.
  Involved files: `js/demo.js`, `index.html`

### Maintenance

- Translated comments/docs to English: `README.md`, `docs/api-spec.md`, `docs/Changelog.md`, `server.js`, `js/demo.js`.
- Moved `.github/` out of version control (added to `.gitignore`, removed from tracking).
- Unified the version number to `2.1.11` across the project (based on `package.json`; synced to the header comments of each source file, `DIM.VERSION`, `index.html`, and `package-lock.json`).

## [2.1.10] - 2026-08-21

### Fixed

- Fixed an issue in single-date modes (`date` / `dateTime`) where clicking a different date a second time
  mistakenly entered the "same-day range → expand" logic, causing the UI to render a date range selection
  while the selected value was not updated.
  Now, in single-date modes, clicking a date immediately replaces the selected date, and `end` is always `null`.
  Involved file: `src/utils/datetime-value.js` → `handleDateClick()`
- Fixed a compatibility concern in `DateTime.parse` where parsing `YYYY-MM-DD HH:mm` time strings relied on
  `new Date(string)`, which fails on Safari and causes the time to be lost. A regex-based parsing branch that
  constructs the date in local time has been added.
  Involved file: `src/utils/date.js` → `static parse()`
- Corrected the Thai (th-TH) translation for "hour": `'น.'` → `'ชม.'` (involved `src/config/i18n.js`).

### Changed

- `header-bar-cell.js`: creating `<stop>` now reuses `this.g.svgNS` (instead of a hardcoded namespace).

### Maintenance

- Updated the header comment in `src/config/dimensions.js` (removed the description of the eliminated HTML+CSS mode).
- Fallback code and dead/redundant code: kept as-is with reminder comments added (see sections 2 and 3 of `docs/一扫问题.md`).
- Minor items handled (see section 5 of `docs/一扫问题.md`):
  - `dtrpicker.destroy()` now also clears `_onOpenCallbacks` / `_onCloseCallbacks`.
  - `color.js`, `time-cell.js`: added reminder comments.
- Unified the version number to `2.1.10` across the project (based on `package.json`; synced to the header comments of each source file, `DIM.VERSION`, `index.html`, and `package-lock.json`).
- Corrected the public docs/declarations to match the code: cleared the outdated `renderMode` / `zIndex` / `selecting` / UMD mentions in `docs/api-spec.md`, `src/dtrpicker.d.ts`, and `README.md`, corrected the `locale` default to auto-detection, and updated the import path and color scheme descriptions.
