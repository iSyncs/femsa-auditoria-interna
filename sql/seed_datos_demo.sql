/* =====================================================================
   FEMSA - Sistema de Auditoría Interna | Equipo 2 "Mesa para 7"
   Datos de DEMOSTRACIÓN (ficticios) para desarrollo y pruebas.
   Requiere: sql/femsa_auditoria_sqlserver.sql (v2.1.0)
   Las fechas se calculan relativas a la fecha actual (UTC) para que
   el semáforo de vencimientos y las alertas sean realistas.
   La auditoría cerrada se sella desde backend/scripts/init-db.js
   (SHA-256 del manifiesto), igual que en el flujo real.
   ===================================================================== */
SET NOCOUNT ON;
DECLARE @hoy DATE = CAST(SYSUTCDATETIME() AS DATE);

/* ------------------------------- Roles ------------------------------- */
INSERT INTO aud.roles (clave, nombre, descripcion) VALUES
 (N'auditor',  N'Auditor',                 N'Ejecuta pruebas, califica controles y solicita PBC.'),
 (N'lider',    N'Auditor Líder',           N'Responsable del expediente; registra hallazgos y solicita el cierre.'),
 (N'jefe',     N'Jefe de Auditoría',       N'Supervisa procedimientos; primer nivel de aprobación de cierre.'),
 (N'gerente',  N'Gerente de Auditoría',    N'Segundo nivel de aprobación; monitorea planes.'),
 (N'director', N'Director de Auditoría',   N'Firma final; sella el expediente.'),
 (N'grc',      N'Revisor de Control Interno', N'Segunda línea: valida evidencia de remediación de su UdN.'),
 (N'auditado', N'Personal Auditado',       N'Atiende PBC y captura avances de SUS auditorías.'),
 (N'admin',    N'Administrador Funcional', N'Catálogos y configuración; sin acceso a modificar expedientes.');

/* -------------------------- Unidades de negocio ---------------------- */
INSERT INTO aud.unidades_negocio (clave, unidad, direccion, division, area, pais, zona_horaria) VALUES
 (N'UDN-0001', N'Coca-Cola FEMSA (KOF)', N'Bebidas',       N'Manufactura',   N'Planta Toluca',          N'México',   N'America/Mexico_City'),
 (N'UDN-0002', N'OXXO México',           N'Retail & Spin', N'Proximidad',    N'Cadena de suministro',   N'México',   N'America/Monterrey'),
 (N'UDN-0003', N'Spin by OXXO',          N'Retail & Spin', N'Servicios financieros', N'Tecnología',    N'México',   N'America/Monterrey'),
 (N'UDN-0004', N'FEMSA Servicios',       N'Retail & Spin', N'Corporativo',   N'Finanzas corporativas',  N'México',   N'America/Monterrey'),
 (N'UDN-0005', N'KOF Brasil',            N'Bebidas',       N'Operaciones',   N'Distribución',           N'Brasil',   N'America/Sao_Paulo'),
 (N'UDN-0006', N'Valora (Europa)',       N'Retail & Spin', N'Proximidad Europa', N'Finanzas',           N'Suiza',    N'Europe/Zurich');

/* ------------------------------ Usuarios ----------------------------- */
DECLARE @r TABLE (clave NVARCHAR(30), id INT);
INSERT INTO @r SELECT clave, id FROM aud.roles;

