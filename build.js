const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const root = __dirname;
const outdir = path.join(root, 'dist');
const jsEntry = path.join(root, 'src', 'dtrpicker.js');
const dtsSource = path.join(root, 'src', 'dtrpicker.d.ts');
const pkg = require(path.join(root, 'package.json'));

/**
 * Shared esbuild options for every output format.
 * - target: es2020 keeps optional chaining / nullish coalescing but drops newer
 *   syntax for wider browser support.
 * - minify: production bundle.
 * - define: injects the runtime version (consumed by src/config/version.js)
 *   and NODE_ENV.
 */
const COMMON = {
  entryPoints: [jsEntry],
  bundle: true,
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  define: {
    'process.env.NODE_ENV': '"production"',
    __DTRPICKER_VERSION__: JSON.stringify(pkg.version),
  },
};

/**
 * IIFE convenience footer: esbuild's globalName is the module namespace, so the
 * default export lives at `dtrPicker.default`. This re-exposes it directly as
 * `window.dtrPicker` so `<script>` users can write `new dtrPicker(...)`.
 */
const IIFE_FOOTER = 'if (typeof window !== "undefined" && window.dtrPicker && window.dtrPicker.default) window.dtrPicker = window.dtrPicker.default;';

async function build() {
  // Start from a clean output directory so stale artifacts never leak through.
  fs.rmSync(outdir, { recursive: true, force: true });
  fs.mkdirSync(outdir, { recursive: true });

  // ESM bundle (modern bundlers / `import`).
  await esbuild.build({ ...COMMON, format: 'esm', outfile: path.join(outdir, 'dtrpicker.mjs') });

  // CommonJS bundle (legacy tooling / `require`).
  await esbuild.build({ ...COMMON, format: 'cjs', outfile: path.join(outdir, 'dtrpicker.js') });

  // IIFE bundle (direct `<script>` / CDN usage), global `dtrPicker`.
  await esbuild.build({
    ...COMMON,
    format: 'iife',
    outfile: path.join(outdir, 'dtrpicker.iife.js'),
    globalName: 'dtrPicker',
    footer: { js: IIFE_FOOTER },
  });

  // Copy the TypeScript declarations alongside the bundles.
  fs.copyFileSync(dtsSource, path.join(outdir, 'dtrpicker.d.ts'));

  const files = ['dtrpicker.mjs', 'dtrpicker.js', 'dtrpicker.iife.js', 'dtrpicker.d.ts'];
  const sizes = files
    .map((f) => `  ${f}  ${(fs.statSync(path.join(outdir, f)).size / 1024).toFixed(1)} KiB`)
    .join('\n');
  console.log(`build v${pkg.version} OK\n${sizes}`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
