#!/usr/bin/env node
/**
 * Resumen del análisis estático para el Summary de GitHub Actions y para el artefacto.
 *
 * Lee los reportes de reports/static (tsc.txt, prettier.txt, eslint.json, jscpd/jscpd-report.json)
 * y el resultado de cada herramienta en las variables TSC, PRETTIER, ESLINT y JSCPD: el `outcome` del
 * paso en GitHub Actions (success / failure) o el código de salida (0 = aprobado).
 * Escribe reports/static/summary.md y lo imprime.
 *
 * Uso: TSC=success PRETTIER=success ESLINT=failure JSCPD=success node scripts/ci/static-summary.js reports/static
 */
const fs = require('node:fs');
const path = require('node:path');

const dir = process.argv[2] ?? 'reports/static';
const read = (file) =>
  fs.existsSync(path.join(dir, file)) ? fs.readFileSync(path.join(dir, file), 'utf8') : null;
const status = (result) =>
  result === '0' || result === 'success' ? 'Aprobado' : `Reprobado (${result ?? 'sin resultado'})`;

function tsc() {
  const text = read('tsc.txt') ?? '';
  const errors = (text.match(/error TS\d+/g) ?? []).length;
  return `${errors} errores de tipos`;
}

function prettier() {
  const text = read('prettier.txt') ?? '';
  const files = text
    .split('\n')
    .filter((l) => l.startsWith('[warn]') && !l.includes('Code style issues')).length;
  return files === 0 ? 'todos los archivos con formato' : `${files} archivos sin formato`;
}

function eslint() {
  const json = read('eslint.json');
  if (!json) return 'sin reporte';
  const results = JSON.parse(json);
  const sum = (key) => results.reduce((total, r) => total + r[key], 0);
  const rules = {};
  for (const r of results)
    for (const m of r.messages) rules[m.ruleId ?? 'parse'] = (rules[m.ruleId ?? 'parse'] ?? 0) + 1;
  const top = Object.entries(rules)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([rule, n]) => `${rule} (${n})`)
    .join(', ');
  return `${results.length} archivos, ${sum('errorCount')} errores, ${sum('warningCount')} warnings${top ? `; reglas: ${top}` : ''}`;
}

function jscpd() {
  const json = read('jscpd/jscpd-report.json');
  if (!json) return 'sin reporte';
  const { total } = JSON.parse(json).statistics;
  return `${total.clones} clones, ${total.percentage}% de líneas duplicadas (umbral 3 %), ${total.sources} archivos`;
}

const rows = [
  ['TypeScript (tsc --noEmit)', process.env.TSC, tsc(), 'tsc.txt'],
  ['Prettier (--check)', process.env.PRETTIER, prettier(), 'prettier.txt'],
  [
    'ESLint (0 warnings, complejidad cognitiva ≤ 15, security)',
    process.env.ESLINT,
    eslint(),
    'eslint.json, eslint.sarif',
  ],
  ['jscpd (duplicación ≤ 3 %)', process.env.JSCPD, jscpd(), 'jscpd/html/index.html, jscpd/jscpd-report.json'],
];
const lines = [
  '### Análisis estático',
  '',
  '| Herramienta | Resultado | Detalle | Reporte |',
  '|---|---|---|---|',
  ...rows.map(([tool, code, detail, file]) => `| ${tool} | ${status(code)} | ${detail} | ${file} |`),
  '',
  'Reportes completos en el artefacto **static-analysis-report**; los hallazgos de ESLint también en Security → Code scanning.',
];
const md = `${lines.join('\n')}\n`;
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'summary.md'), md);
process.stdout.write(md);
