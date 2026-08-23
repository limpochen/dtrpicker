/**
 * Runtime version string, injected by esbuild at build time.
 *
 * `build.js` replaces `__DTRPICKER_VERSION__` with the version read from
 * `package.json` (see the `define` option), so the source code and the bundled
 * artifacts always agree on the version. When the source is loaded directly
 * in dev mode (demo "Dev Code"), the define is absent and the value falls back
 * to `'dev'` so the version label keeps working.
 *
 * @type {string}
 */
const VERSION = typeof __DTRPICKER_VERSION__ !== 'undefined' ? __DTRPICKER_VERSION__ : 'dev';

export default VERSION;
