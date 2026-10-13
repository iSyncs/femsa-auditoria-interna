import { Link, useParams } from 'react-router';
import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Icon from '../components/ui/Icon';
import EnDesarrollo from '../components/ui/EnDesarrollo';
import { Card, CardHead } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';

/*
 * DETALLE DE LOTE Y SUGERENCIAS · Responsables: Jorge (pantalla, FE1S-28) y Carlos (IA, FE1S-24)
 *
 * Muestra el resultado del análisis de UN lote. Tres bloques:
 *   1. Documentos clasificados (agente Clasificador + Extractor).
 *   2. Evidencia faltante contra la solicitud de información (agente Verificador de PBC).
 *   3. Borradores de hallazgos priorizados (agentes Analista + Priorizador, validados por el Revisor).
 *
 * Por hacer:
 * 1. API: GET /api/lotes/:id → { lote, ejecucion: {estado, modelo, inicio, fin, segundos},
 *    documentos: [...], faltantes: [...], sugerencias: [...] }.
 * 2. Mostrar el estado de la ejecución. Si está "analizando", refrescar cada 5 s; si la IA no está
 *    disponible (LM Studio apagado) mostrar el aviso y el botón "Reintentar análisis".
 * 3. Aceptar borrador: POST /api/sugerencias/:id/aceptar → crea el hallazgo con condición,
 *    criterio, causa, efecto y severidad ya llenos (el auditor puede editarlos antes de guardar,
 *    reutilizar el formulario NuevoHallazgo con auditoriaFija) y marca la sugerencia como aceptada.
 * 4. Descartar: POST /api/sugerencias/:id/descartar con motivo obligatorio (texto significativo).
 * 4b. Modificar: abre el mismo formulario precargado con lo que propuso la IA; el auditor corrige
 *    título, condición, criterio, causa, efecto, severidad o evidencia y guarda. Se crea el hallazgo
 *    con su versión y la sugerencia queda como "modificada", conservando el texto original de la IA
 *    y los campos que cambió (sirve para auditoría y para medir qué tanto acierta el modelo).
 *    Estados de una sugerencia: pendiente → aceptada | modificada | descartada.
 * 5. Cada afirmación de la IA debe enlazar al documento que la respalda (columna "Evidencia").
 * 6. Mostrar "tiempo estimado ahorrado" (segundos de la IA vs. tiempo manual de referencia que
 *    nos dé FEMSA). Es la métrica de ROI de la presentación.
 * 7. Quitar EJEMPLO y la franja EnDesarrollo cuando esté conectado.
 */

// EJEMPLO
const DOCS = [
  { nombre: 'Conciliacion_bancaria_sep.xlsx', tipo: 'Conciliación bancaria', confianza: 96 },
  { nombre: 'Estado_cuenta_BBVA_sep.pdf', tipo: 'Estado de cuenta', confianza: 93 },
  { nombre: 'RE_Partidas_en_transito.eml', tipo: 'Correo de soporte', confianza: 88 },
  { nombre: 'Politica_tesoreria_v3.pdf', tipo: 'Política interna', confianza: 91 },
];
const FALTANTES = [
  { texto: 'Autorización de las partidas con antigüedad mayor a 90 días', pbc: 'PBC-000004 · punto 3' },
  { texto: 'Conciliación de la cuenta Banorte 0021', pbc: 'PBC-000004 · punto 5' },
];
const BORRADORES = [
  { titulo: 'Partidas en conciliación con antigüedad mayor a 90 días sin autorización', severidad: 'Alta', prioridad: 1, evidencia: 'Conciliacion_bancaria_sep.xlsx · hoja Partidas' },
  { titulo: 'La política de tesorería no define plazo de depuración de partidas', severidad: 'Moderada', prioridad: 2, evidencia: 'Politica_tesoreria_v3.pdf · sección 4.2' },
];
const TONO_SEV = { Crítica: 'brand', Alta: 'brand', Moderada: 'warn', Baja: 'neutral' };

export default function DetalleLote() {
  const { id } = useParams();
  return (
    <>
      <Topbar migas={[{ texto: 'Inteligencia artificial' }, { texto: 'Bandeja de lotes', to: '/ia/lotes' }, { texto: `Lote ${id}` }]} />
      <PageHeader titulo="LOT-000003 · Conciliaciones de septiembre" descripcion="AUD-000011 · Recibido de Tesorería el 12 de octubre · 14 documentos">
        <Button icon="refresh" disabled>Reintentar análisis</Button>
      </PageHeader>
      <EnDesarrollo responsable="Jorge y Carlos" issues="FE1S-28 · FE1S-24" />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[['Documentos clasificados', '14 de 14'], ['Evidencia faltante', '2 puntos'], ['Tiempo estimado ahorrado', '≈ 3 h 20 min']].map(([t, v]) => (
          <Card key={t} className="!py-4"><div className="text-[12px] text-muted">{t}</div><div className="mt-1 text-[20px] font-extrabold tracking-tight">{v}</div></Card>
        ))}
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="!p-0">
          <div className="px-5 pt-4"><CardHead titulo="Documentos clasificados" subtitulo="Tipo detectado por el agente Clasificador" /></div>
          <div className="px-3 pb-2">
            <Table columnas={['Documento', 'Tipo', 'Confianza']}>
              {DOCS.map((d) => (
                <tr key={d.nombre}>
                  <Td><span className="flex items-center gap-2 font-semibold"><Icon name="description" size={16} className="text-faint" />{d.nombre}</span></Td>
                  <Td className="text-muted">{d.tipo}</Td>
                  <Td className="tabular-nums">{d.confianza}%</Td>
                </tr>
              ))}
            </Table>
          </div>
        </Card>
        <Card>
          <CardHead titulo="Evidencia faltante" subtitulo="Comparada contra la solicitud de información" />
          <ul className="space-y-2.5">
            {FALTANTES.map((f) => (
              <li key={f.texto} className="flex gap-2.5 rounded-inner border border-line p-3">
                <Icon name="report" size={18} className="text-warn" />
                <div><div className="text-[13px] font-semibold">{f.texto}</div><div className="text-[12px] text-muted">{f.pbc}</div></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHead titulo="Borradores de hallazgos" subtitulo="Ordenados por prioridad. La IA sugiere; el auditor decide." />
        <div className="space-y-3">
          {BORRADORES.map((b) => (
            <div key={b.titulo} className="flex flex-wrap items-center gap-3 rounded-inner border border-line p-4">
              <span className="grid size-7 place-items-center rounded-full bg-subtle text-[12px] font-extrabold">{b.prioridad}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold">{b.titulo}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted"><Badge tono={TONO_SEV[b.severidad]}>{b.severidad}</Badge>Evidencia: {b.evidencia}</div>
              </div>
              <Button variant="chip" icon="close" disabled>Descartar</Button>
              <Button variant="chip" icon="edit" disabled>Modificar</Button>
              <Button variant="primary" icon="check" disabled>Aceptar como hallazgo</Button>
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-4 text-[12px]"><Link to="/ia/lotes" className="font-bold text-muted hover:text-brand">‹ Volver a la bandeja</Link></div>
    </>
  );
}
