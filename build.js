const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const root = __dirname;
const outdir = path.join(root, 'dist');
const jsEntry = path.join(root, 'dtrpicker', 'dtrpicker.js');
const cssSource = path.join(root, 'dtrpicker', 'renderers', 'html', 'panel.css');
const cssDest = path.join(outdir, 'panel.css');
const apiSpecSource = path.join(root, 'docs', 'api-spec.md');
const docsDir = path.join(outdir, 'docs');
const apiSpecDest = path.join(docsDir, 'api-spec.md');
const mapFile = path.join(outdir, 'dtrpicker.js.map');

fs.mkdirSync(outdir, { recursive: true });

fs.mkdirSync(docsDir, { recursive: true });
if (fs.existsSync(mapFile)) {
  fs.unlinkSync(mapFile);
}
fs.copyFileSync(cssSource, cssDest);
fs.copyFileSync(apiSpecSource, apiSpecDest);

esbuild.build({
  entryPoints: [jsEntry],
  bundle: true,
  outfile: path.join(outdir, 'dtrpicker.js'),
  format: 'esm',
  platform: 'browser',
  target: ['esnext'],
  sourcemap: false,
  minify: false,
  legalComments: 'none',
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