INSERT INTO aud.usuarios (nombre, correo, rol_id, direccion, unidad_negocio_id, zona_horaria) VALUES
 (N'M. Rodríguez',   N'm.rodriguez@demo.femsa.test', (SELECT id FROM @r WHERE clave=N'lider'),    N'Retail & Spin', NULL, N'America/Monterrey'),        -- 1
 (N'J. Fernández',   N'j.fernandez@demo.femsa.test', (SELECT id FROM @r WHERE clave=N'lider'),    N'Bebidas',       NULL, N'America/Mexico_City'),      -- 2
 (N'Anita Muñoz',    N'a.munoz@demo.femsa.test',     (SELECT id FROM @r WHERE clave=N'auditor'),  N'Retail & Spin', NULL, N'America/Monterrey'),        -- 3
 (N'Carlos Torres',  N'c.torres@demo.femsa.test',    (SELECT id FROM @r WHERE clave=N'auditor'),  N'Retail & Spin', NULL, N'America/Bogota'),           -- 4
 (N'Theo Lawrence',  N't.lawrence@demo.femsa.test',  (SELECT id FROM @r WHERE clave=N'auditor'),  N'Bebidas',       NULL, N'America/Sao_Paulo'),        -- 5
 (N'L. Garza',       N'l.garza@demo.femsa.test',     (SELECT id FROM @r WHERE clave=N'jefe'),     N'Retail & Spin', NULL, N'America/Monterrey'),        -- 6
 (N'R. Salinas',     N'r.salinas@demo.femsa.test',   (SELECT id FROM @r WHERE clave=N'jefe'),     N'Bebidas',       NULL, N'America/Mexico_City'),      -- 7
 (N'P. Villarreal',  N'p.villarreal@demo.femsa.test',(SELECT id FROM @r WHERE clave=N'gerente'),  N'Retail & Spin', NULL, N'America/Monterrey'),        -- 8
 (N'S. Cantú',       N's.cantu@demo.femsa.test',     (SELECT id FROM @r WHERE clave=N'gerente'),  N'Bebidas',       NULL, N'America/Mexico_City'),      -- 9
 (N'D. Herrera',     N'd.herrera@demo.femsa.test',   (SELECT id FROM @r WHERE clave=N'director'), NULL,             NULL, N'America/Monterrey'),        -- 10
 (N'G. Ibarra',      N'g.ibarra@demo.femsa.test',    (SELECT id FROM @r WHERE clave=N'grc'),      N'Retail & Spin', 4,    N'America/Monterrey'),        -- 11
 (N'E. Ramos',       N'e.ramos@demo.femsa.test',     (SELECT id FROM @r WHERE clave=N'auditado'), N'Retail & Spin', 4,    N'America/Monterrey'),        -- 12
 (N'F. Moreno',      N'f.moreno@demo.femsa.test',    (SELECT id FROM @r WHERE clave=N'auditado'), N'Bebidas',       1,    N'America/Mexico_City'),      -- 13
 (N'Admin Funcional',N'admin@demo.femsa.test',       (SELECT id FROM @r WHERE clave=N'admin'),    NULL,             NULL, N'America/Monterrey');        -- 14

/* ------------------------ Riesgos y controles ------------------------ */
INSERT INTO aud.riesgos (tracking_id, nombre, categoria, nivel_inherente) VALUES
 (N'RSK-000101', N'Diferencias de inventario no detectadas',           N'Operativo',   N'Alto'),
 (N'RSK-000102', N'Pagos no autorizados a proveedores',                N'Financiero',  N'Crítico'),
 (N'RSK-000103', N'Accesos privilegiados sin revisión',                N'Tecnológico', N'Alto'),
 (N'RSK-000104', N'Partidas en conciliación sin depurar',              N'Financiero',  N'Moderado'),
 (N'RSK-000105', N'Incumplimiento en tiempos de entrega a clientes',   N'Operativo',   N'Moderado');

INSERT INTO aud.controles (tracking_id, nombre, dominio, riesgo_id) VALUES
 (N'CP-000201', N'Conteos cíclicos con conciliación a libro mayor',     N'Operational',   1),
 (N'CP-000202', N'Autorización de ajustes manuales de inventario',      N'Operational',   1),
 (N'CP-000203', N'Segregación en alta y liberación de pagos',           N'Finance',       2),
 (N'CP-000204', N'Revisión trimestral de accesos privilegiados',        N'Cybersecurity', 3),
 (N'CP-000205', N'Conciliación bancaria mensual con revisión',          N'Finance',       4),
 (N'CP-000206', N'Monitoreo de nivel de servicio en rutas',             N'Operational',   5);

