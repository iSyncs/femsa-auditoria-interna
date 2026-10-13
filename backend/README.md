# Backend — API REST con NestJS

API del Sistema de Auditoría Interna FEMSA (Equipo 2). Está hecha con **NestJS 12 + TypeScript** y por ahora **trabaja sin base de datos**: usa datos de demostración en memoria detrás de una capa de repositorios, para que después se conecte a Azure SQL sin tocar controladores ni servicios.

| Tecnología | Versión |
|---|---|
| Node.js | ≥ 20.11 (probado en 26.8) |
| NestJS | 12.1 |
| TypeScript | 5.9 |
| Validación | class-validator 0.15 |
| Documentación | @nestjs/swagger 12 → `/api/docs` |
| Pruebas | Jest 30 + Supertest |

## Ejecutar

```bash
npm install
npm run dev          # http://localhost:4000/api  ·  Swagger: http://localhost:4000/api/docs
npm test             # pruebas unitarias
npm run test:e2e     # pruebas de punta a punta de la API
npm run build        # compila a dist/
```

Los datos en memoria se reinician cada vez que se levanta la API.

## Arquitectura

```
src/
├── main.ts / configurar-app.ts   Arranque: prefijo /api, CORS, validación, errores y Swagger
├── app.module.ts                 Registra un módulo por dominio
├── common/                       Validación de texto real, filtro de errores, utilidades (fechas, hash)
├── datos/                        CAPA DE DATOS
│   ├── modelos.ts                Tipos de las tablas (espejo de sql/femsa_auditoria_sqlserver.sql)
│   ├── repositorios/             Repositorios abstractos (contratos) + vistas
│   ├── memoria/                  Implementación en memoria + datos de demostración
│   └── datos.module.ts           Elige la implementación (hoy: memoria)
├── auth/                         HU_01: guard de sesión, @Roles, @Publico, seguridad por fila
├── sistema/                      health, usuarios, sesión, catálogos
├── auditorias/                   Listado, alta y expediente de auditoría
├── cierre/                       HU_06 pre-cierre · HU_07 firmas · HU_08 sellado SHA-256
├── hallazgos/                    HU_04 registro metodológico
└── planes/                       HU_10 avances y semáforo
```

**Flujo de una petición:** `Controller` (ruta, roles, DTO validado) → `Service` (reglas de negocio y seguridad por fila) → `Repository` abstracto → implementación en memoria (mañana Azure SQL).

**Seguridad:** todas las rutas requieren sesión, salvo las marcadas con `@Publico()`. Los roles se declaran con `@Roles('jefe','gerente')`. La visibilidad por fila la resuelve `AccesoService`: el Director ve todo; el auditado, solo sus auditorías; GRC, su unidad de negocio; el resto, su Dirección. En desarrollo la sesión llega en el encabezado `X-Usuario-Id`; al integrar Entra ID solo cambia `SesionGuard.identificar()`.

**Errores:** todas las respuestas de error tienen el formato `{ error, detalles? }`. Los 422 de validación traen `detalles` por campo, y el frontend los muestra junto a cada input.

## Historias implementadas

| HU | Endpoints |
|---|---|
| HU_01 (base) | `GET /api/health`, `GET /api/usuarios`, `POST /api/sesion`, `GET /api/catalogos`, `GET/POST /api/auditorias`, `GET /api/auditorias/:id` |
| HU_04 | `GET/POST /api/hallazgos` |
| HU_06 · HU_07 · HU_08 | `POST /api/auditorias/:id/solicitar-cierre`, `POST /api/auditorias/:id/decision`, `GET /api/auditorias/:id/integridad` |
| HU_14 | `GET /api/dashboard`, `GET /api/dashboard/cuellos-de-botella` |
| HU_09 | `POST /api/planes` |
| HU_10 | `GET /api/planes`, `GET /api/planes/:id`, `POST /api/planes/:id/avances` |
| HU_11 | `POST /api/planes/:id/validacion` |

### Validación colegiada de planes (HU_11 · F_11 · CP-014)

`POST /api/planes/:id/validacion` requiere sesión (`X-Usuario-Id`) y rol `grc` durante `revision_grc` o `jefe` durante `revision_jefe`. El cuerpo acepta `{"decision":"aprobado"}` o `{"decision":"rechazado","comentario":"La evidencia no demuestra operación efectiva."}`. El comentario es obligatorio al rechazar y opcional al aprobar. La identidad y el rol del revisor siempre vienen de la sesión.

