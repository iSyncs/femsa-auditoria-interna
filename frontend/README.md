# Frontend — Sistema de Auditoría Interna FEMSA (Equipo 2)

Migración a **React** de los mockups aprobados (`../mockup-html/`), con un design system en **Tailwind CSS 4**.

| Tecnología | Versión |
|---|---|
| React / React DOM | 19.2.8 |
| Vite | 8.2.1 |
| Tailwind CSS (`@tailwindcss/vite`) | 4.3.3 |
| React Router | 8.4.0 |
| Oxlint | 1.79.0 |

## Ejecutar

```bash
npm install
npm run dev        # http://localhost:5173 (requiere la API en :4000, ver ../backend)
npm run build      # build de producción en dist/
npm run lint
```

Vite reenvía `/api/*` a `http://localhost:4000`, así que el navegador **nunca** recibe credenciales de base de datos.

## Estructura

```
src/
├── api/client.js          Cliente HTTP (+ encabezados de sesión y zona horaria)
├── context/Sesion.jsx     Sesión (selector de perfil = SSO simulado de Entra ID)
├── hooks/useApi.js        Carga de datos desde la API
├── lib/                   Formato de fechas (UTC → hora local), catálogos, permisos, validación
├── components/
│   ├── ui/                Design system: Button, Badge, Card/Panel/Tile, KpiCard, PillTabs,
│   │                      ProgressBar, Table, Drawer, Field, Notice, Stepper, Avatar, Icon
│   ├── layout/            AppShell, Sidebar, Topbar (+ indicador de BD en vivo), PageHeader
│   ├── charts/            LineChart, Donut, Bars (SVG / CSS, sin librerías)
│   └── forms/             NuevaAuditoria, NuevoHallazgo, AvancePlan, Decision
└── pages/                 Login, Dashboard, Auditorias, DetalleAuditoria, Hallazgos,
                           Seguimiento, Reporte, Bitacora
```

## Mockup → React

| Mockup HTML | Ruta React | Qué agrega sobre el mockup |
|---|---|---|
| `index.html` | `/` | Gráficas con datos reales (hallazgos por semana, procedimientos, semáforo de planes, vencimientos) |
| `auditorias.html` | `/auditorias` | Filtros con conteos reales, búsqueda y alta de auditoría con validación |
| `detalle-auditoria.html` | `/auditorias/:id` | Pre-cierre con lista de pendientes, cadena de firmas, sellado SHA-256 y verificación de integridad |
| `hallazgos.html` | `/hallazgos` | Registro metodológico (condición, criterio, causa, efecto, recomendación) |
| `reporte.html` | `/reporte` | Reporte generado desde la BD, expedientes sellados, impresión / PDF |
| — (nuevo) | `/seguimiento` | Planes de remediación: semáforo, avances, validación GRC → Jefatura |
| — (nuevo) | `/bitacora` | Bitácora de operaciones y de accesos (retroalimentación del SRS) |

`ia-triage.html` y `showcase.html` no se migraron: la IA de triaje no la cubre ninguna historia de usuario del alcance del equipo.

## Design system (Tailwind)

Los tokens del mockup (`styles.css`) se declaran en `src/index.css` dentro de `@theme` y generan utilidades propias. Por ejemplo, `bg-brand`, `text-muted`, `rounded-card` y `shadow-glow`.
