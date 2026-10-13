// Matriz de permisos en la interfaz (espejo del RBAC del backend; el backend es la autoridad).
export const puede = {
  crearAuditoria: (u) => ['lider', 'gerente', 'director'].includes(u?.rol),
  registrarHallazgo: (u, a) => ['auditor', 'lider'].includes(u?.rol) && (!a || ['pendiente', 'en_ejecucion'].includes(a.estado)),
  evaluarControl: (u, a, p) => ['pendiente', 'en_ejecucion'].includes(a?.estado)
    && (u?.rol === 'lider' || (u?.rol === 'auditor' && p?.auditor_id === u.id)),
  solicitarCierre: (u, a) => u?.rol === 'lider' && a?.lider_id === u.id && a?.estado === 'en_ejecucion',
  decidirCierre: (u, a) => a?.estado === 'en_aprobacion' && a?.aprobaciones?.find((x) => x.decision === 'pendiente')?.nivel === u?.rol,
  capturarAvance: (u, p) => ['abierto', 'en_progreso', 'rechazado'].includes(p?.estado)
    && (['auditor', 'lider'].includes(u?.rol) || (u?.rol === 'auditado' && p?.responsable_id === u.id)),
  validarPlan: (u, p) => (u?.rol === 'grc' && p?.estado === 'revision_grc') || (u?.rol === 'jefe' && p?.estado === 'revision_jefe'),
  verBitacora: (u) => ['director', 'admin', 'gerente'].includes(u?.rol),
  verReporte: (u) => ['lider', 'jefe', 'gerente', 'director', 'auditor'].includes(u?.rol),
};
