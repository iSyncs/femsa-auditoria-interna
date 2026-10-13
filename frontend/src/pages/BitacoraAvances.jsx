import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import EnDesarrollo from '../components/ui/EnDesarrollo';
import ProgressBar from '../components/ui/ProgressBar';
import { Card } from '../components/ui/Card';

/*
 * BITÁCORA DE AVANCES · Responsable: Manuel · FE1S-29 (HU_16, pedido de FEMSA)
 *
 * Los avances YA se guardan (plan_avance: avance_pct, comentario, fecha, zona_horaria, usuario).
 * Falta mostrarlos.
 *
 * Por hacer:
 * 1. API: GET /api/planes/avances?auditoria=&responsable=&desde=&hasta= → feed de avances de todos
 *    los planes visibles para el usuario, del más reciente al más antiguo, paginado.
 * 2. Vista general (esta página) para director, gerencia y jefatura: línea de tiempo con quién,
 *    qué plan, de cuánto a cuánto subió el avance, comentario y fecha en la zona del usuario.
 * 3. Filtros: auditoría, responsable y rango de fechas (los controles van arriba de la lista).
 * 4. Historial dentro de cada plan: en Seguimiento, el botón "Historial" abre un Drawer que usa
 *    GET /api/planes/:id (ya existe y devuelve `avances`).
 * 5. Permisos: el auditado solo ve los avances de sus propios planes.
 */

// EJEMPLO
const AVANCES = [
  { quien: 'E. Ramos', plan: 'RP-000003', desc: 'Depurar las 14 partidas antiguas de la conciliación', de: 30, a: 60, comentario: 'Se depuraron 7 partidas con soporte de Tesorería; se adjuntan pólizas.', cuando: 'Hoy · 10:12' },
  { quien: 'L. Ortiz', plan: 'RP-000005', desc: 'Rediseñar la matriz de perfiles de Cuentas por Pagar', de: 0, a: 25, comentario: 'Se identificaron 9 perfiles con conflicto; propuesta enviada a TI.', cuando: 'Ayer · 16:40' },
  { quien: 'José Martínez', plan: 'RP-000007', desc: 'Configurar recordatorio anual de declaraciones', de: 80, a: 100, comentario: 'Recordatorio activo en el portal de Ética; pasa a revisión GRC.', cuando: '9 oct · 12:05' },
];

export default function BitacoraAvances() {
  return (
    <>
      <Topbar migas={[{ texto: 'Planes de remediación', to: '/seguimiento' }, { texto: 'Bitácora de avances' }]} />
      <PageHeader titulo="Bitácora de avances" descripcion="Quién registró avance, en qué plan y con qué evidencia." />
      <EnDesarrollo responsable="Manuel" issues="FE1S-29" />
      <Card>
        <ol className="relative">
          {AVANCES.map((v, i) => (
            <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
              {i < AVANCES.length - 1 && <span className="absolute left-[15px] top-9 h-[calc(100%-36px)] w-px bg-line" />}
              <Avatar nombre={v.quien} size={32} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 text-[13px]">
                  <b>{v.quien}</b><span className="text-muted">registró avance en</span><b>{v.plan}</b>
                  <span className="ml-auto text-[12px] text-faint">{v.cuando}</span>
                </div>
                <div className="text-[12px] text-muted">{v.desc}</div>
                <div className="mt-2 flex items-center gap-3">
                  <Badge tono={v.a === 100 ? 'ok' : 'info'}>{v.de}% → {v.a}%</Badge>
                  <ProgressBar valor={v.a} tono={v.a === 100 ? 'ok' : 'warn'} ancho="w-[120px]" />
                </div>
                <p className="mt-2 rounded-inner bg-subtle px-3 py-2 text-[13px] text-body">{v.comentario}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
