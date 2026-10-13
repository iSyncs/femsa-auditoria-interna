import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useApi } from '../hooks/useApi';
import { useSesion } from '../context/Sesion';
import { puede } from '../lib/permisos';
import { ESTADO_AUDITORIA, SEMAFORO, fechaCorta, mxn, numero } from '../lib/formato';
import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Badge, { EstadoBadge } from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import { Card, CardHead } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';
import { Cargando, ErrorCarga, Vacio } from '../components/ui/Estados';
import AreaChart from '../components/charts/AreaChart';
import Anillo from '../components/charts/Anillo';
import NuevaAuditoria from '../components/forms/NuevaAuditoria';
import Modal from '../components/ui/Modal';

const VISIBLES = 3;

function Vencimiento({ pl }) {
  return (
    <div className="flex gap-3 border-b border-line-subtle py-2.5 last:border-0">
      <div className="min-w-[62px] text-[11px] font-bold text-muted">{fechaCorta(pl.fecha_compromiso)}<br />{pl.diasRestantes < 0 ? `${-pl.diasRestantes} d vencido` : `${pl.diasRestantes} d`}</div>
      <div className={`border-l-2 pl-3 ${pl.semaforo === 'demorado' ? 'border-brand' : pl.semaforo === 'por_vencer' ? 'border-warn' : 'border-ok'}`}>
        <div className="text-[11px] font-bold uppercase text-faint">{pl.tracking_id} · {pl.auditoria_folio}</div>
        <div className="line-clamp-2 text-[13px] font-bold">{pl.descripcion}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted"><Avatar nombre={pl.responsable} size={18} />{pl.responsable}</div>
      </div>
    </div>
  );
}

const SEVERIDAD_COLOR = {
  Crítica: 'var(--color-brand)',
  Alta: 'var(--color-brand-mid)',
  Moderada: 'var(--color-warn)',
  Baja: '#94a3b8',
};
const TIPO_COLOR = ['var(--color-brand)', 'var(--color-brand-soft)', 'var(--color-warn)', '#94a3b8'];
const SEMAFORO_ORDEN = [['en_tiempo', 'var(--color-ok)'], ['por_vencer', 'var(--color-warn)'], ['demorado', 'var(--color-brand)'], ['cerrado', 'var(--color-line)']];
const pct = (v, t) => (t > 0 ? Math.round((v / t) * 100) : 0);

/** KPI del encabezado: anillo punteado + porcentaje + detalle (estilo "cache hit rate"). */
function Kpi({ titulo, valor, total, color, detalle, vacio }) {
  const p = pct(valor, total);
  return (
    <div className="flex items-center gap-4 px-5 py-4 sm:border-l sm:border-line sm:first:border-l-0">
      <Anillo punteado valor={valor} total={total} color={color} tam={52} grosor={6} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[24px] font-extrabold tabular-nums tracking-tight">{p}%</span>
          <span className="text-[12px] font-bold text-muted">{numero(valor)} de {numero(total)}</span>
        </div>
        <div className="text-[13px] font-bold text-ink">{titulo}</div>
        <div className="truncate text-[12px] text-muted">{valor === 0 && vacio ? vacio : detalle}</div>
      </div>
    </div>
  );
}

