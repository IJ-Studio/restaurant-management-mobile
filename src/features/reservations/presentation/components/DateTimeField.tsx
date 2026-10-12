import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../../../shared/presentation/theme';
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
        style={[styles.button, hasError && styles.error]}
        onPress={() => setMode('date')}
        accessibilityRole="button"
        accessibilityLabel={value ? `Fecha: ${formatDate(value)}` : 'Elegir fecha'}
      >
        <Text style={styles.text}>{value ? formatDate(value) : 'Fecha'}</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.time, hasError && styles.error]}
        onPress={() => setMode('time')}
        accessibilityRole="button"
        accessibilityLabel={value ? `Hora: ${formatTime(value)}` : 'Elegir hora'}
      >
        <Text style={styles.text}>{value ? formatTime(value) : 'Hora'}</Text>
      </Pressable>
      {mode && (
        <DateTimePicker
          value={value ?? minimumDate ?? new Date()}
          mode={mode}
          minimumDate={mode === 'date' ? minimumDate : undefined}
          minuteInterval={15}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  button: {
    flex: 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  time: { flex: 1, marginLeft: spacing.sm },
  error: { borderColor: colors.danger },
  text: { fontSize: 16, color: colors.text },
});
