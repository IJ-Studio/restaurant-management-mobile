/**
 * Reporter de Jest para las pruebas de aceptación: genera la matriz de trazabilidad
 * (historia → criterio → prueba → resultado) en Markdown y JSON.
 *
 * - El ID del criterio se toma del inicio del nombre de cada prueba: "HU-01 CA-1: ...".
 * - Los criterios salen de acceptance-criteria.json (texto de cada issue).
 * - Reprueba la corrida (getLastError) si una prueba no lleva ID válido o si un criterio no tiene
 *   ninguna prueba. Si una prueba falla, Jest ya termina con error por su cuenta.
 */
const fs = require('node:fs');
const path = require('node:path');

const ID = /^(HU-\d{2}) (CA-\d+):\s*(.+)$/;
const RESULT = { passed: 'Pasó', failed: 'Falló', pending: 'Omitida', skipped: 'Omitida', todo: 'Pendiente' };

class AcceptanceReporter {
  constructor(_globalConfig, options = {}) {
    this.outputDir = options.outputDir ?? 'reports/acceptance';
    this.criteriaFile = options.criteriaFile ?? path.join(__dirname, 'acceptance-criteria.json');
    this.error = undefined;
  }

  onRunComplete(_contexts, results) {
    const { historias } = JSON.parse(fs.readFileSync(this.criteriaFile, 'utf8'));
    const tests = results.testResults.flatMap((file) =>
      file.testResults.map((t) => ({
        title: t.title,
        status: t.status,
        file: path.relative(process.cwd(), file.testFilePath),
      })),
    );

    const withoutId = tests.filter((t) => !ID.test(t.title));
    const rows = [];
    const uncovered = [];
    for (const hu of historias) {
      for (const ca of hu.criterios) {
        const matching = tests.filter((t) => t.title.startsWith(`${hu.id} ${ca.id}:`));
        if (matching.length === 0) uncovered.push(`${hu.id} ${ca.id}`);
        const base = {
          hu: hu.id,
          issue: hu.issue,
          historia: hu.titulo,
          criterio: ca.id,
          texto: ca.texto,
          nota: ca.nota,
        };
        if (matching.length === 0) rows.push({ ...base, prueba: '—', resultado: 'Sin prueba' });
        for (const t of matching)
          rows.push({
            ...base,
            prueba: ID.exec(t.title)[3],
            archivo: t.file,
            resultado: RESULT[t.status] ?? t.status,
          });
      }
    }

    const summary = historias.map((hu) => {
      const own = rows.filter((r) => r.hu === hu.id);
      const count = (label) => own.filter((r) => r.resultado === label).length;
      return {
        hu: hu.id,
        historia: hu.titulo,
        pruebas: own.length,
        pasaron: count('Pasó'),
        fallaron: count('Falló'),
        pendientes: count('Pendiente'),
      };
    });

    fs.mkdirSync(this.outputDir, { recursive: true });
    const report = {
      generado: new Date().toISOString(),
      resumen: summary,
      trazabilidad: rows,
      sinCriterio: withoutId,
      criteriosSinPrueba: uncovered,
    };
    fs.writeFileSync(path.join(this.outputDir, 'traceability.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(this.outputDir, 'traceability.md'), toMarkdown(report));

    const problems = [
      ...withoutId.map((t) => `La prueba "${t.title}" no empieza con un ID "HU-0X CA-N:".`),
      ...uncovered.map((id) => `El criterio ${id} no tiene ninguna prueba de aceptación.`),
    ];
    if (problems.length > 0) {
      this.error = new Error(`Trazabilidad incompleta:\n- ${problems.join('\n- ')}`);
      process.stderr.write(`\n${this.error.message}\n`);
    }
  }

  getLastError() {
    return this.error;
  }
}

function toMarkdown({ resumen, trazabilidad, sinCriterio, criteriosSinPrueba }) {
  const lines = [
    '## Pruebas de aceptación',
    '',
    '| HU | Historia | Pruebas | Pasaron | Fallaron | Pendientes |',
    '|---|---|---|---|---|---|',
  ];
  for (const s of resumen)
    lines.push(`| ${s.hu} | ${s.historia} | ${s.pruebas} | ${s.pasaron} | ${s.fallaron} | ${s.pendientes} |`);
  lines.push(
    '',
    '### Matriz de trazabilidad',
    '',
    '| HU | Criterio | Prueba | Resultado |',
    '|---|---|---|---|',
  );
  for (const r of trazabilidad) {
    const criterio = `${r.criterio}: ${r.texto}${r.nota ? ` _(${r.nota})_` : ''}`;
    lines.push(`| ${r.hu} (#${r.issue}) | ${criterio} | ${r.prueba} | ${r.resultado} |`);
  }
  if (sinCriterio.length || criteriosSinPrueba.length) {
    lines.push('', '### Problemas de trazabilidad', '');
    for (const t of sinCriterio) lines.push(`- Prueba sin ID de criterio: ${t.title}`);
    for (const id of criteriosSinPrueba) lines.push(`- Criterio sin prueba: ${id}`);
  }
  return `${lines.join('\n')}\n`;
}

module.exports = AcceptanceReporter;