/* ------------------------------ Auditorías --------------------------- */
INSERT INTO aud.auditorias (nombre, objetivo, unidad_negocio_id, tipo, area, prioridad, lider_id, estado, fecha_inicio, fecha_fin) VALUES
 (N'Control de inventarios · Planta Toluca',
  N'Validar que los controles de inventario operen con evidencia suficiente, segregación de funciones adecuada y conciliaciones oportunas entre almacén y libro mayor.',
  1, N'Operativa', N'Planta Toluca', N'Alta', 2, N'en_ejecucion', DATEADD(DAY,-40,@hoy), DATEADD(DAY,9,@hoy)),                          -- 1
 (N'Pagos a proveedores LatAm',
  N'Evaluar la segregación de funciones y las autorizaciones en el ciclo de cuentas por pagar.',
  4, N'Financiera', N'Finanzas corporativas', N'Alta', 1, N'en_ejecucion', DATEADD(DAY,-25,@hoy), DATEADD(DAY,18,@hoy)),                -- 2
 (N'Accesos y ciberseguridad Spin',
  N'Verificar la revisión periódica de accesos privilegiados en plataformas de Spin.',
  3, N'Cybersecurity', N'Tecnología', N'Alta', 1, N'pendiente', DATEADD(DAY,5,@hoy), DATEADD(DAY,45,@hoy)),                             -- 3
 (N'Conciliaciones bancarias Q2',
  N'Confirmar que las conciliaciones bancarias del segundo trimestre se preparen y revisen en tiempo.',
  4, N'Financiera', N'Finanzas corporativas', N'Baja', 1, N'en_aprobacion', DATEADD(DAY,-90,@hoy), DATEADD(DAY,-20,@hoy)),            -- 4 (se sella en init-db)
 (N'Abasto y distribución OXXO Norte',
  N'Revisar el cumplimiento de niveles de servicio y la documentación de mermas en CEDIS.',
  2, N'Operativa', N'Cadena de suministro', N'Media', 1, N'en_aprobacion', DATEADD(DAY,-60,@hoy), DATEADD(DAY,-2,@hoy)),               -- 5
 (N'Distribución KOF Brasil',
  N'Evaluar controles de entrega y cobranza en rutas de distribución.',
  5, N'Operativa', N'Distribución', N'Media', 2, N'en_ejecucion', DATEADD(DAY,-15,@hoy), DATEADD(DAY,30,@hoy));                       -- 6

INSERT INTO aud.auditoria_participantes (auditoria_id, usuario_id, papel) VALUES
 (2, 12, N'enlace'), (4, 12, N'responsable'), (1, 13, N'enlace'), (2, 3, N'auditor'), (3, 4, N'auditor'), (1, 5, N'auditor');

