import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { legalLinks } from '../../../../core/config/legalLinks';
import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { colors, opacity, spacing, typography } from '../../../../shared/presentation/theme';

/** Qué datos trata la app y para qué. Describe solo lo que la app hace. */
export const NOTICE_ITEMS = [
  'Tu nombre, correo, teléfono y rol: para identificarte y darte acceso solo a lo que corresponde a tu puesto.',
  'Los pedidos, cobros, reservaciones y reportes que registras: para operar el restaurante y saber quién hizo cada movimiento.',
  'El identificador de este teléfono: solo si activas los avisos de pedidos, para enviártelos (servicio de Expo).',
  'Informes técnicos de errores, sin tu nombre ni tu correo: para corregir fallas de la app (servicio de Sentry).',
] as const;

interface Props {
  onAccept: () => void;
  onDecline: () => void;
  isAccepting?: boolean;
  error?: string | null;
}

/**
 * Aviso de privacidad con consentimiento explícito: la casilla llega sin marcar y no se puede
 * continuar sin marcarla. Quien no acepta cierra la sesión.
 */
export function PrivacyNoticeScreen({ onAccept, onDecline, isAccepting = false, error }: Props) {
  const [accepted, setAccepted] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Aviso de privacidad
      </Text>
      <Text style={styles.lead}>
        Antes de usar la app, revisa cómo trata El Quijote tus datos como parte del personal.
      </Text>

      <Card style={styles.card}>
        {NOTICE_ITEMS.map((item) => (
          <View key={item} style={styles.item}>
            <Ionicons name="ellipse" size={8} color={colors.brandStrong} style={styles.bullet} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
        <Text style={styles.rights}>
          Puedes consultar y corregir tus datos, apagar los avisos y los informes, y eliminar tu cuenta desde
          Perfil → Privacidad.
        </Text>
      </Card>

      <Button
        label="Leer el aviso de privacidad completo"
        variant="ghost"
        onPress={() => {
          Linking.openURL(legalLinks.privacy).catch(() => undefined);
        }}
        style={styles.link}
      />

      <Pressable
        onPress={() => setAccepted((value) => !value)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        accessibilityLabel="He leído y acepto el aviso de privacidad"
        style={({ pressed }) => [styles.checkbox, pressed && styles.pressed]}
      >
        <Ionicons
          name={accepted ? 'checkbox' : 'square-outline'}
          size={26}
          color={accepted ? colors.brandStrong : colors.textSecondary}
        />
        <Text style={styles.checkboxLabel}>He leído y acepto el aviso de privacidad</Text>
      </Pressable>

      {error ? <Notice message={error} style={styles.notice} /> : null}
      <Button
        label="Aceptar y continuar"
        onPress={onAccept}
        disabled={!accepted}
        loading={isAccepting}
        style={styles.accept}
      />
      <Button label="No acepto, cerrar sesión" variant="outline" onPress={onDecline} style={styles.decline} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.xxxl },
  title: { ...typography.title, color: colors.text },
  lead: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  card: { marginTop: spacing.lg, gap: spacing.md },
  item: { flexDirection: 'row', gap: spacing.sm },
  bullet: { marginTop: spacing.sm },
  itemText: { ...typography.body, color: colors.text, flex: 1 },
  rights: { ...typography.caption, color: colors.textSecondary },
  link: { marginTop: spacing.sm },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  checkboxLabel: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  pressed: { opacity: opacity.dimmed },
  notice: { marginTop: spacing.sm },
  accept: { marginTop: spacing.md },
  decline: { marginTop: spacing.md },
});
