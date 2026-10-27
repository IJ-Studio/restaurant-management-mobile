#!/usr/bin/env node
/**
 * Compara el rendimiento de la rama contra la línea base (develop) y aplica los umbrales.
 *
 * Uso:
 *   node scripts/perf/check-performance.js \
 *     --baseline base.perf --current current.perf \
 *     --bundle-baseline bundle-base.json --bundle-current bundle-current.json \
 *     --out reports/performance
 *
 * Genera .reassure/output.json y .reassure/output.md (formato de Reassure) y, en --out,
 * thresholds.json y summary.md con el veredicto. Sale con código 1 si se rebasa un umbral.
 *
 * Umbrales:
 * - Tiempo de render: reprueba si el percentil 10 empeora más de 10 % y la diferencia es de al menos
 *   1 ms (resolución útil de la medición). Se usa p10 y no la media: el ruido del runner solo suma
 *   tiempo, y con el mismo código la media llegó a variar ±17 % entre corridas y el p10 menos de ±5 %.
 * - Número de renders: reprueba si aumenta (promedio redondeado de la rama > el de la base).
 * - Bundle de Android: reprueba si el JavaScript crece más de 5 %.
 */
const fs = require('node:fs');
const path = require('node:path');
const { compare } = require('@callstack/reassure-compare');

const THRESHOLDS = {
  timePercentile: 0.1,
  maxRenderTimeIncrease: 0.1,
  minRenderTimeDiffMs: 1,
  maxRenderCountIncrease: 0,
  maxBundleIncrease: 0.05,
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  return args;
}

/** Percentil q (0–1) por el método del rango más cercano. */
const percentile = (values, q) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
};
const pct = (value) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
const ms = (value) => `${value.toFixed(1)} ms`;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

function checkScenario(entry) {
  const base = percentile(entry.baseline.durations, THRESHOLDS.timePercentile);
  const current = percentile(entry.current.durations, THRESHOLDS.timePercentile);
  const timeChange = current / base - 1;
  const baseCount = Math.round(entry.baseline.meanCount);
  const currentCount = Math.round(entry.current.meanCount);
  const slower =
    timeChange > THRESHOLDS.maxRenderTimeIncrease && current - base >= THRESHOLDS.minRenderTimeDiffMs;
  const moreRenders = currentCount - baseCount > THRESHOLDS.maxRenderCountIncrease;
  return {
    escenario: entry.name,
    p10BaseMs: base,
    p10RamaMs: current,
    cambioTiempo: timeChange,
    mediaBaseMs: entry.baseline.meanDuration,
    mediaRamaMs: entry.current.meanDuration,
    significativoSegunReassure: entry.isDurationDiffSignificant,
    rendersBase: baseCount,
    rendersRama: currentCount,
    muestras: { base: entry.baseline.durations.length, rama: entry.current.durations.length },
    resultado: slower || moreRenders ? 'Reprobado' : 'Aprobado',
    motivo: [slower && 'tiempo de render', moreRenders && 'número de renders'].filter(Boolean).join(' y '),
  };
}

function checkBundle(baseFile, currentFile) {
  if (!baseFile || !currentFile) return null;
  const base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  const current = JSON.parse(fs.readFileSync(currentFile, 'utf8'));
  const change = current.js / base.js - 1;
  return {
    jsBase: base.js,
    jsRama: current.js,
    cambio: change,
    totalBase: base.total,
    totalRama: current.total,
    resultado: change > THRESHOLDS.maxBundleIncrease ? 'Reprobado' : 'Aprobado',
  };
}

function toMarkdown({ escenarios, nuevos, bundle, aprobado }) {
  const lines = [
    '## Pruebas de rendimiento',
    '',
    `Umbrales: tiempo de render (percentil 10) ≤ ${pct(THRESHOLDS.maxRenderTimeIncrease)} o diferencia < ${THRESHOLDS.minRenderTimeDiffMs} ms; número de renders sin aumento; bundle JS ≤ ${pct(THRESHOLDS.maxBundleIncrease)}.`,
    '',
    '| Pantalla / escenario | Base p10 | Rama p10 | Cambio | Media base → rama | Renders base → rama | Muestras | Resultado |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const s of escenarios) {
    const result = s.motivo ? `${s.resultado} (${s.motivo})` : s.resultado;
    lines.push(
      `| ${s.escenario} | ${ms(s.p10BaseMs)} | ${ms(s.p10RamaMs)} | ${pct(s.cambioTiempo)} | ${ms(s.mediaBaseMs)} → ${ms(s.mediaRamaMs)} | ${s.rendersBase} → ${s.rendersRama} | ${s.muestras.base} / ${s.muestras.rama} | ${result} |`,
    );
  }
  for (const name of nuevos) lines.push(`| ${name} | — | nuevo | — | — | — | — | Sin línea base |`);
  if (bundle) {
    lines.push(
      '',
      '| Bundle de Android | Base | Rama | Cambio | Resultado |',
      '|---|---|---|---|---|',
      `| JavaScript (Hermes) | ${kb(bundle.jsBase)} | ${kb(bundle.jsRama)} | ${pct(bundle.cambio)} | ${bundle.resultado} |`,
      `| Export completo | ${kb(bundle.totalBase)} | ${kb(bundle.totalRama)} | ${pct(bundle.totalRama / bundle.totalBase - 1)} | informativo |`,
    );
  }
  lines.push(
    '',
    aprobado ? '**Aprobado:** ningún umbral rebasado.' : '**Reprobado:** se rebasó al menos un umbral.',
  );
  return `${lines.join('\n')}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = args.out ?? 'reports/performance';
  await compare({
    baselineFile: args.baseline,
    currentFile: args.current,
    outputFile: '.reassure/output.json',
    outputFormat: 'all',
  });
  const output = JSON.parse(fs.readFileSync('.reassure/output.json', 'utf8'));

  const compared = new Map();
  for (const entry of [...output.significant, ...output.meaningless, ...output.countChanged]) {
    if (entry.baseline && entry.current) compared.set(entry.name, entry);
  }
  const escenarios = [...compared.values()].map(checkScenario);
  const nuevos = output.added.map((entry) => entry.name);
  const bundle = checkBundle(args['bundle-baseline'], args['bundle-current']);
  const aprobado =
    escenarios.every((s) => s.resultado === 'Aprobado') && (!bundle || bundle.resultado === 'Aprobado');

  const report = { umbrales: THRESHOLDS, escenarios, nuevos, bundle, aprobado, errores: output.errors };
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'thresholds.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(outDir, 'summary.md'), toMarkdown(report));
  console.log(toMarkdown(report));
  if (!aprobado) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
