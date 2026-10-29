import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, pressScale, radius, spacing, typography } from '../theme';

export type FloorTableState = 'libre' | 'ocupada' | 'reservada' | 'por_cobrar';
export type FloorTableShape = 'cuadrada' | 'redonda' | 'rectangular' | 'barra';

export interface FloorTable {
  id: number;
  number: string;
  capacity: number;
  shape?: FloorTableShape;
  area?: string;
  state?: FloorTableState;
}

interface Props {
  tables: FloorTable[];
  /** Con `onSelect` cada mesa se puede elegir (rol radio); sin él, el plano solo informa. */
  onSelect?: (table: FloorTable) => void;
  selectedNumber?: string | null;
  /** Muestra la leyenda de colores debajo del plano. */
  showLegend?: boolean;
}

const STATE: Record<FloorTableState, { label: string; fill: string; border: string; text: string }> = {
  libre: { label: 'Libre', fill: colors.surface, border: colors.success, text: colors.text },
  ocupada: { label: 'Ocupada', fill: colors.brand, border: colors.brand, text: colors.textOnBrand },
  reservada: { label: 'Reservada', fill: colors.infoSoft, border: colors.info, text: colors.info },
  por_cobrar: { label: 'Por cobrar', fill: colors.warningSoft, border: colors.warning, text: colors.warning },
};

const CHAIR = 10;
const GAP = 4;

/** Medidas de la mesa según su forma y cuántas personas caben. */
function tableSize(shape: FloorTableShape, capacity: number) {
  if (shape === 'barra') return { width: 40, height: 40, round: true };
  if (shape === 'redonda') return { width: 56, height: 56, round: true };
  if (shape === 'rectangular' || capacity > 4) return { width: 92, height: 52, round: false };
  return { width: 56, height: 56, round: false };
}

/** Posiciones de las sillas alrededor de la mesa (en una elipse), en px relativos al contenedor. */
function chairPositions(width: number, height: number, count: number) {
  const rx = width / 2 + GAP + CHAIR / 2;
  const ry = height / 2 + GAP + CHAIR / 2;
  const cx = width / 2 + GAP + CHAIR;
  const cy = height / 2 + GAP + CHAIR;
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return { left: cx + rx * Math.cos(angle) - CHAIR / 2, top: cy + ry * Math.sin(angle) - CHAIR / 2 };
  });
}

function TableSeat({
  table,
  selected,
  onSelect,
}: {
  table: FloorTable;
  selected: boolean;
  onSelect?: (table: FloorTable) => void;
}) {
  const shape = table.shape ?? 'cuadrada';
  const state = STATE[table.state ?? 'libre'];
  const { width, height, round } = tableSize(shape, table.capacity);
  const chairs = chairPositions(width, height, Math.min(table.capacity, 12));
  const box = { width: width + 2 * (GAP + CHAIR), height: height + 2 * (GAP + CHAIR) };
  const fill = selected ? colors.secondary : state.fill;
  const text = selected ? colors.textOnBrand : state.text;
  const label = onSelect
    ? `Mesa ${table.number}`
    : `Mesa ${table.number}, ${state.label}, ${table.capacity} lugares`;

  return (
    <Pressable
      onPress={onSelect ? () => onSelect(table) : undefined}
      disabled={!onSelect}
      accessible
      accessibilityRole={onSelect ? 'radio' : undefined}
      accessibilityState={onSelect ? { selected } : undefined}
      accessibilityLabel={label}
      accessibilityHint={onSelect ? `${state.label}, ${table.capacity} lugares` : undefined}
      style={({ pressed }) => [styles.seat, pressed && pressScale]}
    >
      <View style={box}>
        {chairs.map((chair, index) => (
          <View
            key={index}
            style={[styles.chair, chair, { backgroundColor: selected ? colors.secondary : state.border }]}
          />
        ))}
        <View
          style={[
            styles.table,
            {
              width,
              height,
              left: GAP + CHAIR,
              top: GAP + CHAIR,
              borderRadius: round ? radius.pill : radius.md,
              backgroundColor: fill,
              borderColor: selected ? colors.secondary : state.border,
            },
          ]}
        >
          <Text style={[styles.number, { color: text }]} numberOfLines={1}>
            {table.number}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Plano del salón: las mesas agrupadas por área, con su forma, sus sillas y su estado. */
export function FloorMap({ tables, onSelect, selectedNumber, showLegend = true }: Props) {
  const areas = new Map<string, FloorTable[]>();
  for (const table of tables) {
    const area = table.area ?? 'Salón';
    areas.set(area, [...(areas.get(area) ?? []), table]);
  }
  const used = new Set(tables.map((table) => table.state ?? 'libre'));

  return (
    <View accessibilityRole={onSelect ? 'radiogroup' : undefined}>
      {[...areas.entries()].map(([area, list]) => (
        <View key={area} style={styles.area}>
          <Text style={styles.areaName}>
            {area} · {list.length} {list.length === 1 ? 'mesa' : 'mesas'}
          </Text>
          <View style={styles.floor}>
            {list.map((table) => (
              <TableSeat
                key={table.id}
                table={table}
                selected={selectedNumber === table.number}
                onSelect={onSelect}
              />
            ))}
          </View>
        </View>
      ))}
      {showLegend && (
        <View
          style={styles.legend}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {(Object.keys(STATE) as FloorTableState[])
            .filter((state) => used.has(state))
            .map((state) => (
              <View key={state} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: STATE[state].fill, borderColor: STATE[state].border },
                  ]}
                />
                <Text style={styles.legendText}>{STATE[state].label}</Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { marginBottom: spacing.lg },
  areaName: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.sm },
  // Piso del área: fondo cálido con borde punteado, como un plano.
  floor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.elevated,
  },
  seat: { padding: spacing.xxs },
  chair: { position: 'absolute', width: CHAIR, height: CHAIR, borderRadius: radius.pill },
  table: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: typography.badge,
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 12, height: 12, borderRadius: radius.pill, borderWidth: 2 },
  legendText: { ...typography.caption, color: colors.textSecondary },
});
