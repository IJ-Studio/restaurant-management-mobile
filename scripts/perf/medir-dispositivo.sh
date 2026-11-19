#!/usr/bin/env bash
# Fase 8: mide la app instalada en un Android por USB. Solo toca el paquete de la app.
# Uso: APP_ID=com.ijstudio.restaurantmanagement scripts/perf/medir-dispositivo.sh [repeticiones]
# Salida: reports/perf-dispositivo.json (arranque en frío, memoria PSS y fotogramas lentos).
# Requisito: sesión iniciada en la app (para medir la pantalla principal, no el login).
set -euo pipefail
APP_ID="${APP_ID:-com.ijstudio.restaurantmanagement}"
N="${1:-5}"
SERIAL=$(adb devices | awk 'NR>1 && $2=="device" && $1 !~ /_adb-tls-connect/ {print $1; exit}')
[[ -n "$SERIAL" ]] || { echo "No hay teléfono por USB (adb devices)." >&2; exit 1; }
A="adb -s $SERIAL"
ACTIVITY=$($A shell cmd package resolve-activity --brief "$APP_ID" | tail -1)

tiempos=()
for i in $(seq 1 "$N"); do
  $A shell am force-stop "$APP_ID"
  sleep 2
  t=$($A shell am start -S -W -n "$ACTIVITY" | awk -F': ' '/TotalTime/ {print $2}' | tr -d '\r')
  tiempos+=("$t"); echo "arranque $i: ${t} ms"
  sleep 4
done

# Memoria tras 10 s en la pantalla principal.
sleep 10
pss=$($A shell dumpsys meminfo "$APP_ID" | awk '/TOTAL PSS:/ {print $3; exit} /^ *TOTAL / {print $2; exit}' | tr -d '\r')

# Fotogramas: reinicia el contador, desplaza la lista 6 veces y lee gfxinfo.
$A shell dumpsys gfxinfo "$APP_ID" reset >/dev/null
read -r w h < <($A shell wm size | awk -F'[ x]' '/Physical/ {print $3, $4}' | tr -d '\r')
for _ in 1 2 3 4 5 6; do $A shell input swipe $((w / 2)) $((h * 3 / 4)) $((w / 2)) $((h / 4)) 250; sleep 0.5; done
gfx=$($A shell dumpsys gfxinfo "$APP_ID")
total=$(echo "$gfx" | awk -F': ' '/Total frames rendered/ {print $2; exit}' | tr -d '\r')
lentos=$(echo "$gfx" | awk -F': ' '/Janky frames/ {print $2; exit}' | awk '{print $1}' | tr -d '\r')

mkdir -p reports
python3 - "$N" "$pss" "$total" "$lentos" "${tiempos[@]}" <<'PY' > reports/perf-dispositivo.json
import json, statistics, sys
n, pss, total, lentos, *t = sys.argv[1:]
t = sorted(int(x) for x in t if x)
print(json.dumps({
    "arranqueFrioMs": {"mediana": statistics.median(t), "min": t[0], "max": t[-1], "muestras": t},
    "memoriaPssKb": int(pss or 0),
    "fotogramas": {"total": int(total or 0), "lentos": int(lentos or 0)},
}, indent=2))
PY
cat reports/perf-dispositivo.json
