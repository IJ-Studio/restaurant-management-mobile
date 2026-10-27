#!/usr/bin/env bash
# Mide con Reassure la línea base y la rama en rondas con orden ABBA (base, rama | rama, base | ...)
# y une las mediciones de cada lado con merge-perf.js. Alternar el orden cancela el sesgo de que la
# segunda corrida de cada ronda salga más lenta porque el runner ya se calentó.
#
# Uso: scripts/perf/measure-rounds.sh <dir-base> <dir-rama> <rondas> <dir-salida>
# Deja <dir-salida>/baseline.perf y <dir-salida>/current.perf.
set -euo pipefail

BASE_DIR=$(cd "$1" && pwd)
HEAD_DIR=$(cd "$2" && pwd)
ROUNDS=$3
OUT_DIR=$4
MERGE="$HEAD_DIR/scripts/perf/merge-perf.js"
mkdir -p "$OUT_DIR"

for i in $(seq 1 "$ROUNDS"); do
  order="base head"; [ $((i % 2)) -eq 0 ] && order="head base"
  for side in $order; do
    dir=$BASE_DIR; [ "$side" = head ] && dir=$HEAD_DIR
    echo "::group::Ronda $i/$ROUNDS · $side"
    if [ "$side" = base ]; then
      # En la base una prueba puede fallar si la pantalla cambió en la rama; ese escenario queda
      # como "Sin línea base" en el reporte y no detiene la medición.
      (cd "$dir" && rm -f .reassure/baseline.perf && npx reassure --baseline) ||
        echo "::warning::Reassure terminó con error en la línea base (ronda $i)."
    else
      (cd "$dir" && rm -f .reassure/baseline.perf && npx reassure --baseline)
    fi
    cp "$dir/.reassure/baseline.perf" "$OUT_DIR/$side-$i.perf"
    echo "::endgroup::"
  done
done

node "$MERGE" "$OUT_DIR/baseline.perf" "$OUT_DIR"/base-*.perf
node "$MERGE" "$OUT_DIR/current.perf" "$OUT_DIR"/head-*.perf
