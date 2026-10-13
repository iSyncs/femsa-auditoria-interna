import { useState } from 'react';
import { Link } from 'react-router';
import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PillTabs from '../components/ui/PillTabs';
import EnDesarrollo from '../components/ui/EnDesarrollo';
import { Card } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';

/*
 * BANDEJA DE LOTES · Responsable: Jorge · FE1S-7 (HU_03) y FE1S-28
 *
 * Qué es: la "bandeja de entrada" del auditor. Los lotes llegan completos (como un correo con
 * muchos adjuntos en respuesta a una solicitud de información) y la IA los analiza enteros.
 * El auditor no sube archivo por archivo.
 *
 * Por hacer:
 * 1. API: GET /api/lotes?estado=  → lotes visibles para el usuario (respetar seguridad por fila,
 *    igual que /api/auditorias). Cada lote: id, folio (LOT-000001), auditoria_id, auditoria_folio,
 *    remitente, asunto, documentos (conteo), recibido_utc, estado_ia.
 * 2. API: POST /api/lotes  → recepción de un lote (multipart: metadatos + archivos). Para el
 *    Release 1 simula la llegada por correo; guarda en ia_lote e ia_documento (tablas de Héctor,
 *    FE1S-26) y crea una ia_ejecucion en estado "pendiente" para que la IA lo tome.
 * 3. Estados de IA: pendiente → analizando → listo | error. Mientras haya lotes "analizando",
 *    refrescar la lista cada 5 s (useApi con intervalo) y detenerlo al terminar.
 * 4. Cambiar EJEMPLO por useApi('/lotes') y conservar este diseño: pestañas con conteo,
 *    tabla y botón "Abrir" hacia /ia/lotes/:id.
 * 5. Registrar en la bitácora la recepción del lote (BitacoraService.registrarOperacion).
 */

const ESTADO_IA = {
  pendiente: { texto: 'Pendiente', tono: 'neutral' },
  analizando: { texto: 'Analizando', tono: 'info' },
  listo: { texto: 'Listo', tono: 'ok' },
  error: { texto: 'Error', tono: 'brand' },
};

// EJEMPLO: se reemplaza por la respuesta de la API.
const EJEMPLO = [
  { id: 1, folio: 'LOT-000003', auditoria: 'AUD-000011', remitente: 'Tesorería · E. Ramos', asunto: 'Respuesta a PBC-000004: conciliaciones de septiembre', documentos: 14, recibido: '12 oct · 09:40', estado: 'analizando' },
  { id: 2, folio: 'LOT-000002', auditoria: 'AUD-000009', remitente: 'Cuentas por pagar · L. Ortiz', asunto: 'Matriz de perfiles y bitácoras de acceso', documentos: 8, recibido: '11 oct · 17:05', estado: 'listo' },
  { id: 3, folio: 'LOT-000001', auditoria: 'AUD-000007', remitente: 'Ética · M. Salinas', asunto: 'Declaraciones anuales de conflicto de interés', documentos: 22, recibido: '10 oct · 12:30', estado: 'pendiente' },
];

export default function BandejaLotes() {
  const [filtro, setFiltro] = useState('todos');
  const lista = EJEMPLO.filter((l) => filtro === 'todos' || l.estado === filtro);
  const cuenta = (e) => EJEMPLO.filter((l) => l.estado === e).length;

  return (
    <>
      <Topbar migas={[{ texto: 'Inteligencia artificial' }, { texto: 'Bandeja de lotes' }]} />
      <PageHeader titulo="Bandeja de lotes" descripcion="Lotes de evidencias recibidos por auditoría. La IA analiza cada lote completo y deja sugerencias para tu revisión.">
        {/* TODO: abrir el formulario de recepción manual (POST /api/lotes) mientras no exista el buzón de correo. */}
        <Button icon="move_to_inbox" disabled title="Disponible cuando se conecte la API">Recibir lote</Button>
      </PageHeader>
      <EnDesarrollo responsable="Jorge" issues="FE1S-7 · FE1S-28" />

      <PillTabs activo={filtro} onChange={setFiltro} tabs={[
        { id: 'todos', label: 'Todos', count: EJEMPLO.length },
        ...Object.entries(ESTADO_IA).map(([id, e]) => ({ id, label: e.texto, count: cuenta(id) })),
      ]} />

      <Card className="!p-0">
        <div className="px-3 py-2">
          <Table columnas={['Lote', 'Auditoría', 'Remitente', 'Documentos', 'Recibido', 'Estado de IA', '']}>
            {lista.map((l) => (
              <tr key={l.id} className="hover:bg-subtle">
                <Td><div className="font-bold">{l.folio}</div><div className="line-clamp-1 max-w-[280px] text-[12px] text-muted">{l.asunto}</div></Td>
                <Td className="font-semibold">{l.auditoria}</Td>
                <Td className="text-muted">{l.remitente}</Td>
                <Td className="tabular-nums">{l.documentos}</Td>
                <Td className="whitespace-nowrap text-muted">{l.recibido}</Td>
                <Td>
                  <Badge tono={ESTADO_IA[l.estado].tono}>
                    {/* Punto que pulsa mientras la IA trabaja; con "reducir movimiento" queda fijo. */}
                    {l.estado === 'analizando' && <span className="size-1.5 rounded-full bg-current motion-safe:animate-pulse" />}
                    {ESTADO_IA[l.estado].texto}
                  </Badge>
                </Td>
                <Td className="text-right"><Link to={`/ia/lotes/${l.id}`} className="text-xs font-bold text-muted hover:text-brand">Abrir ›</Link></Td>
              </tr>
            ))}
          </Table>
        </div>
      </Card>
    </>
  );
}
