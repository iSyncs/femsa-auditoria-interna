import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { SEMAFORO, fechaHora, mxn, utc } from '../lib/formato';
import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import KpiCard, { KpiGrid } from '../components/ui/KpiCard';
import { Tile } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';
import { Cargando, ErrorCarga, Vacio } from '../components/ui/Estados';

export default function Reporte() {
  const { data: d, error, cargando } = useApi('/reporte');
  const imprimir = () => { api.post('/reporte/exportaciones').catch(() => {}); window.print(); };

  const encabezado = (
    <>
      <Topbar migas={[{ texto: 'Informes directivos' }, { texto: 'Reporte ejecutivo' }]} />
      <PageHeader titulo="Reporte ejecutivo de auditoría" descripcion="Dictamen consolidado de auditorías, hallazgos y planes de remediación, listo para imprimir o guardar en PDF." />
    </>
  );
  if (cargando) return <>{encabezado}<Cargando /></>;
  if (error) return <>{encabezado}<ErrorCarga error={error} /></>;

  const criticos = d.hallazgos.porSeveridad.find((s) => s.severidad === 'Crítica').total;
  const enEjecucion = d.planes.total - (d.planes.porSemaforo.find((s) => s.semaforo === 'cerrado')?.total ?? 0);
  const demorados = d.planes.porSemaforo.find((s) => s.semaforo === 'demorado').total;
  const mayor = [...d.hallazgos.porSeveridad].filter((s) => s.total).map((s) => `${s.total} ${s.severidad.toLowerCase()}`).join(', ');

  return (
    <>
      <Topbar migas={[{ texto: 'Informes directivos' }, { texto: 'Reporte ejecutivo' }]} />
      <PageHeader titulo="Reporte ejecutivo de auditoría" descripcion={`Dictamen consolidado generado desde la base de datos · ${fechaHora(d.generadoEn)} (${utc(d.generadoEn)})`}>
        <Button icon="print" onClick={imprimir}>Imprimir</Button>
        <Button variant="primary" icon="download" onClick={imprimir}>Descargar PDF</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard label="Cumplimiento" valor={`${d.cumplimiento}%`} nota="Procedimientos supervisados" tonoNota="text-ok" />
        <KpiCard destacado label="Hallazgos críticos" valor={criticos} nota="Abiertos, seguimiento especial" />
        <KpiCard label="Planes en ejecución" valor={enEjecucion} nota={`${demorados} demorado(s)`} />
        <KpiCard label="Auditorías cerradas" valor={d.auditorias.cerrada ?? 0} nota={`${d.expedientesSellados.length} expediente(s) sellado(s)`} tonoNota="text-ok" />
      </KpiGrid>

      <div className="grid gap-4 rounded-card border border-line bg-subtle p-6">
        <Tile className="!p-5">
          <h3 className="mb-1 text-sm font-bold">Resumen ejecutivo</h3>
          <p className="text-[13px] leading-relaxed text-muted">
            El portafolio revisado registra un cumplimiento de <b>{d.cumplimiento}%</b> de procedimientos supervisados.
            Permanecen <b>{d.hallazgos.abiertos}</b> hallazgos abiertos ({mayor || 'sin hallazgos abiertos'}) con un impacto
            estimado de <b>{mxn(d.hallazgos.impactoMxn)}</b>. De {d.planes.total} planes de remediación, {demorados} están demorados
            respecto a su fecha compromiso.
          </p>
        </Tile>
        <div className="grid gap-4 lg:grid-cols-2">
          <Tile className="!p-2">
            <h3 className="px-3 pt-2 text-sm font-bold">Hallazgos abiertos por severidad</h3>
            <Table columnas={['Severidad', 'Total']}>
              {d.hallazgos.porSeveridad.map((s) => <tr key={s.severidad}><Td>{s.severidad}</Td><Td className="font-bold">{s.total}</Td></tr>)}
            </Table>
          </Tile>
          <Tile className="!p-2">
            <h3 className="px-3 pt-2 text-sm font-bold">Planes por semáforo</h3>
            <Table columnas={['Semáforo', 'Total']}>
              {d.planes.porSemaforo.map((s) => <tr key={s.semaforo}><Td>{SEMAFORO[s.semaforo].texto}</Td><Td className="font-bold">{s.total}</Td></tr>)}
            </Table>
          </Tile>
        </div>
        <Tile className="!p-2">
          <h3 className="px-3 pt-2 text-sm font-bold">Expedientes cerrados y sellados (SHA-256)</h3>
          {d.expedientesSellados.length === 0 ? <Vacio texto="Aún no hay expedientes sellados." /> : (
            <Table columnas={['Auditoría', 'Sello (UTC)', 'Hash de integridad']}>
              {d.expedientesSellados.map((e) => (
                <tr key={e.tracking_id}>
                  <Td><b>{e.tracking_id}</b><div className="text-xs text-muted">{e.nombre}</div></Td>
                  <Td className="text-xs">{utc(e.sello_temporal)}</Td>
                  <Td><code className="break-all text-[11px]">{e.hash_integridad}</code></Td>
                </tr>
              ))}
            </Table>
          )}
        </Tile>
      </div>
    </>
  );
}
