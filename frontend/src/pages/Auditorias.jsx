import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useApi } from '../hooks/useApi';
import { useSesion } from '../context/Sesion';
import { puede } from '../lib/permisos';
import { ESTADO_AUDITORIA, fechaCorta } from '../lib/formato';
import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Badge, { EstadoBadge } from '../components/ui/Badge';
import PillTabs from '../components/ui/PillTabs';
import ProgressBar from '../components/ui/ProgressBar';
import { Table, Td } from '../components/ui/Table';
import { Cargando, ErrorCarga, Vacio } from '../components/ui/Estados';
import NuevaAuditoria from '../components/forms/NuevaAuditoria';

const FILTROS = [
  { id: 'todas', label: 'Todas', f: () => true },
  { id: 'alta', label: 'Prioridad alta', f: (a) => a.prioridad === 'Alta' && a.estado !== 'cerrada' },
  { id: 'en_ejecucion', label: 'En ejecución', f: (a) => a.estado === 'en_ejecucion' },
  { id: 'pendiente', label: 'Pendientes', f: (a) => a.estado === 'pendiente' },
  { id: 'en_aprobacion', label: 'En aprobación', f: (a) => a.estado === 'en_aprobacion' },
  { id: 'cerrada', label: 'Cerradas', f: (a) => a.estado === 'cerrada' },
];
const TONO_AVANCE = { cerrada: 'ok', en_ejecucion: 'warn', pendiente: 'neutral', en_aprobacion: 'info' };

export default function Auditorias() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const { data, error, cargando } = useApi('/auditorias');
  const [filtro, setFiltro] = useState('todas');
  const [params, setParams] = useSearchParams();
  const vista = params.get('vista');
  // El submenú lateral abre la página con ?vista=<filtro>.
  useEffect(() => { if (vista) setFiltro(vista); }, [vista]);
  const [q, setQ] = useState('');
  const [nueva, setNueva] = useState(false);

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = FILTROS.find((x) => x.id === filtro).f;
    return (data ?? []).filter((a) => f(a) && (!t || `${a.tracking_id} ${a.nombre} ${a.area} ${a.unidad} ${a.lider}`.toLowerCase().includes(t)));
  }, [data, filtro, q]);

  const alta = (data ?? []).filter(FILTROS[1].f).length;

  return (
    <>
      <Topbar migas={[{ texto: 'Auditorías' }, { texto: 'Cartera de auditorías' }]} busqueda={q} onBusqueda={setQ} placeholder="Buscar por folio, auditoría, área…" />
      <PageHeader titulo="Auditorías" descripcion="Control operativo por estado, prioridad, responsable y porcentaje de avance (procedimientos supervisados).">
        <Button variant="primary" icon="add" onClick={() => setNueva(true)} disabled={!puede.crearAuditoria(usuario)}
          title={puede.crearAuditoria(usuario) ? '' : 'Tu rol no puede crear auditorías'}>Nueva auditoría</Button>
      </PageHeader>

      <PillTabs activo={filtro} onChange={(id) => { setFiltro(id); setParams({ vista: id }, { replace: true }); }} tabs={FILTROS.map((f) => ({ id: f.id, label: f.label, count: (data ?? []).filter(f.f).length }))} />

      <div className="overflow-hidden rounded-card border border-line">
        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <div>
            <div className="text-[14.5px] font-extrabold">Listado maestro</div>
            <div className="mt-0.5 text-xs text-muted">
              {usuario.rol === 'auditado' ? 'Sólo auditorías en las que participas' : usuario.direccion ? `Dirección ${usuario.direccion}` : 'Todas las direcciones'}
            </div>
          </div>
          {alta > 0 && <Badge tono="brand">{alta} alta prioridad</Badge>}
        </div>
        <div className="bg-white px-3 py-2">
          {cargando && <Cargando />}
          {error && <ErrorCarga error={error} />}
          {data && filas.length === 0 && <Vacio texto="No hay auditorías con ese filtro." />}
          {filas.length > 0 && (
            <Table columnas={['Auditoría', 'Estado', 'Prioridad', 'Avance', 'Hallazgos', 'Responsable', 'Vence']}>
              {filas.map((a) => (
                <tr key={a.id} onClick={() => navegar(`/auditorias/${a.id}`)} className="cursor-pointer hover:bg-subtle">
                  <Td>
                    <div className="font-bold">{a.nombre}</div>
                    <div className="mt-0.5 text-xs text-muted">{a.tracking_id} · {a.unidad} · {a.area}</div>
                  </Td>
                  <Td><EstadoBadge catalogo={ESTADO_AUDITORIA} valor={a.estado} /></Td>
                  <Td><span className={`font-bold ${a.prioridad === 'Alta' ? 'text-brand' : ''}`}>{a.prioridad}</span></Td>
                  <Td><ProgressBar valor={a.avance} tono={TONO_AVANCE[a.estado]} /></Td>
                  <Td>{a.hallazgos_abiertos}{a.hallazgos_criticos > 0 && <Badge tono="brand" className="ml-1.5">{a.hallazgos_criticos} crít.</Badge>}</Td>
                  <Td>{a.lider}</Td>
                  <Td>{a.estado === 'cerrada' ? 'Cerrada' : fechaCorta(a.fecha_fin)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      </div>

      <NuevaAuditoria abierto={nueva} onCerrar={() => setNueva(false)} onCreada={(a) => { setNueva(false); navegar(`/auditorias/${a.id}`); }} />
    </>
  );
}
