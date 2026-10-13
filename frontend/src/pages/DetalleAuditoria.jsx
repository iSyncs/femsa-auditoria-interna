/*
 * TODO FE1S-12 HU_05 (Carlos): agregar pestaña "Solicitudes de información" con las PBC de esta
 * auditoría (mismo diseño que pages/SolicitudesPBC.jsx) y botón "Nueva solicitud" con la auditoría fija.
 * TODO FE1S-7 (Jorge): bloque "Lotes recibidos" de esta auditoría con enlace a /ia/lotes/:id.
 */
import { useState } from 'react';
import { useParams } from 'react-router';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { useSesion } from '../context/Sesion';
import { puede } from '../lib/permisos';
import { ESTADO_AUDITORIA, ESTADO_HALLAZGO, ESTADO_PROCEDIMIENTO, NIVEL_APROBACION, SEVERIDAD, fecha, fechaHora, utc } from '../lib/formato';
import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Badge, { EstadoBadge } from '../components/ui/Badge';
import KpiCard, { KpiGrid } from '../components/ui/KpiCard';
import Notice from '../components/ui/Notice';
import Drawer from '../components/ui/Drawer';
import Stepper from '../components/ui/Stepper';
import Icon from '../components/ui/Icon';
import { Panel, Tile } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';
import { Cargando, ErrorCarga, Vacio } from '../components/ui/Estados';
import NuevoHallazgo from '../components/forms/NuevoHallazgo';
import Decision from '../components/forms/Decision';
import EvaluarProcedimiento from '../components/forms/EvaluarProcedimiento';
import ProgressBar from '../components/ui/ProgressBar';

function pasosCiclo(a) {
  const orden = ['pendiente', 'en_ejecucion', 'en_aprobacion', 'cerrada'];
  const i = orden.indexOf(a.estado);
  const rechazo = a.estado === 'en_ejecucion' && a.aprobaciones.some((x) => x.decision === 'rechazado');
  const e = (n) => (a.estado === 'cerrada' || n < i ? 'done' : n === i ? 'current' : 'pending');
  const firmas = a.aprobaciones.length
    ? a.aprobaciones.map((x) => `${NIVEL_APROBACION[x.nivel].split(' ')[0]}: ${x.decision}`).join(' · ')
    : 'Jefe → Gerente → Director';
  return [
    { titulo: 'Planeación / Pendiente', descripcion: 'Alcance y controles asignados.', estado: e(0) },
    { titulo: 'Ejecución', descripcion: rechazo ? 'Regresó a ejecución por rechazo en la cadena de firmas.' : 'Evaluación de controles, PBC, evidencias y hallazgos.', estado: rechazo ? 'rejected' : e(1) },
    { titulo: 'Pre-cierre', descripcion: a.precierre.listo ? 'Sin pendientes: 100% supervisado y hallazgos con plan.' : `${a.precierre.pendientes.length} pendiente(s) por atender.`, estado: i >= 2 ? 'done' : a.precierre.listo && i === 1 ? 'current' : 'pending' },
    { titulo: 'Aprobación multinivel', descripcion: firmas, estado: e(2) },
    { titulo: 'Cierre y sellado', descripcion: a.cierre ? `SHA-256 · ${fechaHora(a.cierre.sello_temporal)}` : 'Solo lectura + hash criptográfico del expediente.', estado: a.estado === 'cerrada' ? 'done' : 'pending' },
  ];
}

