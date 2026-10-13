// Misma regla que el backend: texto significativo, no sólo "no vacío" (retroalimentación SRS).
const RELLENO = new Set(['na', 'n/a', 'n.a.', 'ninguno', 'ninguna', 'nada', 'x', 'xx', 'xxx', 'xxxx', 'asdf', 'test', 'prueba', '-', '--', '...', '.', 'sin comentarios', 'pendiente']);

export function texto(valor, min, campo) {
  const t = String(valor ?? '').trim();
  if (!t) return `Completa ${campo}.`;
  if (RELLENO.has(t.toLowerCase())) return `Describe ${campo} con información real, no con texto de relleno.`;
  const alfanumericos = (t.match(/[\p{L}\p{N}]/gu) ?? []).length;
  if (t.length < min || alfanumericos < Math.ceil(min * 0.6)) return `Escribe al menos ${min} caracteres (llevas ${t.length}).`;
  return null;
}

export const requerido = (valor, mensaje) => (valor === '' || valor == null ? mensaje : null);
