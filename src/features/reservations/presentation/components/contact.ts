/** Contacto con el cliente de una reservación (Fase 4.6): las mismas reglas que la web. */

/** Número para wa.me: con «+» y 10–15 dígitos; 10 dígitos de México → 52…; o 52 + 10. */
export function whatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+') && digits.length >= 10 && digits.length <= 15) return digits;
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return digits;
  return null;
}

export function whatsappUrl(phone: string | null | undefined, message: string): string | null {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}

export function mailtoUrl(email: string | null | undefined, subject: string, body: string): string | null {
  const to = email?.trim() ?? '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return null;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
