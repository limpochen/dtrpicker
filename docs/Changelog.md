# Changelog

## [2.2.1] - 2026-08-24

### Added

- A version badge now appears on the demo page title, automatically matching the latest published version.
- An online demo is now automatically deployed to GitHub Pages on every update.
- Publishing a new version is now fully automated: tagging the release triggers the build and publish automatically.

### Changed

- The demo page no longer offers a source-code toggle and always uses the development code.

### Maintenance

- Unified the project version to 2.2.1.

## [2.2.0] - 2026-08-23

### Added

- Officially installable via npm.
- Two more import styles alongside ES Module: CommonJS and direct `<script>` (CDN).
- Full TypeScript type declarations.
- MIT license.
- The version badge on the component now stays in sync with the published version automatically.

### Changed

- Smaller bundle size, faster loading.
- Better compatibility with modern mainstream browsers.
- The demo page no longer hardcodes a version number.

### Maintenance

- Unified the project version to 2.2.0.

## [2.1.11] - 2026-08-23

### Fixed

- Fixed the demo page incorrectly showing Simplified Chinese when Traditional Chinese was selected.

### Added

- Added Traditional Chinese, Japanese, and Korean UI languages to the demo page.
- All demo page texts now follow the selected language.

### Maintenance

- Unified the project version to 2.1.11.

## [2.1.10] - 2026-08-21

### Fixed

- Fixed single-date modes where clicking a different date a second time could wrongly enter a range-selection
  state without updating the value; clicking a date now replaces the selection immediately.
- Fixed `YYYY-MM-DD HH:mm` time parsing on Safari, where the time part could be lost.
- Corrected the Thai translation for "hour".

### Maintenance

- Unified the project version to 2.1.10.
- Updated docs and type declarations to match current behavior.
