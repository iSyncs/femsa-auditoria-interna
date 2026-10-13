/* =====================================================================
   FEMSA - Sistema de Auditoría Interna | Equipo 2 "Mesa para 7"
   Modelo de datos - Alcance: EJECUCIÓN, CIERRE y SEGUIMIENTO
   Motor: Microsoft SQL Server 2019+ / Azure SQL Database
   Versión: v2.1.0

   Cambios v2.1.0 (revisión técnica + retroalimentación del SRS):
   - Script re-ejecutable (DROP IF EXISTS en orden inverso).
   - Catálogo de riesgos (riesgos) y FK desde controles -> habilita
     la regla "sin riesgos huérfanos".
   - Dirección en usuarios y unidades de negocio + participantes por
     auditoría -> Row-Level Security: el auditado sólo ve SUS auditorías.
   - Estados alineados a los flujos de Archer (procedimientos, hallazgos,
     planes de remediación).
   - Folios de negocio generados por SEQUENCE (AUD-, AP-, FND-, RP-,
     SOPORTE-######), sobreescribibles al migrar históricos de Archer.
   - Evidencias: al menos un padre obligatorio, hash SHA-256 por archivo
     y folio hijo para archivos contenidos en un ZIP.
   - Bloqueo post-cierre en BD (triggers), no sólo en la interfaz.
   - Bitácora de operaciones + historial de accesos (login), con zona
     horaria IANA del usuario. Todas las fechas se guardan en UTC.
   - Validación de texto significativo (CHECK de longitud tras TRIM).
   - Índices en todas las llaves foráneas de consulta frecuente.

   Convención:
   - PK sustituta: INT IDENTITY (id)
   - Llave de negocio Archer en columna "tracking_id" UNIQUE
   - Fechas del sistema en UTC (DATETIME2 + SYSUTCDATETIME())
   ===================================================================== */

IF SCHEMA_ID(N'aud') IS NULL EXEC(N'CREATE SCHEMA aud');
GO

/* ------------------------- LIMPIEZA (re-ejecutable) ------------------ */
DROP TABLE IF EXISTS aud.historial_accesos;
DROP TABLE IF EXISTS aud.bitacora;
DROP TABLE IF EXISTS aud.notificaciones;
DROP TABLE IF EXISTS aud.solicitudes_excepcion;
DROP TABLE IF EXISTS aud.avances_plan;
DROP TABLE IF EXISTS aud.planes_remediacion;
DROP TABLE IF EXISTS aud.cierre_auditoria;
DROP TABLE IF EXISTS aud.aprobaciones;
DROP TABLE IF EXISTS aud.evidencias;
DROP TABLE IF EXISTS aud.hallazgos;
DROP TABLE IF EXISTS aud.solicitudes_pbc;
DROP TABLE IF EXISTS aud.procedimientos_auditoria;
DROP TABLE IF EXISTS aud.controles;
DROP TABLE IF EXISTS aud.riesgos;
DROP TABLE IF EXISTS aud.auditoria_participantes;
DROP TABLE IF EXISTS aud.auditorias;
DROP TABLE IF EXISTS aud.usuarios;
DROP TABLE IF EXISTS aud.unidades_negocio;
DROP TABLE IF EXISTS aud.roles;
DROP SEQUENCE IF EXISTS aud.seq_aud;
DROP SEQUENCE IF EXISTS aud.seq_ap;
DROP SEQUENCE IF EXISTS aud.seq_pbc;
DROP SEQUENCE IF EXISTS aud.seq_fnd;
DROP SEQUENCE IF EXISTS aud.seq_rp;
DROP SEQUENCE IF EXISTS aud.seq_soporte;
DROP SEQUENCE IF EXISTS aud.seq_exc;
GO

/* ------------------- SECUENCIAS DE FOLIOS DE NEGOCIO ---------------- */
CREATE SEQUENCE aud.seq_aud     AS INT START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE aud.seq_ap      AS INT START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE aud.seq_pbc     AS INT START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE aud.seq_fnd     AS INT START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE aud.seq_rp      AS INT START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE aud.seq_soporte AS INT START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE aud.seq_exc     AS INT START WITH 1 INCREMENT BY 1;
GO

/* --------------------------- SEGURIDAD / RBAC ----------------------- */
CREATE TABLE aud.roles (
    id            INT IDENTITY(1,1) CONSTRAINT PK_roles PRIMARY KEY,
    clave         NVARCHAR(30)  NOT NULL CONSTRAINT UQ_roles_clave UNIQUE,  -- auditor, lider, jefe, gerente, director, grc, auditado, admin
    nombre        NVARCHAR(80)  NOT NULL CONSTRAINT UQ_roles_nombre UNIQUE,
    descripcion   NVARCHAR(300) NULL
);