/* ----------------------- Procedimientos (AP) ------------------------- */
INSERT INTO aud.procedimientos_auditoria (auditoria_id, control_id, auditor_id, estado, calif_diseno, calif_efectividad, vulnerabilidad, aplica_hallazgo, comentarios, fecha_evaluacion) VALUES
 (1, 1, 5, N'supervisado', N'Definido',   N'Definido',   N'Moderado', 0, N'Conteos cíclicos ejecutados conforme a calendario.', DATEADD(DAY,-12,SYSUTCDATETIME())),
 (1, 2, 5, N'evaluado',    N'Funcional',  N'Inicial',    N'Alto',     1, N'Ajustes manuales recurrentes sin soporte documental completo; merma de 8% vs 3% de política.', DATEADD(DAY,-6,SYSUTCDATETIME())),
 (1, 1, 2, N'abierto',     NULL, NULL, NULL, 0, NULL, NULL),
 (2, 3, 3, N'revisado',    N'Funcional',  N'Funcional',  N'Alto',     1, N'Se identificaron usuarios con permisos para dar de alta y liberar pagos simultáneamente.', DATEADD(DAY,-4,SYSUTCDATETIME())),
 (2, 3, 3, N'supervisado', N'Administrado', N'Definido', N'Bajo',     0, N'Muestra de 25 pagos con autorización dual correcta.', DATEADD(DAY,-8,SYSUTCDATETIME())),
 (3, 4, 4, N'abierto',     NULL, NULL, NULL, 0, NULL, NULL),
 (4, 5, 1, N'supervisado', N'Administrado', N'Administrado', N'Bajo', 0, N'Conciliaciones preparadas y revisadas dentro de los 5 días hábiles.', DATEADD(DAY,-40,SYSUTCDATETIME())),
 (4, 5, 1, N'supervisado', N'Definido',   N'Funcional',  N'Moderado', 1, N'Partidas en conciliación con antigüedad mayor a 90 días sin depurar.', DATEADD(DAY,-38,SYSUTCDATETIME())),
 (5, 6, 3, N'supervisado', N'Definido',   N'Definido',   N'Moderado', 0, N'Niveles de servicio monitoreados semanalmente.', DATEADD(DAY,-10,SYSUTCDATETIME())),
 (5, 1, 3, N'supervisado', N'Funcional',  N'Funcional',  N'Moderado', 1, N'Documentación de mermas incompleta en 3 de 12 CEDIS revisados.', DATEADD(DAY,-9,SYSUTCDATETIME())),
 (6, 6, 5, N'evaluado',    N'Definido',   N'Definido',   N'Bajo',     0, N'Rutas con entrega en tiempo mayor a 95%.', DATEADD(DAY,-3,SYSUTCDATETIME())),
 (6, 1, 5, N'abierto',     NULL, NULL, NULL, 0, NULL, NULL);