export default function DetalleAuditoria() {
  const { id } = useParams();
  const { usuario } = useSesion();
  const { data: a, error, cargando, recargar } = useApi(`/auditorias/${id}`);
  const [panel, setPanel] = useState(null); // 'hallazgo' | 'pendientes' | 'decision' | 'integridad'
  const [aviso, setAviso] = useState(null);
  const [integridad, setIntegridad] = useState(null);
  const [evaluando, setEvaluando] = useState(null);

  if (cargando && !a) return <><Topbar migas={[{ texto: 'Auditorías', to: '/auditorias' }]} /><Cargando /></>;
  if (error) return <><Topbar migas={[{ texto: 'Auditorías', to: '/auditorias' }]} /><ErrorCarga error={error} /></>;

  const cerrada = a.estado === 'cerrada';
  const turno = a.aprobaciones.find((x) => x.decision === 'pendiente');
  const criticos = a.hallazgos.filter((h) => h.severidad === 'Crítica' && h.estado !== 'solventado').length;
  const peor = ['Crítica', 'Alta', 'Moderada', 'Baja'].find((s) => a.hallazgos.some((h) => h.severidad === s && h.estado !== 'solventado'));
  const exito = (texto) => { setAviso({ tono: 'ok', texto }); recargar(); };

  async function solicitarCierre() {
    if (!a.precierre.listo) return setPanel('pendientes');
    try {
      await api.post(`/auditorias/${a.id}/solicitar-cierre`);
      exito('Expediente turnado a la bandeja del Jefe de Auditoría.');
    } catch (err) {
      setAviso({ tono: 'error', texto: err.message, lista: err.detalles });
    }
  }

  async function verificar() {
    setIntegridad(null);
    setPanel('integridad');
    try { setIntegridad(await api.get(`/auditorias/${a.id}/integridad`)); } catch (err) { setIntegridad({ error: err.message }); }
  }

  return (
    <>
      <Topbar migas={[{ texto: 'Auditorías', to: '/auditorias' }, { texto: a.unidad }, { texto: `Folio ${a.tracking_id}` }]} />
      <PageHeader titulo={a.nombre} descripcion={a.objetivo}>
        {cerrada && <Button icon="verified_user" onClick={verificar}>Verificar integridad</Button>}
        {puede.registrarHallazgo(usuario, a) && <Button icon="add_task" onClick={() => setPanel('hallazgo')}>Registrar hallazgo</Button>}
        {usuario.rol === 'lider' && a.estado === 'en_ejecucion' && (
          <Button variant="primary" icon="send" onClick={solicitarCierre} disabled={!puede.solicitarCierre(usuario, a)}
            title={a.lider_id !== usuario.id ? 'Sólo el Auditor Líder responsable' : a.precierre.listo ? '' : 'Hay pendientes: haz clic para verlos'}>
            {a.precierre.listo ? 'Solicitar cierre' : `Solicitar cierre (${a.precierre.pendientes.length} pendientes)`}
          </Button>
        )}
        {puede.decidirCierre(usuario, a) && <Button variant="primary" icon="approval" onClick={() => setPanel('decision')}>Dictaminar ({NIVEL_APROBACION[turno.nivel]})</Button>}
      </PageHeader>

      {aviso && (
        <Notice tono={aviso.tono} titulo={aviso.tono === 'ok' ? 'Listo' : 'No se pudo completar'}>
          {aviso.texto}
          {aviso.lista && <ul className="list-disc pl-4">{aviso.lista.map((p) => <li key={p.folio + p.descripcion}>{p.folio}: {p.descripcion}</li>)}</ul>}
        </Notice>
      )}
      {cerrada && (
        <Notice tono="info" titulo="Expediente cerrado y sellado · solo lectura">
          Sello {utc(a.cierre?.sello_temporal)} · {a.cierre?.algoritmo} <code className="break-all text-[11px]">{a.cierre?.hash_integridad}</code>
        </Notice>
      )}

      <KpiGrid>
        <KpiCard destacado={peor === 'Crítica'} label="Mayor severidad abierta" valor={peor ?? 'Ninguna'} nota={criticos ? `${criticos} hallazgo(s) crítico(s)` : 'Sin críticos abiertos'} />
        <KpiCard label="Avance de ejecución" valor={`${a.avance}%`} nota={`${a.supervisados} de ${a.total_procedimientos} procedimientos supervisados`} />
        <KpiCard label="Estado" valor={ESTADO_AUDITORIA[a.estado].texto} small nota={turno ? `En bandeja: ${NIVEL_APROBACION[turno.nivel]}` : `${a.hallazgos_abiertos} hallazgo(s) abiertos`} />
        <KpiCard label="Auditor líder" valor={a.lider} small nota={`Vence ${fecha(a.fecha_fin)} · ${a.direccion}`} />
      </KpiGrid>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 content-start gap-5 [&>*]:min-w-0">
          {usuario.rol !== 'auditado' && (
            <Panel titulo="Procedimientos de auditoría (AP)" subtitulo="Control evaluado → riesgo mitigado · escala oficial de madurez">
              <Tile className="!p-1">
                {a.procedimientos.length === 0 ? <Vacio texto="Sin procedimientos asignados." /> : (
                  <Table columnas={['Control y riesgo', 'Calificación', 'Avance', 'Estado / acción']}>
                    {a.procedimientos.map((p) => (
                      <tr key={p.id} className="hover:bg-subtle">
                        <Td className="min-w-[190px]">
                          <div className="font-bold">{p.control}</div>
                          <div className="text-[11px] text-muted">{p.tracking_id} · {p.auditor ?? 'Sin asignar'}</div>
                          <div className="mt-1 line-clamp-1 text-[11px] text-body" title={`${p.riesgo_folio} · ${p.riesgo}`}>
                            <span className="font-semibold">{p.riesgo_folio}</span> · {p.riesgo}
                          </div>
                        </Td>
                        <Td className="whitespace-nowrap text-xs">
                          {p.calif_diseno ? (
                            <dl className="grid grid-cols-[auto_auto] gap-x-2 gap-y-0.5">
                              <dt className="text-muted">Diseño</dt><dd className="font-semibold">{p.calif_diseno}</dd>
                              <dt className="text-muted">Efectividad</dt>
                              <dd className={['Inicial', 'Funcional'].includes(p.calif_efectividad) ? 'font-bold text-brand' : 'font-semibold'}>{p.calif_efectividad}</dd>
                              <dt className="text-muted">Vulnerab.</dt><dd className="font-semibold">{p.vulnerabilidad ?? '—'}</dd>
                            </dl>
                          ) : <span className="text-muted">Sin evaluar</span>}
                        </Td>
                        <Td><ProgressBar valor={p.avance} ancho="w-[56px]" /></Td>
                        <Td><div className="flex flex-col items-start gap-1.5"><EstadoBadge catalogo={ESTADO_PROCEDIMIENTO} valor={p.estado} />
                          {puede.evaluarControl(usuario, a, p) && <Button variant="chip" icon="fact_check" onClick={() => setEvaluando(p)}>Evaluar</Button>}
                        </div></Td>
                      </tr>
                    ))}
                  </Table>
                )}
              </Tile>
            </Panel>
          )}

          <Panel titulo="Hallazgos (FND)" subtitulo="Vinculados al procedimiento y a la auditoría">
            <div className="grid gap-3">
              {a.hallazgos.length === 0 && <Tile><Vacio texto="Sin hallazgos registrados." /></Tile>}
              {a.hallazgos.map((h) => (
                <Tile key={h.id}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tono={SEVERIDAD[h.severidad].tono}>{h.severidad}</Badge>
                    <EstadoBadge catalogo={ESTADO_HALLAZGO} valor={h.estado} />
                    <span className="text-[11px] font-bold text-faint">{h.tracking_id}</span>
                  </div>
                  <div className="mt-1.5 text-[13px] font-bold">{h.titulo}</div>
                  <div className="mt-1 text-xs text-muted">{h.tipo} · {h.planes} plan(es) de remediación · identificado {fechaHora(h.fecha_identificacion)}</div>
                </Tile>
              ))}
            </div>
          </Panel>

          {a.evidencias.length > 0 && (
            <Panel titulo="Evidencias (SOPORTE)" subtitulo="Los archivos dentro de un ZIP reciben folio hijo">
              <Tile className="!p-1">
                <Table columnas={['Folio', 'Archivo', 'Cargado por', 'Fecha']}>
                  {a.evidencias.map((e) => (
                    <tr key={e.id}>
                      <Td className={e.evidencia_padre_id ? 'pl-9 text-xs text-muted' : 'font-bold'}>{e.evidencia_padre_id ? '↳ ' : ''}{e.tracking_id}</Td>
                      <Td><span className="inline-flex items-center gap-1.5"><Icon name={e.tipo_mime === 'application/zip' ? 'folder_zip' : 'description'} size={16} className="text-muted" />{e.nombre_archivo}</span></Td>
                      <Td>{e.cargado_por}</Td>
                      <Td className="text-xs" >{fechaHora(e.fecha_carga)}</Td>
                    </tr>
                  ))}
                </Table>
              </Tile>
            </Panel>
          )}
        </div>

        <div className="grid content-start gap-5">
          <Panel titulo="Progreso del expediente">
            <Stepper pasos={pasosCiclo(a)} />
          </Panel>
          <Panel titulo="Cadena de firmas" subtitulo="Jefe → Gerente → Director · el rechazo exige comentario">
            {a.aprobaciones.length === 0 ? <Tile><Vacio icono="draw" texto="Aún no se solicita el cierre." /></Tile> : (
              <div className="grid gap-2.5">
                {a.aprobaciones.map((x) => (
                  <Tile key={x.secuencia} className="!p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold">{x.secuencia}. {NIVEL_APROBACION[x.nivel]}</span>
                      <Badge tono={{ aprobado: 'ok', rechazado: 'brand', pendiente: 'neutral' }[x.decision]}>{x.decision}</Badge>
                    </div>
                    {x.aprobador && <div className="mt-1 text-xs text-muted">{x.aprobador} · <span title={utc(x.fecha_decision)}>{fechaHora(x.fecha_decision)}</span>{x.zona_horaria ? ` · firmado desde ${x.zona_horaria}` : ''}</div>}
                    {x.comentarios && <div className="mt-1 text-xs italic text-body">“{x.comentarios}”</div>}
                  </Tile>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <NuevoHallazgo
        key={`h-${a.id}-${panel === 'hallazgo'}`}
        abierto={panel === 'hallazgo'}
        auditoriaFija={a.id}
        procedimientos={a.procedimientos}
        onCerrar={() => setPanel(null)}
        onCreado={(h) => { setPanel(null); exito(`Hallazgo ${h.tracking_id} registrado en la base de datos.`); }}
      />

      {evaluando && <EvaluarProcedimiento
        key={`e-${evaluando.id}`}
        abierto
        auditoriaId={a.id}
        procedimiento={evaluando}
        onCerrar={() => setEvaluando(null)}
        onGuardado={() => { setEvaluando(null); exito(`Evaluación de ${evaluando.tracking_id} guardada y registrada en bitácora.`); }}
      />}

      <Drawer abierto={panel === 'pendientes'} onCerrar={() => setPanel(null)} titulo="Pendientes para solicitar el cierre"
        subtitulo="Validación automática de pre-cierre (F_06)" acciones={<Button onClick={() => setPanel(null)}>Entendido</Button>}>
        <Notice tono="warn" titulo={`${a.precierre.pendientes.length} elemento(s) impiden turnar el expediente`}>
          Todos los procedimientos deben estar supervisados por la Jefatura y cada hallazgo debe tener un plan de remediación propuesto.
        </Notice>
        <ul className="grid gap-2">
          {a.precierre.pendientes.map((p) => (
            <li key={p.folio + p.descripcion} className="rounded-inner border border-line p-3 text-[13px]">
              <Badge tono={p.tipo === 'hallazgo' ? 'brand' : 'warn'}>{p.tipo}</Badge> <b className="ml-1">{p.folio}</b>
              <div className="mt-1 text-muted">{p.descripcion}</div>
            </li>
          ))}
        </ul>
      </Drawer>

      <Decision
        abierto={panel === 'decision'}
        titulo={`Dictamen · ${turno ? NIVEL_APROBACION[turno.nivel] : ''}`}
        subtitulo={`${a.tracking_id} · ${a.nombre}`}
        aviso={turno?.nivel === 'director' ? 'Tu aprobación es la firma final: el expediente quedará en solo lectura y se sellará con SHA-256.' : 'Si rechazas, el expediente regresa a Ejecución y se notifica al Auditor Líder.'}
        onCerrar={() => setPanel(null)}
        onDecidir={async (decision, comentario) => {
          const r = await api.post(`/auditorias/${a.id}/decision`, { decision, comentario });
          exito(r.estado === 'cerrada' ? `Expediente cerrado y sellado. SHA-256: ${r.hash}` : decision === 'aprobado' ? 'Aprobado y turnado al siguiente nivel.' : 'Rechazado: el expediente regresó a Ejecución.');
        }}
      />

      <Drawer abierto={panel === 'integridad'} onCerrar={() => setPanel(null)} titulo="Verificación de integridad"
        subtitulo="Se recalcula el SHA-256 con los datos actuales y se compara con el sello" acciones={<Button onClick={() => setPanel(null)}>Cerrar</Button>}>
        {!integridad && <Cargando texto="Recalculando hash…" />}
        {integridad?.error && <Notice tono="error">{integridad.error}</Notice>}
        {integridad?.hashGuardado && (
          <>
            <Notice tono={integridad.datosIntactos && integridad.manifiestoIntacto ? 'ok' : 'error'}
              titulo={integridad.datosIntactos && integridad.manifiestoIntacto ? 'Expediente íntegro' : 'ALERTA: el expediente fue alterado'}>
              Sello temporal: {utc(integridad.selloTemporal)}
            </Notice>
            <div className="grid gap-3 text-xs">
              <div><div className="font-bold text-muted">Hash guardado</div><code className="break-all">{integridad.hashGuardado}</code></div>
              <div><div className="font-bold text-muted">Hash recalculado</div><code className="break-all">{integridad.hashRecalculado}</code></div>
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}
