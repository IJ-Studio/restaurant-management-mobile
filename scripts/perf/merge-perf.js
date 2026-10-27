#!/usr/bin/env node
/**
 * Une varias corridas de Reassure (.perf) en una sola, juntando las mediciones de cada escenario.
 *
 * En CI la línea base (develop) y la rama se miden en rondas alternadas (base, rama, base, rama).
 * Juntar las rondas reduce el ruido del runner: con una sola ronda el mismo código llegó a
 * variar ±10 % entre dos procesos de Jest.
 *
 * Uso: node scripts/perf/merge-perf.js <salida.perf> <ronda1.perf> <ronda2.perf> ...
 */
const fs = require('node:fs');

const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;
const stdev = (values) => {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
};

function readPerf(file) {
  const [header, ...entries] = fs
    .readFileSync(file, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  return { header, entries };
}

function merge(files) {
  const runs = files.map(readPerf);
  const byName = new Map();
  for (const { entries } of runs) {
    for (const entry of entries) {
      const previous = byName.get(entry.name);
      if (!previous) {
        byName.set(entry.name, { ...entry, durations: [...entry.durations], counts: [...entry.counts] });
        continue;
      }
      previous.durations.push(...entry.durations);
      previous.counts.push(...entry.counts);
      previous.warmupDurations = [...(previous.warmupDurations ?? []), ...(entry.warmupDurations ?? [])];
      previous.outlierDurations = [...(previous.outlierDurations ?? []), ...(entry.outlierDurations ?? [])];
      previous.issues = entry.issues ?? previous.issues;
    }
  }
  const merged = [...byName.values()].map((entry) => ({
    ...entry,
    runs: entry.durations.length,
    meanDuration: mean(entry.durations),
    stdevDuration: stdev(entry.durations),
    meanCount: mean(entry.counts),
    stdevCount: stdev(entry.counts),
  }));
  return { header: runs[runs.length - 1].header, entries: merged };
}

if (require.main === module) {
  const [output, ...inputs] = process.argv.slice(2);
  if (!output || inputs.length === 0) {
    console.error('Uso: node scripts/perf/merge-perf.js <salida.perf> <ronda1.perf> [ronda2.perf ...]');
    process.exit(2);
  }
  const { header, entries } = merge(inputs);
  fs.writeFileSync(output, [header, ...entries].map((line) => JSON.stringify(line)).join('\n') + '\n');
  console.log(`${output}: ${entries.length} escenarios, ${inputs.length} rondas unidas`);
}

module.exports = { merge };
