// Fechas: la BD guarda UTC; se muestran en la zona horaria local del usuario indicando la zona (SRS 2.3).
const ZONA = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function fechaHora(iso, zona = ZONA) {
  if (!iso) return '—';
  const d = new Date(iso);
  const local = new Intl.DateTimeFormat('es-MX', {
    timeZone: zona, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short',
  }).format(d);
  return local;
}

export const utc = (iso) => (iso ? `${new Date(iso).toISOString().replace('T', ' ').slice(0, 19)} UTC` : '');

// Campos DATE (sin hora): se formatean en UTC para no desplazar el día
export function fecha(iso, opciones = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', ...opciones }).format(new Date(iso));
}
export const fechaCorta = (iso) => fecha(iso, { day: '2-digit', month: 'short' });

export const mxn = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(n ?? 0));
export const numero = (n) => new Intl.NumberFormat('es-MX').format(Number(n ?? 0));

export const iniciales = (nombre = '') =>
  nombre.replace(/\./g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export const ESTADO_AUDITORIA = {
  pendiente: { texto: 'Pendiente', tono: 'neutral' },
  en_ejecucion: { texto: 'En ejecución', tono: 'warn' },
  en_aprobacion: { texto: 'En aprobación', tono: 'info' },
  cerrada: { texto: 'Cerrada', tono: 'ok' },
};

export const ESTADO_PROCEDIMIENTO = {
  abierto: { texto: 'Abierto', tono: 'neutral' },
  evaluado: { texto: 'Evaluado', tono: 'info' },
  revisado: { texto: 'Revisado', tono: 'warn' },
  supervisado: { texto: 'Supervisado', tono: 'ok' },
  rechazado: { texto: 'Rechazado', tono: 'brand' },
};

export const ESTADO_HALLAZGO = {
  abierto: { texto: 'Abierto', tono: 'brand' },
  revision_jefe: { texto: 'Revisión Jefatura', tono: 'info' },
  revision_gerente: { texto: 'Revisión Gerencia', tono: 'info' },
  esperando_plan: { texto: 'Esperando plan', tono: 'warn' },
  en_seguimiento: { texto: 'En seguimiento', tono: 'warn' },
  solventado: { texto: 'Solventado', tono: 'ok' },
  rechazado: { texto: 'Rechazado', tono: 'neutral' },
};

export const ESTADO_PLAN = {
  abierto: { texto: 'Abierto', tono: 'neutral' },
  en_progreso: { texto: 'En progreso', tono: 'warn' },
  revision_grc: { texto: 'Revisión Control Interno', tono: 'info' },
  revision_jefe: { texto: 'Revisión Jefatura', tono: 'info' },
  reevaluando: { texto: 'Reevaluando', tono: 'info' },
  cerrado: { texto: 'Cerrado', tono: 'ok' },
  rechazado: { texto: 'Rechazado', tono: 'brand' },
};

export const SEMAFORO = {
  en_tiempo: { texto: 'En tiempo', tono: 'ok' },
  por_vencer: { texto: 'Por vencer', tono: 'warn' },
  demorado: { texto: 'Demorado', tono: 'brand' },
  cerrado: { texto: 'Cerrado', tono: 'neutral' },
};

export const SEVERIDAD = {
  'Crítica': { tono: 'brand', color: 'var(--color-brand)' },
  Alta: { tono: 'warn', color: 'var(--color-warn)' },
  Moderada: { tono: 'info', color: 'var(--color-info)' },
  Baja: { tono: 'neutral', color: 'var(--color-muted)' },
};

export const NIVEL_APROBACION = { jefe: 'Jefe de Auditoría', gerente: 'Gerente de Auditoría', director: 'Director de Auditoría' };
