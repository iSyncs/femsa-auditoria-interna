import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { useSesion } from '../context/Sesion';
import { puede } from '../lib/permisos';
import { ESTADO_PLAN, SEMAFORO, SEVERIDAD, fecha, mxn } from '../lib/formato';
import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Badge, { EstadoBadge } from '../components/ui/Badge';
import KpiCard, { KpiGrid } from '../components/ui/KpiCard';
import PillTabs from '../components/ui/PillTabs';
import ProgressBar from '../components/ui/ProgressBar';
import Notice from '../components/ui/Notice';
import { Table, Td } from '../components/ui/Table';
import { Cargando, ErrorCarga, Vacio } from '../components/ui/Estados';
import AvancePlan from '../components/forms/AvancePlan';
import Decision from '../components/forms/Decision';

const TONO = { en_tiempo: 'ok', por_vencer: 'warn', demorado: 'brand', cerrado: 'neutral' };

export default function Seguimiento() {
  const { usuario } = useSesion();
  const { data, error, cargando, recargar } = useApi('/planes');
  const [filtro, setFiltro] = useState('todos');
  const [params, setParams] = useSearchParams();
  const vista = params.get('vista');
  // El submenú lateral abre la página con ?vista=<filtro>.
  useEffect(() => { if (vista) setFiltro(vista); }, [vista]);
  const [q, setQ] = useState('');
  const [avance, setAvance] = useState(null);
  const [validar, setValidar] = useState(null);
  const [aviso, setAviso] = useState(null);

  const cuenta = (s) => (data ?? []).filter((p) => p.semaforo === s).length;
  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter((p) => (filtro === 'todos' || p.semaforo === filtro)
      && (!t || `${p.tracking_id} ${p.descripcion} ${p.hallazgo} ${p.responsable} ${p.auditoria_folio}`.toLowerCase().includes(t)));
  }, [data, filtro, q]);

  const ok = (texto) => { setAviso(texto); recargar(); };

  return (
    <>
      <Topbar migas={[{ texto: 'Seguimiento' }, { texto: 'Planes de remediación' }]} busqueda={q} onBusqueda={setQ} placeholder="Buscar planes, responsables…" />
      <PageHeader titulo="Planes de remediación" descripcion="Avance, semáforo de cumplimiento (fecha compromiso en la zona horaria de la unidad de negocio) y doble validación GRC → Jefatura." />

      {aviso && <Notice tono="ok" titulo="Listo">{aviso}</Notice>}
      <KpiGrid>
        <KpiCard label="En tiempo" valor={cuenta('en_tiempo')} nota="Dentro de la fecha compromiso" tonoNota="text-ok" />
        <KpiCard label="Por vencer (≤ 5 días)" valor={cuenta('por_vencer')} nota="Alertas a 15, 5 y 1 día" tonoNota="text-warn" />
        <KpiCard destacado label="Demorados" valor={cuenta('demorado')} nota="Escalamiento a Gerencias" />
        <KpiCard label="Cerrados" valor={cuenta('cerrado')} nota="Validados por GRC y Jefatura" />
      </KpiGrid>

      <PillTabs activo={filtro} onChange={(id) => { setFiltro(id); setParams({ vista: id }, { replace: true }); }} tabs={[{ id: 'todos', label: 'Todos', count: data?.length ?? 0 }, ...Object.entries(SEMAFORO).map(([id, s]) => ({ id, label: s.texto, count: cuenta(id) }))]} />

      <div className="overflow-hidden rounded-card border border-line bg-white px-3 py-2">
        {cargando && <Cargando />}
        {error && <ErrorCarga error={error} />}
        {data && filas.length === 0 && <Vacio texto="No hay planes con ese filtro." />}
        {filas.length > 0 && (
          <Table columnas={['Plan', 'Hallazgo', 'Responsable', 'Compromiso', 'Semáforo y avance', 'Estado', '']}>
            {filas.map((p) => (
              <tr key={p.id} className="hover:bg-subtle">
                <Td><div className="line-clamp-2 min-w-[200px] max-w-[300px] font-bold" title={p.descripcion}>{p.descripcion}</div><div className="text-[11px] text-muted">{p.tracking_id}{p.monto_mxn ? ` · ${mxn(p.monto_mxn)}` : ''}</div></Td>
                <Td><Badge tono={SEVERIDAD[p.severidad].tono}>{p.severidad}</Badge><Link className="mt-1 block whitespace-nowrap text-[11px] leading-snug text-muted hover:text-brand" to={`/auditorias/${p.auditoria_id}`}>{p.hallazgo_folio}<br />{p.auditoria_folio}</Link></Td>
                <Td className="whitespace-nowrap">{p.responsable}</Td>
                <Td className="whitespace-nowrap"><div>{fecha(p.fecha_compromiso)}</div><div className="text-[11px] text-muted">{p.semaforo === 'cerrado' ? '' : p.diasRestantes < 0 ? `${-p.diasRestantes} días vencido` : `faltan ${p.diasRestantes} días`}</div></Td>
                <Td>
                  <Badge tono={TONO[p.semaforo]}>{SEMAFORO[p.semaforo].texto}</Badge>
                  <div className="mt-1.5"><ProgressBar valor={p.avance_pct} tono={TONO[p.semaforo] === 'neutral' ? 'ok' : TONO[p.semaforo]} ancho="w-[70px]" /></div>
                </Td>
                <Td><EstadoBadge catalogo={ESTADO_PLAN} valor={p.estado} /></Td>
                <Td>
                  {puede.capturarAvance(usuario, p) && <Button variant="chip" icon="trending_up" onClick={() => setAvance(p)}>Avance</Button>}
                  {puede.validarPlan(usuario, p) && <Button variant="chip" icon="fact_check" onClick={() => setValidar(p)}>Validar</Button>}
                  {/* TODO FE1S-29 (Manuel): abrir Drawer con el historial de avances de GET /api/planes/:id (campo `avances`). */}
                  <Button variant="chip" icon="history" disabled title="Bitácora de avances: en desarrollo">Historial</Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <AvancePlan key={avance?.id ?? 'ninguno'} plan={avance} onCerrar={() => setAvance(null)}
        onGuardado={(p) => { setAvance(null); ok(`Avance de ${p.tracking_id} guardado (${p.avance_pct}%).`); }} />
      <Decision
        abierto={!!validar}
        titulo={`Validar evidencia · ${validar?.tracking_id ?? ''}`}
        subtitulo={validar?.descripcion}
        aviso={usuario.rol === 'grc' ? 'Si apruebas, el plan pasa a la Jefatura de Auditoría.' : 'Si apruebas, el plan se cierra; el hallazgo se solventa cuando todos sus planes estén cerrados.'}
        onCerrar={() => setValidar(null)}
        onDecidir={async (decision, comentario) => {
          await api.post(`/planes/${validar.id}/validacion`, { decision, comentario });
          ok(decision === 'aprobado' ? 'Validación registrada.' : 'Plan rechazado: regresa a ejecución con tu retroalimentación.');
        }}
      />
    </>
  );
}