El ciclo es `en_progreso` (avance 100 %) → `revision_grc` → `revision_jefe` → `cerrado`. Cualquier rechazo devuelve el plan a `en_progreso`, conserva comentario, revisor, etapa y fecha en `bitacora`, y el siguiente avance al 100 % inicia el ciclo desde GRC. Se responde 403 por rol incorrecto, 409 por estado fuera de orden/avance insuficiente o decisión concurrente y 422 por entrada inválida. Una aprobación final solventa el hallazgo solo si todos sus planes están cerrados. El repositorio en memoria ejecuta estado, historial y evaluación en una operación indivisible; no existe motor SQL ni sistema de migraciones aplicado en este backend. Si una futura función agrega o reabre un plan después de solventar el hallazgo, debe reabrir el hallazgo en la misma operación.

Ejemplo de respuesta: `{"id":1,"estado":"revision_jefe","avance_pct":100,...}`. La operación no inspecciona archivos: la decisión humana y su comentario quedan en la bitácora y en el historial visible del plan.

## Historias por implementar (una por integrante)

| HU | Módulo sugerido | Qué espera el frontend |
|---|---|---|
| HU_02 Evaluación de controles | `src/procedimientos/` | Endpoint para calificar diseño, efectividad y vulnerabilidad de un procedimiento |
| HU_05 Solicitudes PBC | `src/pbc/` | CRUD de solicitudes con su ciclo de estados |
| HU_11 Validación GRC → Jefatura | `src/planes/` | `{ decision: "aprobado" | "rechazado", comentario? }`; comentario obligatorio al rechazar |
| HU_12 Notificaciones | `src/notificaciones/` | Tarea programada diaria de 15, 5 y 1 días, y escalamiento |
| HU_15 Bitácora de accesos y operaciones | `src/bitacora/` (`GET /api/bitacora`) | Pantalla Bitácora: `{ operaciones: [...], accesos: [...] }`, solo para Director, Gerente y Admin. Además, registrar cada escritura (hallazgos, cierre, planes, auditorías) y cada inicio de sesión. Los tipos `RegistroBitacora` y `Acceso` y sus datos de ejemplo ya existen en `src/datos/`. |

## Cómo agregar una historia nueva (ejemplo: HU_05 Solicitudes PBC)

1. **Modelo:** agrega la interfaz en `src/datos/modelos.ts`. La tabla `solicitudes_pbc` ya existe en el SQL.
2. **Repositorio:** crea `src/datos/repositorios/pbc.repository.ts` con una clase abstracta (`listar`, `crear`, `cambiarEstado`…).
3. **Implementación en memoria:** agrega `PbcMemoriaRepository` en `src/datos/memoria/` y regístrala en `datos.module.ts` (`{ provide: PbcRepository, useClass: PbcMemoriaRepository }`, más el export).
4. **Módulo:** crea `src/pbc/` con `pbc.module.ts`, `pbc.controller.ts`, `pbc.service.ts` y `pbc.dto.ts`. Puedes generarlos con `npx nest g resource pbc --no-spec`.
5. **Reglas:**
   - usa `@TextoSignificativo(min, 'el campo')` en los DTO;
   - usa `@Roles(...)` en las rutas;
   - usa `AccesoService.auditoriaVisible()` para la seguridad por fila.
6. **Registro:** importa el módulo en `app.module.ts`.
7. **Pruebas:** agrega casos en `test/api.e2e-spec.ts`.

## Base de datos (Azure SQL compartida)

La API puede trabajar con dos fuentes de datos, sin cambiar controladores ni servicios:

| `DATA_SOURCE` | Fuente | Uso |
|---|---|---|
| `sql` | Azure SQL compartida del grupo (`src/datos/sql/`) | Desarrollo normal y despliegue |
| *(sin definir)* | Datos de demostración en memoria (`src/datos/memoria/`) | Pruebas automáticas (`npm test`, `npm run test:e2e`) |

El esquema vive en el repositorio compartido [auditoria_bd](https://github.com/hectorpablogzz/auditoria_bd): `tablas_compartidas.sql`, `tablas_eq12.sql` y `ampliacion_eq12.sql` (columnas y tablas que usa esta API).

Primera vez, con `backend/.env` lleno (ver `.env.example`):

```bash
npm run db:test
npm run db:sql -- ../../auditoria_bd/scripts/ampliacion_eq12.sql
npm run db:seed
```

- `db:test` comprueba la conexión y lista las tablas.
- `db:sql` ejecuta un script `.sql` (separado por `GO`). La ampliación solo agrega columnas opcionales y tablas nuevas; se puede correr más de una vez.
- `db:seed` carga los datos de demostración (José Martínez y sus auditorías). Si ya hay datos, `npm run db:seed -- --reiniciar` los recarga. Solo borra datos del Equipo 12: roles con `code`, usuarios `@demo.femsa.test` y tablas del equipo; nunca filas de otros equipos.

Azure SQL serverless puede tardar hasta un minuto en responder la primera consulta después de estar en pausa.
