import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, sizes, spacing, typography } from '../../../../shared/presentation/theme';
import { formatDate, formatTime } from '../../../../shared/utils/formatDateTime';

type Mode = 'date' | 'time';

interface Props {
  value: Date | null;
  onChange: (value: Date) => void;
  minimumDate?: Date;
  hasError?: boolean;
}

/** Combina la fecha o la hora elegida con el valor actual (en el reloj del dispositivo). */
export function mergeDateTime(current: Date | null, picked: Date, mode: Mode): Date {
  const result = new Date(current ?? picked);
  if (mode === 'date') result.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  else result.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return result;
}

/** Dos botones (fecha y hora) que abren el selector nativo. */
export function DateTimeField({ value, onChange, minimumDate, hasError }: Props) {
  const [mode, setMode] = useState<Mode | null>(null);

  const handleChange = (event: DateTimePickerEvent, picked?: Date) => {
    const currentMode = mode;
    setMode(null);
    if (event.type === 'set' && picked && currentMode) onChange(mergeDateTime(value, picked, currentMode));
  };

  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.button, hasError && styles.error, pressed && styles.pressed]}
        onPress={() => setMode('date')}
        accessibilityRole="button"
        accessibilityLabel={value ? `Fecha: ${formatDate(value)}` : 'Elegir fecha'}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.brandStrong} />
        <Text style={[styles.text, !value && styles.placeholder]} numberOfLines={1}>
          {value ? formatDate(value) : 'Fecha'}
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.time,
          hasError && styles.error,
          pressed && styles.pressed,
        ]}
        onPress={() => setMode('time')}
        accessibilityRole="button"
        accessibilityLabel={value ? `Hora: ${formatTime(value)}` : 'Elegir hora'}
      >
        <Ionicons name="time-outline" size={18} color={colors.brandStrong} />
        <Text style={[styles.text, !value && styles.placeholder]} numberOfLines={1}>
          {value ? formatTime(value) : 'Hora'}
        </Text>
      </Pressable>
      {mode && (
        <DateTimePicker
          value={value ?? minimumDate ?? new Date()}
          mode={mode}
          minimumDate={mode === 'date' ? minimumDate : undefined}
          minuteInterval={15}
          accentColor={colors.brand}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  button: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.control,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  time: { flex: 1 },
  pressed: { backgroundColor: colors.elevated },
  error: { borderColor: colors.danger },
  text: { ...typography.body, color: colors.text, flexShrink: 1 },
  placeholder: { color: colors.textSecondary },
});
