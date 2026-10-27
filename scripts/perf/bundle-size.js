#!/usr/bin/env node
/**
 * Mide el tamaño del bundle de Android que genera `npx expo export --platform android`.
 *
 * Uso: node scripts/perf/bundle-size.js <carpeta-dist> <salida.json>
 * - js: bytes del bundle de JavaScript (Hermes .hbc o .js) en _expo/static/js/android.
 * - assets: bytes de imágenes y fuentes. total: todo el export.
 */
const fs = require('node:fs');
const path = require('node:path');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [{ file: full, bytes: fs.statSync(full).size }];
  });
}

function measure(distDir) {
  const files = walk(distDir).map((f) => ({ ...f, file: path.relative(distDir, f.file) }));
  const isJs = (f) => /_expo[\\/]static[\\/]js[\\/]android[\\/].+\.(hbc|js)$/.test(f.file);
  const sum = (list) => list.reduce((total, f) => total + f.bytes, 0);
  const js = files.filter(isJs);
  return {
    js: sum(js),
    assets: sum(files.filter((f) => !isJs(f) && f.file.startsWith('assets'))),
    total: sum(files),
    jsFiles: js.map((f) => ({ file: f.file, bytes: f.bytes })),
  };
}

if (require.main === module) {
  const [distDir, output] = process.argv.slice(2);
  if (!distDir || !output) {
    console.error('Uso: node scripts/perf/bundle-size.js <carpeta-dist> <salida.json>');
    process.exit(2);
  }
  const result = measure(distDir);
  if (result.js === 0) {
    console.error(`No se encontró el bundle de Android en ${distDir}/_expo/static/js/android.`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(`${output}: JS ${result.js} bytes, assets ${result.assets} bytes, total ${result.total} bytes`);
}

module.exports = { measure };