/* ------------------ CATÁLOGO ORGANIZACIONAL (FEMSA) ----------------- */
CREATE TABLE aud.unidades_negocio (
    id            INT IDENTITY(1,1) CONSTRAINT PK_unidades_negocio PRIMARY KEY,
    clave         NVARCHAR(30)  NOT NULL CONSTRAINT UQ_udn_clave UNIQUE,   -- UDN-####
    unidad        NVARCHAR(120) NOT NULL,          -- KOF, OXXO, Spin...
    direccion     NVARCHAR(40)  NOT NULL,          -- Retail & Spin | Bebidas
    division      NVARCHAR(120) NULL,
    area          NVARCHAR(120) NULL,
    pais          NVARCHAR(80)  NULL,
    zona_horaria  NVARCHAR(64)  NOT NULL CONSTRAINT DF_udn_tz DEFAULT (N'America/Mexico_City'), -- IANA: vencimientos
    CONSTRAINT CK_udn_direccion CHECK (direccion IN (N'Retail & Spin', N'Bebidas'))
);

CREATE TABLE aud.usuarios (
    id                INT IDENTITY(1,1) CONSTRAINT PK_usuarios PRIMARY KEY,
    nombre            NVARCHAR(150) NOT NULL,
    correo            NVARCHAR(180) NOT NULL CONSTRAINT UQ_usuarios_correo UNIQUE,  -- login SSO (Entra ID)
    rol_id            INT           NOT NULL,
    direccion         NVARCHAR(40)  NULL,          -- NULL = transversal (Director / Admin)
    unidad_negocio_id INT           NULL,          -- para auditados y GRC
    zona_horaria      NVARCHAR(64)  NOT NULL CONSTRAINT DF_usuarios_tz DEFAULT (N'America/Mexico_City'),
    activo            BIT           NOT NULL CONSTRAINT DF_usuarios_activo DEFAULT (1),
    CONSTRAINT FK_usuarios_rol FOREIGN KEY (rol_id) REFERENCES aud.roles(id),
    CONSTRAINT FK_usuarios_udn FOREIGN KEY (unidad_negocio_id) REFERENCES aud.unidades_negocio(id),
    CONSTRAINT CK_usuarios_direccion CHECK (direccion IS NULL OR direccion IN (N'Retail & Spin', N'Bebidas'))
);