/* ----------------------------- Hallazgos ----------------------------- */
INSERT INTO aud.hallazgos (auditoria_id, procedimiento_id, titulo, condicion, criterio, causa, efecto, recomendacion, severidad, tipo, riesgo_residual, impacto_mxn, estado, responsable_id, fecha_identificacion) VALUES
 (1, 2, N'Ajustes manuales de inventario sin soporte documental',
  N'Se registraron 37 ajustes manuales en el trimestre sin documento soporte adjunto en sistema.',
  N'Política de inventarios KOF: todo ajuste requiere soporte y doble autorización.',
  N'El sistema permite registrar ajustes sin adjunto obligatorio.',
  N'Posible distorsión de inventario y margen operativo.',
  N'Bloquear ajustes manuales sin soporte y exigir autorización dual en sistema.',
  N'Crítica', N'Debilidad de control', N'Alto', 1850000, N'esperando_plan', 13, DATEADD(DAY,-6,SYSUTCDATETIME())),
 (1, 2, N'Merma por encima del umbral autorizado',
  N'La merma acumulada del periodo es de 8%, frente a un máximo autorizado de 3%.',
  N'Lineamiento de mermas de Planta Toluca (umbral 3%).',
  N'Falta de análisis de causa raíz de diferencias recurrentes.',
  N'Pérdida económica y subestimación del costo de ventas.',
  N'Implementar análisis mensual de merma con responsable y umbral de alerta.',
  N'Alta', N'Debilidad de control', N'Alto', 920000, N'abierto', 13, DATEADD(DAY,-5,SYSUTCDATETIME())),
 (2, 4, N'Roles incompatibles en liberación de pagos a proveedores',
  N'Cuatro usuarios pueden dar de alta proveedores y liberar pagos sin segunda revisión.',
  N'Matriz de segregación de funciones de Finanzas corporativas.',
  N'Asignación de perfiles sin revisión periódica de conflictos.',
  N'Riesgo de pagos no autorizados o fraude.',
  N'Redefinir la matriz de permisos y activar revisión semanal de conflictos.',
  N'Crítica', N'Debilidad de control', N'Crítico', 3400000, N'en_seguimiento', 12, DATEADD(DAY,-4,SYSUTCDATETIME())),
 (4, 8, N'Partidas de conciliación con antigüedad mayor a 90 días',
  N'Se detectaron 14 partidas en conciliación con más de 90 días sin depurar.',
  N'Procedimiento de tesorería: depurar partidas en máximo 60 días.',
  N'Carga operativa y falta de seguimiento del responsable.',
  N'Saldos bancarios contables no representativos.',
  N'Depuración mensual con reporte de antigüedad al Gerente de Tesorería.',
  N'Moderada', N'Debilidad menor', N'Moderado', 210000, N'en_seguimiento', 12, DATEADD(DAY,-38,SYSUTCDATETIME())),
 (5, 10, N'Documentación de mermas incompleta en CEDIS',
  N'En 3 de 12 CEDIS revisados, las actas de merma no cuentan con firma del responsable.',
  N'Lineamiento de control de mermas OXXO.',
  N'Rotación de personal y falta de capacitación en el formato.',
  N'Retraso en el cierre formal y riesgo de mermas no justificadas.',
  N'Capacitación trimestral y tablero de vencimientos con responsable único.',
  N'Moderada', N'Debilidad menor', N'Moderado', 150000, N'en_seguimiento', 12, DATEADD(DAY,-9,SYSUTCDATETIME())),
 (2, 4, N'Proveedores duplicados en el maestro',
  N'Se identificaron 11 proveedores con RFC duplicado y cuentas bancarias distintas.',
  N'Política de alta de proveedores: RFC único por proveedor.',
  N'Validaciones de unicidad deshabilitadas en el maestro.',
  N'Riesgo de pagos duplicados.',
  N'Activar validación de RFC único y depurar el maestro.',
  N'Baja', N'Debilidad menor', N'Bajo', 45000, N'abierto', NULL, DATEADD(DAY,-2,SYSUTCDATETIME()));

/* ----------------------- Planes de remediación ----------------------- */
INSERT INTO aud.planes_remediacion (hallazgo_id, descripcion, responsable_id, fecha_compromiso, monto_mxn, estado, avance_pct, fecha_conclusion) VALUES
 (3, N'Rediseñar la matriz de perfiles de Cuentas por Pagar y remover los conflictos detectados.', 12, DATEADD(DAY,4,@hoy),   3400000, N'en_progreso', 60, NULL),
 (3, N'Implementar reporte semanal automático de conflictos de segregación.',                      12, DATEADD(DAY,25,@hoy),  0,       N'en_progreso', 20, NULL),
 (4, N'Depurar las 14 partidas antiguas y documentar su resolución con tesorería.',                12, DATEADD(DAY,-6,@hoy),  210000,  N'en_progreso', 70, NULL),
 (5, N'Capacitar a responsables de CEDIS en el formato de actas de merma.',                         12, DATEADD(DAY,14,@hoy),  150000,  N'revision_grc', 100, DATEADD(DAY,-1,SYSUTCDATETIME())),
 (4, N'Establecer reporte mensual de antigüedad de partidas al Gerente de Tesorería.',             12, DATEADD(DAY,1,@hoy),   0,       N'abierto', 0, NULL);

INSERT INTO aud.avances_plan (plan_id, avance_pct, comentario, actualizado_por_id, fecha, zona_horaria) VALUES
 (1, 30, N'Se levantó inventario de perfiles con conflicto.', 12, DATEADD(DAY,-3,SYSUTCDATETIME()), N'America/Monterrey'),
 (1, 60, N'Se removieron 3 de 4 conflictos; falta usuario de tesorería.', 12, DATEADD(DAY,-1,SYSUTCDATETIME()), N'America/Monterrey'),
 (3, 70, N'Depuradas 10 de 14 partidas.', 12, DATEADD(DAY,-8,SYSUTCDATETIME()), N'America/Monterrey'),
 (4, 100, N'Capacitación impartida a los 12 CEDIS; se adjuntan listas de asistencia.', 12, DATEADD(DAY,-1,SYSUTCDATETIME()), N'America/Monterrey');

