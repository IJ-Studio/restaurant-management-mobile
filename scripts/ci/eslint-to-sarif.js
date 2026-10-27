#!/usr/bin/env node
/**
 * Convierte el reporte JSON de ESLint (`eslint -f json`) a SARIF 2.1.0 para subirlo a GitHub Code
 * scanning con github/codeql-action/upload-sarif. Sin dependencias: el formatter oficial de SARIF
 * todavía depende de ESLint 8 y el repo usa ESLint 9.
 *
 * Uso: node scripts/ci/eslint-to-sarif.js <eslint.json> <eslint.sarif>
 */
const fs = require('node:fs');
const path = require('node:path');

const LEVEL = { 1: 'warning', 2: 'error' };

function toSarif(eslintResults, rootDir) {
  const rules = new Map();
  const results = [];
  for (const file of eslintResults) {
    const uri = path.relative(rootDir, file.filePath).split(path.sep).join('/');
    for (const m of file.messages) {
      const ruleId = m.ruleId ?? 'eslint/parse-error';
      if (!rules.has(ruleId)) {
        rules.set(ruleId, {
          id: ruleId,
          shortDescription: { text: ruleId },
          helpUri: m.ruleId?.includes('/')
            ? undefined
            : m.ruleId
              ? `https://eslint.org/docs/latest/rules/${m.ruleId}`
              : undefined,
        });
      }
      results.push({
        ruleId,
        level: LEVEL[m.severity] ?? 'note',
        message: { text: m.message },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri, uriBaseId: '%SRCROOT%' },
              region: {
                startLine: m.line ?? 1,
                startColumn: m.column ?? 1,
                endLine: m.endLine ?? m.line ?? 1,
                endColumn: m.endColumn ?? m.column ?? 1,
              },
            },
          },
        ],
      });
    }
  }
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'ESLint',
            informationUri: 'https://eslint.org',
            version: require('eslint/package.json').version,
            rules: [...rules.values()],
          },
        },
        results,
      },
    ],
  };
}

if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error('Uso: node scripts/ci/eslint-to-sarif.js <eslint.json> <eslint.sarif>');
    process.exit(2);
  }
  const sarif = toSarif(JSON.parse(fs.readFileSync(input, 'utf8')), process.cwd());
  fs.writeFileSync(output, JSON.stringify(sarif, null, 2));
  console.log(`${output}: ${sarif.runs[0].results.length} hallazgos`);
}

module.exports = { toSarif };