/** Filtro compacto tipo segmento (Todos / Crítica / Alta …). */
function Segmento({ opciones, activo, onCambio }) {
  return (
    <div role="tablist" className="inline-flex max-w-full overflow-x-auto rounded-full bg-pill p-0.5">
      {opciones.map((o) => (
        <button key={o.id} type="button" role="tab" aria-selected={o.id === activo} onClick={() => onCambio(o.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold transition-[background-color,color] duration-150 ease-out
            ${o.id === activo ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'}`}>
          {o.color && <span className="size-1.5 rounded-full" style={{ background: o.color }} />}
          {o.texto}
        </button>
      ))}
    </div>
  );
}

const VerTodo = ({ to }) => <Link to={to} className="text-xs font-bold text-muted hover:text-brand">Ver todo ›</Link>;

export default function Dashboard() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const [nueva, setNueva] = useState(false);
  const [vencimientos, setVencimientos] = useState(false);
  const [severidad, setSeveridad] = useState('todos');
  const ind = useApi('/dashboard');
  const aud = useApi('/auditorias');

  if (ind.cargando && !ind.data) return <><Topbar migas={[{ texto: 'Dashboard General' }]} /><Cargando /></>;
  if (ind.error) return <><Topbar migas={[{ texto: 'Dashboard General' }]} /><ErrorCarga error={ind.error} /></>;
  const d = ind.data;
  const p = d.procedimientos;
  const enRevision = (p.evaluado ?? 0) + (p.revisado ?? 0);
  const totalProc = Object.values(p).reduce((s, n) => s + n, 0);
  const etiqueta = (s) => (s.semanasAtras === 0 ? 'Esta sem.' : `-${s.semanasAtras} sem`);
  const totales = d.hallazgos.porSemana.map((s) => s.total);
  const filtrada = severidad === 'todos' ? d.hallazgos.porSemana : (d.hallazgos.porSemanaSeveridad?.[severidad] ?? []);
  const semanas = filtrada.map((s) => ({ etiqueta: etiqueta(s), valor: s.total }));
  const enPeriodo = semanas.reduce((a, s) => a + s.valor, 0);
  const cambio = semanas.length > 1 ? semanas.at(-1).valor - semanas.at(-2).valor : 0;
  const colorSerie = severidad === 'todos' ? 'var(--color-brand)' : SEVERIDAD_COLOR[severidad];
  const supervisados = p.supervisado ?? 0;
  const sinEvaluar = (p.abierto ?? 0) + (p.rechazado ?? 0);
  const tramos = [
    { texto: 'Supervisados', valor: supervisados, color: 'var(--color-brand)' },
    { texto: 'En revisión', valor: enRevision, color: 'var(--color-brand-mid)' },
    { texto: 'Sin evaluar', valor: sinEvaluar, color: 'var(--color-line)' },
  ];
  const sevAbiertas = d.hallazgos.porSeveridad;
  const tipos = d.hallazgos.porTipo ?? [];
  const maxSev = Math.max(1, ...sevAbiertas.map((x) => x.total));
  const semaforo = (k) => d.planes.porSemaforo.find((x) => x.semaforo === k)?.total ?? 0;

  return (
    <>
      <Topbar migas={[{ texto: usuario.direccion ?? 'Corporativo' }, { texto: 'Dashboard General' }]} />
      <PageHeader titulo="Dashboard de Auditoría" descripcion="Supervisión de procedimientos, hallazgos y planes de remediación de las auditorías a tu cargo.">
        <Button icon="visibility" onClick={() => navegar('/hallazgos')}>Ver hallazgos</Button>
        <Button variant="primary" icon="add" onClick={() => setNueva(true)} disabled={!puede.crearAuditoria(usuario)}
          title={puede.crearAuditoria(usuario) ? '' : 'Sólo Auditor Líder, Gerente o Director pueden crear auditorías'}>
          Nueva auditoría
        </Button>
      </PageHeader>

      <Card className="mb-4 grid !p-0 sm:grid-cols-3">
        <Kpi titulo="Hallazgos atendidos" valor={d.hallazgos.total - d.hallazgos.abiertos} total={d.hallazgos.total}
          color="var(--color-brand)" detalle="Cerrados de los registrados" vacio={`Sin cerrar aún · ${d.hallazgos.abiertos} en atención`} />
        <Kpi titulo="Procedimientos supervisados" valor={supervisados} total={totalProc}
          color="var(--color-warn)" detalle="Cumplimiento del programa" />
        <Kpi titulo="Planes cerrados" valor={semaforo('cerrado')} total={d.planes.total}
          color="var(--color-ok)" detalle="Planes de remediación concluidos" vacio={`Ninguno concluido · ${d.planes.total} en curso`} />
      </Card>

      <div className="mb-4 grid gap-4 xl:grid-cols-[1.55fr_.95fr]">
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[14.5px] font-extrabold text-ink">Hallazgos identificados</h2>
              <p className="mt-0.5 text-xs text-muted">Por semana · últimas 8 semanas</p>
            </div>
            <Segmento activo={severidad} onCambio={setSeveridad} opciones={[
              { id: 'todos', texto: 'Todos' },
              ...Object.entries(SEVERIDAD_COLOR).map(([id, color]) => ({ id, texto: id, color })),
            ]} />
          </div>
          <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[32px] font-extrabold leading-none tabular-nums tracking-tight">{enPeriodo}</span>
            <span className="text-[13px] font-semibold text-muted">{severidad === 'todos' ? 'hallazgos' : `hallazgos de severidad ${severidad.toLowerCase()}`}</span>
            <span className={`flex items-center gap-1 text-[12px] font-bold ${cambio > 0 ? 'text-brand' : cambio < 0 ? 'text-ok' : 'text-muted'}`}>
              <Icon name={cambio > 0 ? 'trending_up' : cambio < 0 ? 'trending_down' : 'trending_flat'} size={16} />
              {cambio > 0 ? `+${cambio}` : cambio} vs semana anterior
            </span>
          </div>
          <AreaChart serie={semanas} color={colorSerie} fantasma={severidad === 'todos' ? null : totales} unidad=" hallazgos" />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line-subtle pt-3 text-[12px] font-semibold text-muted">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full" style={{ background: colorSerie }} />{severidad === 'todos' ? 'Todos los hallazgos' : severidad}</span>
            {severidad !== 'todos' && <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full bg-line" />Total de referencia</span>}
            <span className="ml-auto">Impacto abierto estimado: <b className="text-ink">{mxn(d.hallazgos.impactoMxn)}</b></span>
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHead titulo="Estado de procedimientos" subtitulo="Avance de la evaluación de controles" accion={<VerTodo to="/auditorias" />} />
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-extrabold leading-none tabular-nums tracking-tight">{totalProc}</span>
            <span className="text-[13px] font-semibold text-muted">procedimientos</span>
          </div>
          {/* Barra segmentada: cada tramo es proporcional a su conteo. */}
          <div className="mt-5 flex h-3 gap-1">
            {tramos.filter((x) => x.valor > 0).map((x) => (
              <span key={x.texto} className="h-full origin-left animate-crecer-x rounded-full" style={{ flexGrow: x.valor, background: x.color }} title={`${x.texto}: ${x.valor}`} />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {tramos.map((x) => (
              <li key={x.texto} className="flex items-center gap-2.5 text-[13px]">
                <span className="size-2.5 rounded-full" style={{ background: x.color }} />
                <span className="flex-1 text-body">{x.texto}</span>
                <b className="tabular-nums">{x.valor}</b>
                <span className="w-10 text-right text-[12px] text-muted tabular-nums">{pct(x.valor, totalProc)}%</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex gap-2.5 rounded-inner border border-dashed border-line bg-subtle px-3.5 py-3 text-[12px] text-body">
            <Icon name="lightbulb" size={17} className="shrink-0 text-warn" />
            <span><b>{supervisados}</b> listos para cierre y <b>{sinEvaluar}</b> sin evaluar. Prioriza los procedimientos abiertos de las auditorías con fecha más próxima.</span>
          </div>
        </Card>
      </div>

      <div className="mb-4 grid items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1.05fr]">
        <Card className="flex flex-col">
          <CardHead titulo="Hallazgos abiertos" subtitulo="Por severidad y tipo" accion={<VerTodo to="/hallazgos" />} />
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-extrabold leading-none tabular-nums tracking-tight">{numero(d.hallazgos.abiertos)}</span>
            <span className="text-[13px] font-semibold text-muted">de {d.hallazgos.total} registrados</span>
          </div>
          {/* Composición por tipo: barra segmentada proporcional. */}
          <div className="mt-4 flex h-2.5 gap-1">
            {tipos.map((x, i) => (
              <span key={x.tipo} className="h-full origin-left animate-crecer-x rounded-full" style={{ flexGrow: x.total, background: TIPO_COLOR[i % TIPO_COLOR.length] }} title={`${x.tipo}: ${x.total}`} />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {tipos.map((x, i) => (
              <span key={x.tipo} className="flex items-center gap-1.5 text-[12px] text-body">
                <span className="size-2 rounded-full" style={{ background: TIPO_COLOR[i % TIPO_COLOR.length] }} />{x.tipo} <b className="tabular-nums">{x.total}</b>
              </span>
            ))}
          </div>
          {/* Barras cápsula: la más alta marca la severidad dominante. */}
          <div className="mt-4 grid flex-1 grid-cols-4 gap-3 border-t border-line-subtle pt-4">
            {sevAbiertas.map((x) => (
              <div key={x.severidad} className="flex flex-col items-center gap-1.5" title={`${x.severidad}: ${x.total}`}>
                <div className="flex min-h-16 w-full flex-1 items-end justify-center">
                  <span className="w-3.5 origin-bottom animate-crecer rounded-full"
                    style={{ height: `${Math.max(8, (x.total / maxSev) * 100)}%`, background: SEVERIDAD_COLOR[x.severidad] }} />
                </div>
                <span className="text-[13px] font-extrabold tabular-nums leading-none">{x.total}</span>
                <span className="text-[11px] font-semibold text-muted">{x.severidad}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col">
          <CardHead titulo="Planes de remediación" subtitulo="Semáforo de cumplimiento" accion={<VerTodo to="/seguimiento" />} />
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-extrabold leading-none tabular-nums tracking-tight">{d.planes.total}</span>
            <span className="text-[13px] font-semibold text-muted">planes · {semaforo('cerrado')} cerrados</span>
          </div>
          <div className="mt-4 flex h-2.5 gap-1">
            {SEMAFORO_ORDEN.filter(([k]) => semaforo(k) > 0).map(([k, color]) => (
              <span key={k} className="h-full origin-left animate-crecer-x rounded-full" style={{ flexGrow: semaforo(k), background: color }} title={`${SEMAFORO[k].texto}: ${semaforo(k)}`} />
            ))}
          </div>
          {/* flex-1 + content-center: los anillos quedan centrados entre la barra y la nota. */}
          <div className="grid flex-1 grid-cols-3 content-center gap-2 py-5">
            {SEMAFORO_ORDEN.slice(0, 3).map(([k, color]) => (
              <div key={k} className="flex flex-col items-center gap-1.5 text-center">
                <Anillo valor={semaforo(k)} total={d.planes.total} color={color} tam={58} grosor={6}>
                  <span className="text-[16px] font-extrabold tabular-nums">{semaforo(k)}</span>
                </Anillo>
                <span className="text-[12px] font-semibold text-muted">{SEMAFORO[k].texto}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2.5 rounded-inner border border-dashed border-line bg-subtle px-3.5 py-3 text-[12px] text-body">
            <Icon name={semaforo('demorado') > 0 ? 'priority_high' : 'check_circle'} size={17} className={`shrink-0 ${semaforo('demorado') > 0 ? 'text-brand' : 'text-ok'}`} />
            <span>{semaforo('demorado') > 0
              ? <><b>{semaforo('demorado')}</b> {semaforo('demorado') === 1 ? 'plan demorado escala' : 'planes demorados escalan'} a Gerencia; <b>{semaforo('por_vencer')}</b> vence{semaforo('por_vencer') === 1 ? '' : 'n'} en los próximos 5 días.</>
              : 'Ningún plan demorado. Todos los compromisos van en tiempo.'}</span>
          </div>
        </Card>
        <Card className="flex flex-col">
          <CardHead titulo="Próximos vencimientos" subtitulo="Planes de remediación · alertas 15/5/1 días" accion={<VerTodo to="/seguimiento" />} />
          {d.planes.proximos.length === 0 && <Vacio texto="Sin compromisos pendientes." />}
          {d.planes.proximos.slice(0, VISIBLES).map((pl) => <Vencimiento key={pl.id} pl={pl} />)}
          {d.planes.proximos.length > VISIBLES && (
            <button type="button" onClick={() => setVencimientos(true)}
              className="mt-auto w-full rounded-lg pt-2.5 text-center text-xs font-bold text-muted transition-colors hover:text-brand">
              Ver los {d.planes.proximos.length} vencimientos
            </button>
          )}
        </Card>
      </div>

      <Card className="!p-0">
        <div className="px-5 pb-1 pt-4"><CardHead titulo="Lista de auditorías" subtitulo="Ordenadas por estado y prioridad" accion={<VerTodo to="/auditorias" />} /></div>
        <div className="px-3 pb-2">
          {aud.data && (
            <Table columnas={['Auditoría / Responsable', 'Tipo', 'Área', 'Estatus', 'Vence']}>
              {aud.data.slice(0, 5).map((a) => (
                <tr key={a.id} onClick={() => navegar(`/auditorias/${a.id}`)} className="cursor-pointer hover:bg-subtle">
                  <Td><div className="flex items-center gap-2.5"><Avatar nombre={a.lider} /><div><div className="font-bold">{a.nombre}</div><div className="text-[11px] text-muted">{a.tracking_id} · {a.lider}</div></div></div></Td>
                  <Td>{a.tipo}</Td>
                  <Td>{a.area}</Td>
                  <Td>{a.prioridad === 'Alta' && a.estado !== 'cerrada' ? <Badge tono="brand">Prioridad alta</Badge> : <EstadoBadge catalogo={ESTADO_AUDITORIA} valor={a.estado} />}</Td>
                  <Td>{a.estado === 'cerrada' ? 'Cerrada' : fechaCorta(a.fecha_fin)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      </Card>

      <Modal abierto={vencimientos} titulo="Próximos vencimientos" subtitulo={`${d.planes.proximos.length} compromisos pendientes · ordenados por fecha`} onCerrar={() => setVencimientos(false)}>
        {d.planes.proximos.map((pl) => <Vencimiento key={pl.id} pl={pl} />)}
      </Modal>
      <NuevaAuditoria abierto={nueva} onCerrar={() => setNueva(false)} onCreada={(a) => { setNueva(false); navegar(`/auditorias/${a.id}`); }} />
    </>
  );
}
