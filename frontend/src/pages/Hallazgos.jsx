/*
 * TODO FE1S-30 HU_17 (Manuel), pedido de FEMSA "menos clics":
 * - Desde cada hallazgo, botón "Crear plan de remediación" con el hallazgo ya seleccionado
 *   (reutilizar el formulario de planes con el hallazgo fijo, como NuevoHallazgo usa auditoriaFija).
 * - En el formulario general, cambiar la lista larga de auditorías por un buscador.
 * - Registrar hallazgo desde el detalle de la auditoría YA existe (DetalleAuditoria → auditoriaFija).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useApi } from '../hooks/useApi';
import { useSesion } from '../context/Sesion';
import { puede } from '../lib/permisos';
import { ESTADO_HALLAZGO, SEVERIDAD, mxn } from '../lib/formato';
import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Badge, { EstadoBadge } from '../components/ui/Badge';
import PillTabs from '../components/ui/PillTabs';
import Notice from '../components/ui/Notice';
import { Panel, Tile } from '../components/ui/Card';
import { Cargando, ErrorCarga, Vacio } from '../components/ui/Estados';
import NuevoHallazgo from '../components/forms/NuevoHallazgo';

const abierto = (h) => !['solventado', 'rechazado'].includes(h.estado);
const FILTROS = [
  { id: 'Crítica', label: 'Críticos abiertos', f: (h) => h.severidad === 'Crítica' && abierto(h) },
  { id: 'Alta', label: 'Altos', f: (h) => h.severidad === 'Alta' && abierto(h) },
  { id: 'Moderada', label: 'Moderados', f: (h) => h.severidad === 'Moderada' && abierto(h) },
  { id: 'Baja', label: 'Bajos', f: (h) => h.severidad === 'Baja' && abierto(h) },
  { id: 'sin_resp', label: 'Sin responsable', f: (h) => !h.responsable && abierto(h) },
  { id: 'todos', label: 'Todos', f: () => true },
];

export default function Hallazgos() {
  const { usuario } = useSesion();
  const { data, error, cargando, recargar } = useApi('/hallazgos');
  const auditorias = useApi(puede.registrarHallazgo(usuario) ? '/auditorias' : null);
  const [filtro, setFiltro] = useState('Crítica');
  const [params, setParams] = useSearchParams();
  const vista = params.get('vista');
  // El submenú lateral abre la página con ?vista=<filtro>.
  useEffect(() => { if (vista) setFiltro(vista); }, [vista]);
  const [q, setQ] = useState('');
  const [nuevo, setNuevo] = useState(false);
  const [aviso, setAviso] = useState(null);

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = FILTROS.find((x) => x.id === filtro).f;
    return (data ?? []).filter((h) => f(h) && (!t || `${h.tracking_id} ${h.titulo} ${h.recomendacion} ${h.auditoria} ${h.unidad}`.toLowerCase().includes(t)));
  }, [data, filtro, q]);

  const cuenta = (id) => (data ?? []).filter(FILTROS.find((x) => x.id === id).f).length;
  const concentracion = [
    { label: 'Críticos', n: cuenta('Crítica'), c: 'text-brand' },
    { label: 'Altos', n: cuenta('Alta'), c: 'text-warn' },
    { label: 'Moderados', n: cuenta('Moderada'), c: 'text-info' },
    { label: 'Bajos', n: cuenta('Baja'), c: 'text-muted' },
    { label: 'Sin dueño', n: cuenta('sin_resp'), c: 'text-ink' },
    { label: 'Impacto abierto', n: mxn((data ?? []).filter(abierto).reduce((s, h) => s + Number(h.impacto_mxn ?? 0), 0)), c: 'text-ink !text-lg' },
  ];

  return (
    <>
      <Topbar migas={[{ texto: 'Hallazgos & Riesgos' }, { texto: 'Priorización por impacto' }]} busqueda={q} onBusqueda={setQ} placeholder="Buscar hallazgos o recomendaciones…" />
      <PageHeader titulo="Gestión y priorización de hallazgos" descripcion="Registro metodológico (condición, criterio, causa, efecto), impacto y recomendación de auditoría.">
        {puede.registrarHallazgo(usuario) && <Button variant="primary" icon="add_task" onClick={() => setNuevo(true)}>Registrar hallazgo</Button>}
      </PageHeader>

      {aviso && <Notice tono="ok" titulo="Listo">{aviso}</Notice>}
      {usuario.rol === 'auditado' && <Notice tono="info">Como personal auditado sólo ves los hallazgos asignados a ti.</Notice>}
      <PillTabs activo={filtro} onChange={(id) => { setFiltro(id); setParams({ vista: id }, { replace: true }); }} tabs={FILTROS.map((f) => ({ id: f.id, label: f.label, count: cuenta(f.id) }))} />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel titulo={FILTROS.find((f) => f.id === filtro).label}>
          {cargando && <Cargando />}
          {error && <ErrorCarga error={error} />}
          {data && filas.length === 0 && <Tile><Vacio texto="No hay hallazgos con este filtro." /></Tile>}
          <div className="grid gap-3.5">
            {filas.map((h) => (
              <Tile key={h.id}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tono={SEVERIDAD[h.severidad].tono}>{h.severidad}</Badge>
                  <EstadoBadge catalogo={ESTADO_HALLAZGO} valor={h.estado} />
                  <span className="text-[11px] font-bold text-faint">{h.tracking_id}</span>
                </div>
                <div className="mt-1.5 text-[13px] font-bold">{h.titulo}</div>
                <div className="mt-1 text-xs text-muted">
                  <Link to={`/auditorias/${h.auditoria_id}`} className="font-semibold hover:text-brand">{h.auditoria_folio} · {h.unidad}</Link>
                  {' '}· Impacto: {h.efecto}
                </div>
                <div className={`mt-1.5 text-xs font-semibold ${h.severidad === 'Crítica' ? 'text-brand' : h.severidad === 'Alta' ? 'text-warn' : 'text-body'}`}>
                  Recomendación: {h.recomendacion}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
                  <span>Responsable: <b>{h.responsable ?? 'Sin asignar'}</b></span>
                  <span>{h.planes} plan(es)</span>
                  {h.impacto_mxn != null && <span>{mxn(h.impacto_mxn)}</span>}
                </div>
              </Tile>
            ))}
          </div>
        </Panel>

        <Panel titulo="Mapa de concentración de riesgo" className="self-start">
          <div className="grid grid-cols-2 gap-3">
            {concentracion.map((c) => (
              <Tile key={c.label} className="!p-[18px]">
                <div className={`text-[26px] font-extrabold ${c.c}`}>{c.n}</div>
                <div className={`mt-1 text-xs font-bold ${c.c.split(' ')[0]}`}>{c.label}</div>
              </Tile>
            ))}
          </div>
        </Panel>
      </div>

      <NuevoHallazgo
        key={`nh-${nuevo}`}
        abierto={nuevo}
        auditorias={(auditorias.data ?? []).filter((a) => ['pendiente', 'en_ejecucion'].includes(a.estado))}
        onCerrar={() => setNuevo(false)}
        onCreado={(h) => { setNuevo(false); setAviso(`Hallazgo ${h.tracking_id} registrado en la base de datos.`); setFiltro('todos'); recargar(); }}
      />
    </>
  );
}
