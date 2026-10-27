#!/usr/bin/env bash
# Prepara el checkout de la rama destino (develop) para medir su línea base con las MISMAS pruebas
# de rendimiento y los MISMOS datos que la rama: copia src/__perf__, las ayudas de prueba y la
# configuración de Reassure desde la rama, e instala Reassure si la base todavía no lo tiene.
# Así se compara el código de las pantallas, no dos versiones distintas de las pruebas.
#
# Uso: scripts/perf/prepare-baseline.sh <dir-rama> <dir-base>
set -euo pipefail

HEAD_DIR=$1
BASE_DIR=$2

rm -rf "$BASE_DIR/src/__perf__"
cp -R "$HEAD_DIR/src/__perf__" "$BASE_DIR/src/__perf__"
mkdir -p "$BASE_DIR/src/core/testing/data"
cp "$HEAD_DIR/src/core/testing/perf.tsx" "$BASE_DIR/src/core/testing/perf.tsx"
cp "$HEAD_DIR/src/core/testing/data/loadData.ts" "$HEAD_DIR/src/core/testing/data/testData.ts" "$BASE_DIR/src/core/testing/data/"

if [ ! -d "$BASE_DIR/node_modules/reassure" ]; then
  VERSION=$(node -p "require('$HEAD_DIR/node_modules/reassure/package.json').version")
  echo "La base no tiene Reassure: se instala reassure@$VERSION sin modificar su package.json."
  (cd "$BASE_DIR" && npm install --no-save --no-audit --no-fund "reassure@$VERSION")
fi