/* ============================ EJECUCIÓN ============================= */
CREATE TABLE aud.auditorias (
    id                INT IDENTITY(1,1) CONSTRAINT PK_auditorias PRIMARY KEY,
    tracking_id       NVARCHAR(30)  NOT NULL CONSTRAINT UQ_auditorias_tracking UNIQUE
                      CONSTRAINT DF_auditorias_tracking DEFAULT (N'AUD-' + RIGHT(N'000000' + CAST(NEXT VALUE FOR aud.seq_aud AS NVARCHAR(10)), 6)),
    nombre            NVARCHAR(200) NOT NULL,
    objetivo          NVARCHAR(MAX) NULL,
    unidad_negocio_id INT           NOT NULL,
    tipo              NVARCHAR(40)  NULL,            -- Operativa, Financiera, Cybersecurity, Cumplimiento
    area              NVARCHAR(120) NULL,
    prioridad         NVARCHAR(10)  NOT NULL CONSTRAINT DF_auditorias_prioridad DEFAULT (N'Media'),
    lider_id          INT           NOT NULL,          -- Auditor Líder responsable
    estado            NVARCHAR(20)  NOT NULL CONSTRAINT DF_auditorias_estado DEFAULT (N'pendiente'),
    fecha_inicio      DATE          NULL,
    fecha_fin         DATE          NULL,
    creado_en         DATETIME2(0)  NOT NULL CONSTRAINT DF_auditorias_creado DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_auditorias_udn   FOREIGN KEY (unidad_negocio_id) REFERENCES aud.unidades_negocio(id),
    CONSTRAINT FK_auditorias_lider FOREIGN KEY (lider_id)          REFERENCES aud.usuarios(id),
    CONSTRAINT CK_auditorias_estado    CHECK (estado IN (N'pendiente',N'en_ejecucion',N'en_aprobacion',N'cerrada')),
    CONSTRAINT CK_auditorias_prioridad CHECK (prioridad IN (N'Alta',N'Media',N'Baja')),
    CONSTRAINT CK_auditorias_nombre    CHECK (LEN(LTRIM(RTRIM(nombre))) >= 5),
    CONSTRAINT CK_auditorias_fechas    CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

/* Quién participa en cada auditoría (auditados/enlaces) -> RLS del auditado */
CREATE TABLE aud.auditoria_participantes (
    auditoria_id  INT NOT NULL,
    usuario_id    INT NOT NULL,
    papel         NVARCHAR(30) NOT NULL CONSTRAINT DF_part_papel DEFAULT (N'enlace'), -- enlace | responsable | auditor
    CONSTRAINT PK_auditoria_participantes PRIMARY KEY (auditoria_id, usuario_id),
    CONSTRAINT FK_part_auditoria FOREIGN KEY (auditoria_id) REFERENCES aud.auditorias(id),
    CONSTRAINT FK_part_usuario   FOREIGN KEY (usuario_id)   REFERENCES aud.usuarios(id)
);

/* Risk Library / Risk Register (antes: texto libre en controles) */
CREATE TABLE aud.riesgos (
    id              INT IDENTITY(1,1) CONSTRAINT PK_riesgos PRIMARY KEY,
    tracking_id     NVARCHAR(30)  NOT NULL CONSTRAINT UQ_riesgos_tracking UNIQUE,  -- RSK-######
    nombre          NVARCHAR(200) NOT NULL,
    categoria       NVARCHAR(60)  NULL,
    nivel_inherente NVARCHAR(10)  NULL,
    CONSTRAINT CK_riesgos_nivel CHECK (nivel_inherente IS NULL OR nivel_inherente IN (N'Bajo',N'Moderado',N'Alto',N'Crítico'))
);

CREATE TABLE aud.controles (
    id              INT IDENTITY(1,1) CONSTRAINT PK_controles PRIMARY KEY,
    tracking_id     NVARCHAR(30)  NOT NULL CONSTRAINT UQ_controles_tracking UNIQUE,  -- CP-######
    nombre          NVARCHAR(200) NOT NULL,
    dominio         NVARCHAR(60)  NULL,
    riesgo_id       INT           NOT NULL,                  -- todo control mitiga un riesgo
    CONSTRAINT FK_controles_riesgo FOREIGN KEY (riesgo_id) REFERENCES aud.riesgos(id)
);

/* Audit Procedures = evaluación de un control dentro de una auditoría */
CREATE TABLE aud.procedimientos_auditoria (
    id                  INT IDENTITY(1,1) CONSTRAINT PK_procedimientos PRIMARY KEY,
    tracking_id         NVARCHAR(30)  NOT NULL CONSTRAINT UQ_proc_tracking UNIQUE
                        CONSTRAINT DF_proc_tracking DEFAULT (N'AP-' + RIGHT(N'000000' + CAST(NEXT VALUE FOR aud.seq_ap AS NVARCHAR(10)), 6)),
    auditoria_id        INT           NOT NULL,
    control_id          INT           NOT NULL,
    auditor_id          INT           NULL,
    estado              NVARCHAR(20)  NOT NULL CONSTRAINT DF_proc_estado DEFAULT (N'abierto'),  -- Archer: Open..Supervised
    calif_diseno        NVARCHAR(20)  NULL,            -- escala CMMI
    calif_efectividad   NVARCHAR(20)  NULL,
    vulnerabilidad      NVARCHAR(10)  NULL,            -- Bajo | Moderado | Alto
    aplica_hallazgo     BIT           NOT NULL CONSTRAINT DF_proc_aplica DEFAULT (0),
    comentarios         NVARCHAR(MAX) NULL,
    fecha_evaluacion    DATETIME2(0)  NULL,            -- UTC
    CONSTRAINT FK_proc_auditoria FOREIGN KEY (auditoria_id) REFERENCES aud.auditorias(id),
    CONSTRAINT FK_proc_control   FOREIGN KEY (control_id)   REFERENCES aud.controles(id),
    CONSTRAINT FK_proc_auditor   FOREIGN KEY (auditor_id)   REFERENCES aud.usuarios(id),
    CONSTRAINT CK_proc_estado       CHECK (estado IN (N'abierto',N'evaluado',N'revisado',N'supervisado',N'rechazado')),
    CONSTRAINT CK_proc_diseno       CHECK (calif_diseno      IS NULL OR calif_diseno      IN (N'Inicial',N'Funcional',N'Definido',N'Administrado',N'Optimizado')),
    CONSTRAINT CK_proc_efectividad  CHECK (calif_efectividad IS NULL OR calif_efectividad IN (N'Inicial',N'Funcional',N'Definido',N'Administrado',N'Optimizado')),
    CONSTRAINT CK_proc_vulnerab     CHECK (vulnerabilidad    IS NULL OR vulnerabilidad    IN (N'Bajo',N'Moderado',N'Alto')),
    -- Efectividad deficiente exige justificación con texto real (>= 20 caracteres)
    CONSTRAINT CK_proc_justifica    CHECK (calif_efectividad IS NULL OR calif_efectividad NOT IN (N'Inicial',N'Funcional')
                                           OR LEN(LTRIM(RTRIM(ISNULL(comentarios, N'')))) >= 20)
);

/* PBC = Provided By Client (requerimientos de información al auditado) */
CREATE TABLE aud.solicitudes_pbc (
    id                  INT IDENTITY(1,1) CONSTRAINT PK_pbc PRIMARY KEY,
    tracking_id         NVARCHAR(30)  NOT NULL CONSTRAINT UQ_pbc_tracking UNIQUE
                        CONSTRAINT DF_pbc_tracking DEFAULT (N'PBC-' + RIGHT(N'000000' + CAST(NEXT VALUE FOR aud.seq_pbc AS NVARCHAR(10)), 6)),
    procedimiento_id    INT           NOT NULL,
    documento           NVARCHAR(300) NOT NULL,
    responsable_id      INT           NULL,            -- enlace auditado
    fecha_limite        DATE          NULL,
    estado              NVARCHAR(20)  NOT NULL CONSTRAINT DF_pbc_estado DEFAULT (N'solicitado'),
    solicitado_por_id   INT           NULL,
    fecha_solicitud     DATETIME2(0)  NOT NULL CONSTRAINT DF_pbc_fecha DEFAULT (SYSUTCDATETIME()),
    zona_horaria        NVARCHAR(64)  NULL,            -- zona del remitente
    CONSTRAINT FK_pbc_proc      FOREIGN KEY (procedimiento_id)  REFERENCES aud.procedimientos_auditoria(id),
    CONSTRAINT FK_pbc_resp      FOREIGN KEY (responsable_id)    REFERENCES aud.usuarios(id),
    CONSTRAINT FK_pbc_solicita  FOREIGN KEY (solicitado_por_id) REFERENCES aud.usuarios(id),
    CONSTRAINT CK_pbc_estado    CHECK (estado IN (N'borrador',N'solicitado',N'en_proceso',N'recibido',N'supervisado',N'rechazado'))
);

/* HALLAZGOS (registro metodológico: condición/criterio/causa/efecto) */
CREATE TABLE aud.hallazgos (
    id                  INT IDENTITY(1,1) CONSTRAINT PK_hallazgos PRIMARY KEY,
    tracking_id         NVARCHAR(30)  NOT NULL CONSTRAINT UQ_hallazgos_tracking UNIQUE
                        CONSTRAINT DF_hallazgos_tracking DEFAULT (N'FND-' + RIGHT(N'000000' + CAST(NEXT VALUE FOR aud.seq_fnd AS NVARCHAR(10)), 6)),
    auditoria_id        INT           NOT NULL,
    procedimiento_id    INT           NULL,
    titulo              NVARCHAR(200) NOT NULL,
    condicion           NVARCHAR(MAX) NOT NULL,
    criterio            NVARCHAR(MAX) NOT NULL,
    causa               NVARCHAR(MAX) NOT NULL,
    efecto              NVARCHAR(MAX) NOT NULL,
    recomendacion       NVARCHAR(MAX) NOT NULL,
    severidad           NVARCHAR(10)  NOT NULL,        -- Baja, Moderada, Alta, Crítica
    tipo                NVARCHAR(40)  NOT NULL,        -- Debilidad de control | Debilidad menor
    riesgo_residual     NVARCHAR(10)  NULL,
    impacto_mxn         DECIMAL(18,2) NULL,
    estado              NVARCHAR(30)  NOT NULL CONSTRAINT DF_hallazgos_estado DEFAULT (N'abierto'),
    responsable_id      INT           NULL,
    fecha_identificacion DATETIME2(0) NOT NULL CONSTRAINT DF_hallazgos_fecha DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_hallazgo_auditoria FOREIGN KEY (auditoria_id)     REFERENCES aud.auditorias(id),
    CONSTRAINT FK_hallazgo_proc      FOREIGN KEY (procedimiento_id) REFERENCES aud.procedimientos_auditoria(id),
    CONSTRAINT FK_hallazgo_resp      FOREIGN KEY (responsable_id)   REFERENCES aud.usuarios(id),
    CONSTRAINT CK_hallazgo_severidad CHECK (severidad IN (N'Baja',N'Moderada',N'Alta',N'Crítica')),
    CONSTRAINT CK_hallazgo_tipo      CHECK (tipo IN (N'Debilidad de control',N'Debilidad menor')),
    CONSTRAINT CK_hallazgo_residual  CHECK (riesgo_residual IS NULL OR riesgo_residual IN (N'Bajo',N'Moderado',N'Alto',N'Crítico')),
    -- Archer: Open -> Awaiting Chief Review -> Awaiting Manager Review -> Awaiting Action Plan -> Closed
    CONSTRAINT CK_hallazgo_estado    CHECK (estado IN (N'abierto',N'revision_jefe',N'revision_gerente',N'esperando_plan',N'en_seguimiento',N'solventado',N'rechazado')),
    CONSTRAINT CK_hallazgo_titulo    CHECK (LEN(LTRIM(RTRIM(titulo))) >= 5),
    CONSTRAINT CK_hallazgo_condicion CHECK (LEN(LTRIM(RTRIM(condicion))) >= 20),
    CONSTRAINT CK_hallazgo_causa     CHECK (LEN(LTRIM(RTRIM(causa))) >= 10),
    CONSTRAINT CK_hallazgo_recom     CHECK (LEN(LTRIM(RTRIM(recomendacion))) >= 10)
);

/* EVIDENCIAS (Evidence Repository -> Azure Blob Storage con SAS) */
CREATE TABLE aud.evidencias (
    id                  INT IDENTITY(1,1) CONSTRAINT PK_evidencias PRIMARY KEY,
    tracking_id         NVARCHAR(40)  NOT NULL CONSTRAINT UQ_evidencias_tracking UNIQUE
                        CONSTRAINT DF_evidencias_tracking DEFAULT (N'SOPORTE-' + RIGHT(N'000000' + CAST(NEXT VALUE FOR aud.seq_soporte AS NVARCHAR(10)), 6)),
    evidencia_padre_id  INT           NULL,            -- archivo contenido en un ZIP -> SOPORTE-######-NNN
    procedimiento_id    INT           NULL,
    solicitud_pbc_id    INT           NULL,
    hallazgo_id         INT           NULL,
    nombre_archivo      NVARCHAR(255) NOT NULL,
    blob_url            NVARCHAR(1000) NULL,           -- ruta en Blob (el SAS se genera al consultar)
    tipo_mime           NVARCHAR(100) NULL,
    tamano_bytes        BIGINT        NULL,
    hash_sha256         CHAR(64)      NULL,            -- integridad por archivo (sellado del expediente)
    cargado_por_id      INT           NOT NULL,
    fecha_carga         DATETIME2(0)  NOT NULL CONSTRAINT DF_evidencia_fecha DEFAULT (SYSUTCDATETIME()),
    eliminado           BIT           NOT NULL CONSTRAINT DF_evidencia_eliminado DEFAULT (0),   -- borrado lógico (180 días)
    CONSTRAINT FK_evidencia_padre    FOREIGN KEY (evidencia_padre_id) REFERENCES aud.evidencias(id),
    CONSTRAINT FK_evidencia_proc     FOREIGN KEY (procedimiento_id) REFERENCES aud.procedimientos_auditoria(id),
    CONSTRAINT FK_evidencia_pbc      FOREIGN KEY (solicitud_pbc_id) REFERENCES aud.solicitudes_pbc(id),
    CONSTRAINT FK_evidencia_hallazgo FOREIGN KEY (hallazgo_id)      REFERENCES aud.hallazgos(id),
    CONSTRAINT FK_evidencia_usuario  FOREIGN KEY (cargado_por_id)   REFERENCES aud.usuarios(id),
    CONSTRAINT CK_evidencia_padre    CHECK (evidencia_padre_id IS NOT NULL OR procedimiento_id IS NOT NULL
                                            OR solicitud_pbc_id IS NOT NULL OR hallazgo_id IS NOT NULL)
);

/* ============================== CIERRE ============================== */
/* Flujo de aprobación multinivel: Jefe -> Gerente -> Director */
CREATE TABLE aud.aprobaciones (
    id              INT IDENTITY(1,1) CONSTRAINT PK_aprobaciones PRIMARY KEY,
    auditoria_id    INT           NOT NULL,
    secuencia       INT           NOT NULL,            -- 1,2,3
    nivel           NVARCHAR(30)  NOT NULL,            -- jefe | gerente | director
    aprobador_id    INT           NULL,
    decision        NVARCHAR(20)  NOT NULL CONSTRAINT DF_aprob_decision DEFAULT (N'pendiente'),
    comentarios     NVARCHAR(MAX) NULL,
    fecha_decision  DATETIME2(0)  NULL,                -- UTC
    zona_horaria    NVARCHAR(64)  NULL,
    CONSTRAINT FK_aprob_auditoria FOREIGN KEY (auditoria_id) REFERENCES aud.auditorias(id),
    CONSTRAINT FK_aprob_usuario   FOREIGN KEY (aprobador_id) REFERENCES aud.usuarios(id),
    CONSTRAINT CK_aprob_nivel     CHECK (nivel IN (N'jefe',N'gerente',N'director')),
    CONSTRAINT CK_aprob_decision  CHECK (decision IN (N'pendiente',N'aprobado',N'rechazado')),
    -- rechazo exige comentario real
    CONSTRAINT CK_aprob_comentario CHECK (decision <> N'rechazado' OR LEN(LTRIM(RTRIM(ISNULL(comentarios, N'')))) >= 20),
    CONSTRAINT UQ_aprob_secuencia UNIQUE (auditoria_id, secuencia)
);

/* Cierre e inmutabilidad (manifiesto + SHA-256 + sello UTC) */
CREATE TABLE aud.cierre_auditoria (
    id              INT IDENTITY(1,1) CONSTRAINT PK_cierre PRIMARY KEY,
    auditoria_id    INT           NOT NULL CONSTRAINT UQ_cierre_auditoria UNIQUE,  -- 0..1 por auditoría
    cerrado_por_id  INT           NOT NULL,
    sello_temporal  DATETIME2(3)  NOT NULL CONSTRAINT DF_cierre_sello DEFAULT (SYSUTCDATETIME()),  -- UTC
    algoritmo       NVARCHAR(20)  NOT NULL CONSTRAINT DF_cierre_alg DEFAULT (N'SHA-256'),
    hash_integridad CHAR(64)      NOT NULL,            -- SHA-256 del manifiesto canónico
    manifiesto      NVARCHAR(MAX) NOT NULL,            -- JSON canónico sellado
    firma           NVARCHAR(MAX) NULL,                -- firma con llave de Azure Key Vault (fase siguiente)
    CONSTRAINT FK_cierre_auditoria FOREIGN KEY (auditoria_id)   REFERENCES aud.auditorias(id),
    CONSTRAINT FK_cierre_usuario   FOREIGN KEY (cerrado_por_id) REFERENCES aud.usuarios(id)
);

/* =========================== SEGUIMIENTO ============================ */
CREATE TABLE aud.planes_remediacion (
    id              INT IDENTITY(1,1) CONSTRAINT PK_planes PRIMARY KEY,
    tracking_id     NVARCHAR(30)  NOT NULL CONSTRAINT UQ_planes_tracking UNIQUE
                    CONSTRAINT DF_planes_tracking DEFAULT (N'RP-' + RIGHT(N'000000' + CAST(NEXT VALUE FOR aud.seq_rp AS NVARCHAR(10)), 6)),
    hallazgo_id     INT           NOT NULL,
    descripcion     NVARCHAR(MAX) NOT NULL,
    responsable_id  INT           NOT NULL,
    fecha_compromiso DATE         NOT NULL,            -- vence 23:59:59 en la zona de la UdN
    monto_mxn       DECIMAL(18,2) NULL,
    estado          NVARCHAR(20)  NOT NULL CONSTRAINT DF_plan_estado DEFAULT (N'abierto'),
    avance_pct      INT           NOT NULL CONSTRAINT DF_plan_avance DEFAULT (0),
    fecha_conclusion DATETIME2(0) NULL,               -- cuando llegó a 100%
    CONSTRAINT FK_plan_hallazgo    FOREIGN KEY (hallazgo_id)    REFERENCES aud.hallazgos(id),
    CONSTRAINT FK_plan_responsable FOREIGN KEY (responsable_id) REFERENCES aud.usuarios(id),
    -- Archer: Open -> Awaiting GRC Review -> Awaiting Chief Review -> Reassessing -> Closed (+ Rejected)
    CONSTRAINT CK_plan_estado  CHECK (estado IN (N'abierto',N'en_progreso',N'revision_grc',N'revision_jefe',N'reevaluando',N'cerrado',N'rechazado')),
    CONSTRAINT CK_plan_avance  CHECK (avance_pct BETWEEN 0 AND 100),
    CONSTRAINT CK_plan_descr   CHECK (LEN(LTRIM(RTRIM(descripcion))) >= 20)
);

/* Historial cronológico de avances (HU_10) */
CREATE TABLE aud.avances_plan (
    id                  INT IDENTITY(1,1) CONSTRAINT PK_avances PRIMARY KEY,
    plan_id             INT           NOT NULL,
    avance_pct          INT           NOT NULL,
    comentario          NVARCHAR(MAX) NOT NULL,
    evidencia_id        INT           NULL,
    actualizado_por_id  INT           NOT NULL,
    fecha               DATETIME2(0)  NOT NULL CONSTRAINT DF_avance_fecha DEFAULT (SYSUTCDATETIME()),
    zona_horaria        NVARCHAR(64)  NULL,
    CONSTRAINT FK_avance_plan      FOREIGN KEY (plan_id)            REFERENCES aud.planes_remediacion(id),
    CONSTRAINT FK_avance_evidencia FOREIGN KEY (evidencia_id)       REFERENCES aud.evidencias(id),
    CONSTRAINT FK_avance_usuario   FOREIGN KEY (actualizado_por_id) REFERENCES aud.usuarios(id),
    CONSTRAINT CK_avance_pct       CHECK (avance_pct BETWEEN 0 AND 100),
    CONSTRAINT CK_avance_coment    CHECK (LEN(LTRIM(RTRIM(comentario))) >= 10)
);

/* Solicitudes de excepción (alternativa a un plan de remediación) */
CREATE TABLE aud.solicitudes_excepcion (
    id                  INT IDENTITY(1,1) CONSTRAINT PK_excepciones PRIMARY KEY,
    tracking_id         NVARCHAR(30)  NOT NULL CONSTRAINT UQ_exc_tracking UNIQUE
                        CONSTRAINT DF_exc_tracking DEFAULT (N'EXC-' + RIGHT(N'000000' + CAST(NEXT VALUE FOR aud.seq_exc AS NVARCHAR(10)), 6)),
    hallazgo_id         INT           NOT NULL CONSTRAINT UQ_exc_hallazgo UNIQUE,   -- 0..1 por hallazgo
    justificacion       NVARCHAR(MAX) NOT NULL,
    solicitado_por_id   INT           NULL,
    estado              NVARCHAR(20)  NOT NULL CONSTRAINT DF_exc_estado DEFAULT (N'pendiente'),
    aprobador_id        INT           NULL,
    fecha_resolucion    DATETIME2(0)  NULL,
    CONSTRAINT FK_exc_hallazgo   FOREIGN KEY (hallazgo_id)       REFERENCES aud.hallazgos(id),
    CONSTRAINT FK_exc_solicita   FOREIGN KEY (solicitado_por_id) REFERENCES aud.usuarios(id),
    CONSTRAINT FK_exc_aprobador  FOREIGN KEY (aprobador_id)      REFERENCES aud.usuarios(id),
    CONSTRAINT CK_exc_estado     CHECK (estado IN (N'pendiente',N'aprobada',N'rechazada'))
);

/* Alertas y notificaciones (15/5/1 día + escalamiento) */
CREATE TABLE aud.notificaciones (
    id              INT IDENTITY(1,1) CONSTRAINT PK_notificaciones PRIMARY KEY,
    usuario_id      INT           NOT NULL,
    plan_id         INT           NULL,
    auditoria_id    INT           NULL,
    tipo            NVARCHAR(40)  NOT NULL,            -- vencimiento_15|5|1, escalamiento, asignacion, rechazo_cierre
    mensaje         NVARCHAR(500) NULL,
    canal           NVARCHAR(20)  NOT NULL CONSTRAINT DF_notif_canal DEFAULT (N'plataforma'),
    fecha_programada DATETIME2(0) NULL,
    fecha_envio     DATETIME2(0)  NULL,
    leida           BIT           NOT NULL CONSTRAINT DF_notif_leida DEFAULT (0),
    CONSTRAINT FK_notif_usuario   FOREIGN KEY (usuario_id)   REFERENCES aud.usuarios(id),
    CONSTRAINT FK_notif_plan      FOREIGN KEY (plan_id)      REFERENCES aud.planes_remediacion(id),
    CONSTRAINT FK_notif_auditoria FOREIGN KEY (auditoria_id) REFERENCES aud.auditorias(id),
    CONSTRAINT CK_notif_canal     CHECK (canal IN (N'plataforma',N'correo'))
);

/* ===================== BITÁCORAS AUDITABLES (retención) ============= */
/* History Log de operaciones (90 días en línea -> almacén corporativo) */
CREATE TABLE aud.bitacora (
    id            BIGINT IDENTITY(1,1) CONSTRAINT PK_bitacora PRIMARY KEY,
    entidad       NVARCHAR(60)  NOT NULL,             -- tabla afectada
    entidad_id    INT           NULL,
    folio         NVARCHAR(40)  NULL,                 -- AUD-/FND-/RP-...
    accion        NVARCHAR(30)  NOT NULL,             -- CREAR, ACTUALIZAR, ELIMINAR, APROBAR, RECHAZAR, CERRAR, EXPORTAR
    usuario_id    INT           NULL,
    detalle       NVARCHAR(MAX) NULL,                 -- JSON valores anterior/nuevo
    ip            NVARCHAR(45)  NULL,
    zona_horaria  NVARCHAR(64)  NULL,                 -- IANA del usuario
    fecha         DATETIME2(3)  NOT NULL CONSTRAINT DF_bitacora_fecha DEFAULT (SYSUTCDATETIME()),  -- UTC
    CONSTRAINT FK_bitacora_usuario FOREIGN KEY (usuario_id) REFERENCES aud.usuarios(id)
);

/* Login History (30 días en línea -> almacén corporativo) */
CREATE TABLE aud.historial_accesos (
    id            BIGINT IDENTITY(1,1) CONSTRAINT PK_historial_accesos PRIMARY KEY,
    usuario_id    INT           NULL,
    correo        NVARCHAR(180) NULL,
    resultado     NVARCHAR(20)  NOT NULL,             -- exito | fallo | denegado | cierre_sesion
    ip            NVARCHAR(45)  NULL,
    agente        NVARCHAR(300) NULL,                 -- navegador
    zona_horaria  NVARCHAR(64)  NULL,
    fecha         DATETIME2(3)  NOT NULL CONSTRAINT DF_accesos_fecha DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_accesos_usuario FOREIGN KEY (usuario_id) REFERENCES aud.usuarios(id),
    CONSTRAINT CK_accesos_resultado CHECK (resultado IN (N'exito',N'fallo',N'denegado',N'cierre_sesion'))
);

/* ----------------------------- ÍNDICES ----------------------------- */
CREATE INDEX IX_usuarios_rol           ON aud.usuarios(rol_id);
CREATE INDEX IX_auditorias_udn         ON aud.auditorias(unidad_negocio_id);
CREATE INDEX IX_auditorias_lider       ON aud.auditorias(lider_id);
CREATE INDEX IX_auditorias_estado      ON aud.auditorias(estado);
CREATE INDEX IX_part_usuario           ON aud.auditoria_participantes(usuario_id);
CREATE INDEX IX_controles_riesgo       ON aud.controles(riesgo_id);
CREATE INDEX IX_proc_auditoria         ON aud.procedimientos_auditoria(auditoria_id);
CREATE INDEX IX_proc_control           ON aud.procedimientos_auditoria(control_id);
CREATE INDEX IX_pbc_procedimiento      ON aud.solicitudes_pbc(procedimiento_id);
CREATE INDEX IX_hallazgo_auditoria     ON aud.hallazgos(auditoria_id);
CREATE INDEX IX_hallazgo_estado        ON aud.hallazgos(estado);
CREATE INDEX IX_evidencia_proc         ON aud.evidencias(procedimiento_id);
CREATE INDEX IX_evidencia_hallazgo     ON aud.evidencias(hallazgo_id);
CREATE INDEX IX_evidencia_padre        ON aud.evidencias(evidencia_padre_id);
CREATE INDEX IX_plan_hallazgo          ON aud.planes_remediacion(hallazgo_id);
CREATE INDEX IX_plan_estado            ON aud.planes_remediacion(estado);
CREATE INDEX IX_avance_plan            ON aud.avances_plan(plan_id);
CREATE INDEX IX_notif_usuario          ON aud.notificaciones(usuario_id);
CREATE INDEX IX_bitacora_entidad       ON aud.bitacora(entidad, entidad_id);
CREATE INDEX IX_bitacora_fecha         ON aud.bitacora(fecha);
CREATE INDEX IX_accesos_fecha          ON aud.historial_accesos(fecha);
GO

/* ================== INMUTABILIDAD POST-CIERRE (HU_08) ================ */
/* La BD rechaza cambios sobre expedientes cerrados, aunque la UI falle. */
CREATE OR ALTER TRIGGER aud.TR_hallazgos_bloqueo_cierre
ON aud.hallazgos AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM (SELECT auditoria_id FROM inserted UNION SELECT auditoria_id FROM deleted) x
                   JOIN aud.auditorias a ON a.id = x.auditoria_id WHERE a.estado = N'cerrada')
        RETURN;
    -- Tras el cierre sólo se permite actualizar el estado de seguimiento (solventación);
    -- altas, bajas y cambios al contenido metodológico se rechazan.
    IF NOT EXISTS (SELECT 1 FROM inserted) OR NOT EXISTS (SELECT 1 FROM deleted)
       OR UPDATE(titulo) OR UPDATE(condicion) OR UPDATE(criterio) OR UPDATE(causa)
       OR UPDATE(efecto) OR UPDATE(recomendacion) OR UPDATE(severidad) OR UPDATE(tipo)
       OR UPDATE(auditoria_id) OR UPDATE(procedimiento_id)
        THROW 51000, N'Expediente cerrado: el hallazgo es de solo lectura.', 1;
END;
GO

CREATE OR ALTER TRIGGER aud.TR_procedimientos_bloqueo_cierre
ON aud.procedimientos_auditoria AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM (SELECT auditoria_id FROM inserted UNION SELECT auditoria_id FROM deleted) x
               JOIN aud.auditorias a ON a.id = x.auditoria_id WHERE a.estado = N'cerrada')
        THROW 51001, N'Expediente cerrado: los procedimientos son de solo lectura.', 1;
END;
GO

CREATE OR ALTER TRIGGER aud.TR_cierre_inmutable
ON aud.cierre_auditoria AFTER UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    THROW 51002, N'El sello de cierre es inmutable.', 1;
END;
GO

CREATE OR ALTER TRIGGER aud.TR_bitacora_solo_agregar
ON aud.bitacora AFTER UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    -- Sólo el job de retención (que antes archiva al almacén corporativo) puede depurar:
    -- EXEC sp_set_session_context N'purga_retencion', 1;
    IF ISNULL(CAST(SESSION_CONTEXT(N'purga_retencion') AS INT), 0) <> 1
        THROW 51003, N'La bitácora es de solo agregar.', 1;
END;
GO
