/**
 * Medición y registro de las pruebas de esfuerzo.
 *
 * Cada archivo *.stress.test.* registra sus operaciones con `measure`, su memoria con `trackHeap`
 * y sus escenarios de falla con `recordRecovery`; al terminar (`writeStressPart`) deja un JSON en
 * reports/stress/parts. El reporter scripts/testing/stress-reporter.js los une en el reporte final.
 */
import fs from 'node:fs';
import path from 'node:path';

export interface OperationResult {
  operacion: string;
  carga: string;
  ciclos: number;
  duracionTotalMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  limiteP95Ms: number;
  aprobado: boolean;
}

export interface HeapResult {
  operacion: string;
  ciclos: number;
  heapInicialMb: number;
  heapFinalMb: number;
  crecimientoMb: number;
  limiteMb: number;
  aprobado: boolean;
}

export interface RecoveryResult {
  escenario: string;
  falla: string;
  intentos: number;
  limiteIntentos: number;
  datosIntactos: boolean;
  aprobado: boolean;
}

const part = {
  operaciones: [] as OperationResult[],
  memoria: [] as HeapResult[],
  recuperacion: [] as RecoveryResult[],
};

const round = (value: number) => Math.round(value * 100) / 100;

export function percentile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
}

interface MeasureOptions {
  carga: string;
  cycles: number;
  limitP95Ms: number;
  /** Ciclos previos que no se miden (carga de módulos, JIT). Por defecto 1. */
  warmup?: number;
  /** Si se indica, registra cuánto creció el heap entre el primer y el último ciclo medido. */
  heapLimitMb?: number;
}

/** Ejecuta `fn` `cycles` veces en serie y registra p50, p95, máximo y, opcionalmente, la memoria. */
export async function measure(
  operacion: string,
  { carga, cycles, limitP95Ms, warmup = 1, heapLimitMb }: MeasureOptions,
  fn: (cycle: number) => Promise<unknown> | unknown,
): Promise<OperationResult> {
  for (let i = 0; i < warmup; i++) await fn(i);
  const heap = heapLimitMb === undefined ? null : trackHeap(operacion, cycles, heapLimitMb);
  const durations: number[] = [];
  const started = performance.now();
  for (let cycle = 0; cycle < cycles; cycle++) {
    const t0 = performance.now();
    await fn(cycle);
    durations.push(performance.now() - t0);
  }
  const totalMs = performance.now() - started;
  heap?.();
  return record(operacion, { carga, limitP95Ms, durations, totalMs });
}

/** Registra duraciones ya medidas (p. ej. las de cada petición de una ráfaga). */
export function record(
  operacion: string,
  {
    carga,
    limitP95Ms,
    durations,
    totalMs,
  }: { carga: string; limitP95Ms: number; durations: number[]; totalMs: number },
): OperationResult {
  const p95 = percentile(durations, 0.95);
  const result = {
    operacion,
    carga,
    ciclos: durations.length,
    duracionTotalMs: round(totalMs),
    p50Ms: round(percentile(durations, 0.5)),
    p95Ms: round(p95),
    maxMs: round(Math.max(...durations)),
    limiteP95Ms: limitP95Ms,
    aprobado: p95 <= limitP95Ms,
  };
  part.operaciones.push(result);
  return result;
}

/** Heap usado en MB, después de forzar el GC si Node se arrancó con --expose-gc. */
export function heapUsedMb(): number {
  (globalThis as { gc?: () => void }).gc?.();
  return process.memoryUsage().heapUsed / 1024 / 1024;
}

/** Devuelve una función que, al llamarse, registra cuánto creció el heap desde ahora. */
export function trackHeap(operacion: string, ciclos: number, limitMb: number): () => HeapResult {
  const initial = heapUsedMb();
  return () => {
    const final = heapUsedMb();
    const result = {
      operacion,
      ciclos,
      heapInicialMb: round(initial),
      heapFinalMb: round(final),
      crecimientoMb: round(final - initial),
      limiteMb: limitMb,
      aprobado: final - initial <= limitMb,
    };
    part.memoria.push(result);
    return result;
  };
}

/** Crecimiento del heap (MB) que se registró para `operacion`. */
export function heapGrowthOf(operacion: string): number {
  return part.memoria.find((m) => m.operacion === operacion)?.crecimientoMb ?? Number.NaN;
}

export function recordRecovery(result: Omit<RecoveryResult, 'aprobado'>): RecoveryResult {
  const full = { ...result, aprobado: result.datosIntactos && result.intentos <= result.limiteIntentos };
  part.recuperacion.push(full);
  return full;
}

/** Guarda lo registrado por este archivo de pruebas en reports/stress/parts/<nombre>.json. */
export function writeStressPart(testFile: string): void {
  const dir = path.join(process.cwd(), 'reports', 'stress', 'parts');
  fs.mkdirSync(dir, { recursive: true });
  const name = path.basename(testFile).replace(/\.stress\.test\.tsx?$/, '');
  fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify({ archivo: name, ...part }, null, 2));
}