/* ----------- Flujo de aprobación (auditorías 4 y 5 en aprobación) ------- */
INSERT INTO aud.aprobaciones (auditoria_id, secuencia, nivel, aprobador_id, decision, comentarios, fecha_decision, zona_horaria) VALUES
 (4, 1, N'jefe',     6,  N'aprobado', N'Procedimientos supervisados y soportados.', DATEADD(DAY,-18,SYSUTCDATETIME()), N'America/Monterrey'),
 (4, 2, N'gerente',  8,  N'aprobado', N'Sin observaciones metodológicas.',          DATEADD(DAY,-17,SYSUTCDATETIME()), N'America/Monterrey'),
 (4, 3, N'director', 10, N'pendiente', NULL, NULL, NULL),
 (5, 1, N'jefe',     6,  N'aprobado', N'Expediente completo.',                     DATEADD(DAY,-1,SYSUTCDATETIME()), N'America/Monterrey'),
 (5, 2, N'gerente',  8,  N'pendiente', NULL, NULL, NULL),
 (5, 3, N'director', 10, N'pendiente', NULL, NULL, NULL);

/* ------------------------------ Evidencias --------------------------- */
INSERT INTO aud.evidencias (procedimiento_id, hallazgo_id, nombre_archivo, blob_url, tipo_mime, tamano_bytes, hash_sha256, cargado_por_id) VALUES
 (2, 1, N'ajustes_manuales_Q3.xlsx', N'evidencias/AUD-000001/ajustes_manuales_Q3.xlsx', N'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 48213, REPLICATE('a',64), 5),
 (4, 3, N'matriz_perfiles_cxp.zip',  N'evidencias/AUD-000002/matriz_perfiles_cxp.zip',  N'application/zip', 1250331, REPLICATE('b',64), 3);
-- Archivos contenidos en el ZIP: folio hijo SOPORTE-######-NNN
INSERT INTO aud.evidencias (tracking_id, evidencia_padre_id, nombre_archivo, tipo_mime, tamano_bytes, hash_sha256, cargado_por_id) VALUES
 (N'SOPORTE-000002-001', 2, N'perfiles_sap.xlsx', N'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 802112, REPLICATE('c',64), 3),
 (N'SOPORTE-000002-002', 2, N'conflictos_sod.pdf', N'application/pdf', 448219, REPLICATE('d',64), 3);

/* ------------------------------ Bitácora ----------------------------- */
INSERT INTO aud.bitacora (entidad, entidad_id, folio, accion, usuario_id, detalle, ip, zona_horaria, fecha) VALUES
 (N'hallazgos', 1, N'FND-000001', N'CREAR', 2, N'{"origen":"carga inicial"}', N'10.0.0.12', N'America/Mexico_City', DATEADD(DAY,-6,SYSUTCDATETIME())),
 (N'aprobaciones', 4, N'AUD-000004', N'APROBAR', 8, N'{"nivel":"gerente"}', N'10.0.0.40', N'America/Monterrey', DATEADD(DAY,-17,SYSUTCDATETIME()));

INSERT INTO aud.historial_accesos (usuario_id, correo, resultado, ip, agente, zona_horaria, fecha) VALUES
 (1, N'm.rodriguez@demo.femsa.test', N'exito', N'10.0.0.21', N'Edge 140', N'America/Monterrey', DATEADD(HOUR,-3,SYSUTCDATETIME())),
 (12, N'e.ramos@demo.femsa.test', N'denegado', N'10.0.0.77', N'Chrome 140', N'America/Monterrey', DATEADD(HOUR,-2,SYSUTCDATETIME()));
