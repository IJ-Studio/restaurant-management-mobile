/**
 * Presentación de los textos que el API guarda en MAYÚSCULAS: «Primera mayúscula, demás
 * minúsculas». Igual que `lib/formato/caja.ts` de la web: conserva correos, URL, siglas fiscales
 * (RFC, IVA, CFDI…) y claves con dígitos, y no toca un texto que ya trae minúsculas.
 */
const SIGLAS = new Set([
  'RFC',
  'IVA',
  'CFDI',
  'CURP',
  'NSS',
  'SAT',
  'ISR',
  'IEPS',
  'CP',
  'QR',
  'CLABE',
  'MXN',
  'IMSS',
  'PDF',
  'XML',
  'SA',
  'CV',
  'RL',
]);

function keep(word: string): boolean {
  const clean = word.replace(/[.,;:()¡!¿?"«»]/g, '').toUpperCase();
  return word.includes('@') || /^https?:\/\//i.test(word) || /\d/.test(word) || SIGLAS.has(clean);
}

const isMixed = (text: string) =>
  text.split(/\s+/).some((w) => !keep(w) && w !== w.toLocaleUpperCase('es-MX'));

/** «ENCHILADAS SUIZAS CON IVA» → «Enchiladas suizas con IVA». */
export function sentenceCase(text: string | null | undefined): string {
  if (!text) return '';
  if (isMixed(text)) return text;
  const lower = text
    .split(/(\s+)/)
    .map((w) => (keep(w) ? w : w.toLocaleLowerCase('es-MX')))
    .join('');
  return lower.replace(
    /^(\P{L}*)(\p{L})/u,
    (_, before: string, letter: string) => before + letter.toLocaleUpperCase('es-MX'),
  );
}

const PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'y']);

/** Nombres de persona: «MARÍA DE LA PEÑA» → «María de la Peña». */
export function properName(text: string | null | undefined): string {
  if (!text) return '';
  if (isMixed(text)) return text;
  return text
    .toLocaleLowerCase('es-MX')
    .split(/(\s+|-)/)
    .map((w, i) =>
      i > 0 && PARTICLES.has(w) ? w : w.replace(/^\p{L}/u, (l) => l.toLocaleUpperCase('es-MX')),
    )
    .join('');
}
