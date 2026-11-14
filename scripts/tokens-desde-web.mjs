#!/usr/bin/env node
// Copia los tokens del tema claro de la web (styles/tokens.css) a src/shared/presentation/theme/webTokens.ts.
// Uso: node scripts/tokens-desde-web.mjs ../restaurant-management-web/styles/tokens.css
// La web es la fuente: no editar webTokens.ts a mano; volver a correr esto cuando cambien sus tokens.
import { readFileSync, writeFileSync } from 'node:fs';

const ruta = process.argv[2];
if (!ruta) throw new Error('Falta la ruta a styles/tokens.css de la web');
// eslint-disable-next-line security/detect-non-literal-fs-filename -- herramienta local: lee la ruta que pasa quien la corre
const css = readFileSync(ruta, 'utf8');
const bloque = (selector) => {
  const i = css.indexOf(selector);
  if (i < 0) throw new Error(`No está ${selector} en ${ruta}`);
  return css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i));
};
const leer = (texto, patron) =>
  Object.fromEntries([...texto.matchAll(patron)].map(([, k, v]) => [k, v.trim()]));
const camel = (k) => k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const objeto = (o, f = (v) => `'${v}'`) =>
  Object.entries(o)
    .map(([k, v]) => `  ${camel(k)}: ${f(v)},`)
    .join('\n');

// El tema claro solo redefine colores; los radios salen del bloque base.
const color = leer(bloque(':root[data-tema="claro"]'), /--color-([a-z0-9-]+):\s*([^;]+);/g);
const radio = leer(bloque('@theme {'), /--radius-([a-z0-9-]+):\s*([^;]+);/g);
const velo = bloque(':root[data-tema="claro"]')
  .match(/--velo-dialogo:\s*([^;]+);/)?.[1]
  .trim();
if (!color.acento || !radio.tarjeta || !velo)
  throw new Error('Faltan tokens esperados (acento, radius-tarjeta, velo-dialogo)');

// eslint-disable-next-line security/detect-non-literal-fs-filename -- destino fijo dentro del repo
writeFileSync(
  new URL('../src/shared/presentation/theme/webTokens.ts', import.meta.url),
  `// Generado por scripts/tokens-desde-web.mjs desde styles/tokens.css de la web (tema claro). No editar a mano.
export const webColor = {
${objeto(color)}
} as const;

/** Radios en px (la web los define en px). */
export const webRadius = {
${objeto(radio, (v) => String(parseInt(v, 10)))}
} as const;

/** Velo detrás de un diálogo, tema claro. */
export const webVeloDialogo = '${velo.replace(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/, 'rgba($1, $2, $3, $4)')}';
`,
);
console.log(`webTokens.ts: ${Object.keys(color).length} colores, ${Object.keys(radio).length} radios`);
