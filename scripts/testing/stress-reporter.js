/**
 * Reporter de Jest para las pruebas de esfuerzo: une lo que dejó cada archivo en reports/stress/parts
 * con la configuración (carga, ciclos, límites, fallas) y genera stress-report.json y stress-report.md.
 *
 * Reprueba la corrida (getLastError) si una operación rebasa su p95, si el heap crece más del límite
 * o si un escenario de falla no se recupera en los intentos permitidos.
 */
const fs = require('node:fs');
const path = require('node:path');

const CONFIG_FILE = path.join(__dirname, '..', '..', 'src', 'core', 'testing', 'stress', 'config.ts');

/** Lee los objetos `export const X = {...} as const` de config.ts sin compilar TypeScript. */
function readConfig() {
  const source = fs.readFileSync(CONFIG_FILE, 'utf8');
  const config = {};
  for (const match of source.matchAll(/export const (\w+) = (\{[\s\S]*?\n\}) as const;/g)) {
    const objectLiteral = match[2].replace(/\/\*\*[\s\S]*?\*\/|\/\/.*$/gm, '').replace(/(\d)_(\d)/g, '$1$2');
    config[match[1]] = Function(`"use strict"; return (${objectLiteral});`)();
  }
  return config;
}

class StressReporter {
  constructor(_globalConfig, options = {}) {
    this.outputDir = options.outputDir ?? 'reports/stress';
    this.error = undefined;
    this.startedAt = Date.now();
  }

  onRunStart() {
    fs.rmSync(path.join(this.outputDir, 'parts'), { recursive: true, force: true });
    this.startedAt = Date.now();
  }

  onRunComplete(_contexts, results) {
    const partsDir = path.join(this.outputDir, 'parts');
    const parts = fs.existsSync(partsDir)
      ? fs.readdirSync(partsDir).map((f) => JSON.parse(fs.readFileSync(path.join(partsDir, f), 'utf8')))
      : [];
    const report = {
      generado: new Date().toISOString(),
      duracionTotalS: Math.round((Date.now() - this.startedAt) / 100) / 10,
      entorno: {
        node: process.version,
        plataforma: `${process.platform}/${process.arch}`,
        ci: Boolean(process.env.CI),
      },
      configuracion: readConfig(),
      operaciones: parts.flatMap((p) => p.operaciones),
      memoria: parts.flatMap((p) => p.memoria),
      recuperacion: parts.flatMap((p) => p.recuperacion),
      pruebas: {
        total: results.numTotalTests,
        pasaron: results.numPassedTests,
        fallaron: results.numFailedTests,
      },
    };
    const failed = [
      ...report.operaciones
        .filter((o) => !o.aprobado)
        .map((o) => `${o.operacion}: p95 ${o.p95Ms} ms > ${o.limiteP95Ms} ms`),
      ...report.memoria
        .filter((m) => !m.aprobado)
        .map((m) => `${m.operacion}: heap +${m.crecimientoMb} MB > ${m.limiteMb} MB`),
      ...report.recuperacion
        .filter((r) => !r.aprobado)
        .map(
          (r) =>
            `${r.escenario}: ${r.intentos} intentos (límite ${r.limiteIntentos}), datos intactos: ${r.datosIntactos}`,
        ),
    ];
    report.aprobado = failed.length === 0 && results.numFailedTests === 0;

    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(path.join(this.outputDir, 'stress-report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(this.outputDir, 'stress-report.md'), toMarkdown(report));
    if (failed.length > 0) {
      this.error = new Error(`Límites de esfuerzo rebasados:\n- ${failed.join('\n- ')}`);
      process.stderr.write(`\n${this.error.message}\n`);
    }
  }

  getLastError() {
    return this.error;
  }
}

const ok = (value) => (value ? 'Aprobado' : 'Reprobado');

function toMarkdown(r) {
  const { LOAD = {}, CYCLES = {}, FAULTS = {}, LIMITS = {} } = r.configuracion;
  const lines = [
    '## Pruebas de esfuerzo',
    '',
    `Entorno aislado: API falso en memoria, sin red. Node ${r.entorno.node} (${r.entorno.plataforma}). Duración total: ${r.duracionTotalS} s. Pruebas: ${r.pruebas.pasaron}/${r.pruebas.total} en verde.`,
    '',
    '### Carga y ciclos',
    '',
    '| Parámetro | Valor |',
    '|---|---|',
    ...Object.entries(LOAD).map(([k, v]) => `| LOAD.${k} | ${v} |`),
    ...Object.entries(CYCLES).map(([k, v]) => `| CYCLES.${k} | ${v} |`),
    ...Object.entries(FAULTS).map(([k, v]) => `| FAULTS.${k} | ${v} |`),
    `| LIMITS.heapGrowthMb | ${LIMITS.heapGrowthMb} |`,
    `| LIMITS.recoveryAttempts | ${LIMITS.recoveryAttempts} |`,
    '',
    '### Operaciones',
    '',
    '| Operación | Carga | Ciclos | p50 | p95 | Máx | Límite p95 | Resultado |',
    '|---|---|---|---|---|---|---|---|',
    ...r.operaciones.map(
      (o) =>
        `| ${o.operacion} | ${o.carga} | ${o.ciclos} | ${o.p50Ms} ms | ${o.p95Ms} ms | ${o.maxMs} ms | ${o.limiteP95Ms} ms | ${ok(o.aprobado)} |`,
    ),
    '',
    '### Memoria (heap con GC forzado, del primer al último ciclo medido)',
    '',
    '| Operación | Ciclos | Inicial | Final | Crecimiento | Límite | Resultado |',
    '|---|---|---|---|---|---|---|',
    ...r.memoria.map(
      (m) =>
        `| ${m.operacion} | ${m.ciclos} | ${m.heapInicialMb} MB | ${m.heapFinalMb} MB | ${m.crecimientoMb} MB | ${m.limiteMb} MB | ${ok(m.aprobado)} |`,
    ),
    '',
    '### Fallas inyectadas y recuperación',
    '',
    '| Escenario | Falla | Intentos hasta recuperarse | Límite | Datos intactos | Resultado |',
    '|---|---|---|---|---|---|',
    ...r.recuperacion.map(
      (x) =>
        `| ${x.escenario} | ${x.falla} | ${x.intentos} | ${x.limiteIntentos} | ${x.datosIntactos ? 'Sí' : 'No'} | ${ok(x.aprobado)} |`,
    ),
    '',
    r.aprobado ? '**Aprobado:** ningún límite rebasado.' : '**Reprobado:** se rebasó al menos un límite.',
  ];
  return `${lines.join('\n')}\n`;
}

module.exports = StressReporter;
