import { Link } from 'react-router';
import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EnDesarrollo from '../components/ui/EnDesarrollo';
import { Card } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';

/*
 * SUGERENCIAS PENDIENTES · Responsable: Jorge · FE1S-28
 *
 * Vista transversal: todos los borradores de hallazgos que la IA dejó en cualquier lote y que
 * el auditor todavía no acepta ni descarta. Sirve para no tener que abrir lote por lote.
 *
 * Por hacer:
 * 1. API: GET /api/sugerencias?estado=pendiente → con lote, auditoría, severidad sugerida,
 *    prioridad, fecha y documento de evidencia. Respetar la seguridad por fila de la auditoría.
 * 2. Acciones iguales a DetalleLote: aceptar (crea el hallazgo tal cual), modificar (formulario
 *    precargado; se guarda la versión del auditor y se conserva la original de la IA) y descartar
 *    (motivo obligatorio). Agregar la pestaña "Modificadas" para revisar qué corrigieron los auditores.
 * 3. Ordenar por prioridad de la IA y luego por fecha de recepción del lote.
 * 4. Mostrar el conteo de pendientes como badge en el submenú "Sugerencias pendientes".
 */

// EJEMPLO
const PENDIENTES = [
  { id: 1, titulo: 'Partidas en conciliación con antigüedad mayor a 90 días sin autorización', lote: 'LOT-000003', loteId: 1, auditoria: 'AUD-000011', severidad: 'Alta', prioridad: 1 },
  { id: 2, titulo: 'La política de tesorería no define plazo de depuración de partidas', lote: 'LOT-000003', loteId: 1, auditoria: 'AUD-000011', severidad: 'Moderada', prioridad: 2 },
  { id: 3, titulo: 'Perfiles con acceso simultáneo a alta de proveedores y pagos', lote: 'LOT-000002', loteId: 2, auditoria: 'AUD-000009', severidad: 'Crítica', prioridad: 1 },
];
const TONO_SEV = { Crítica: 'brand', Alta: 'brand', Moderada: 'warn', Baja: 'neutral' };

export default function SugerenciasIA() {
  return (
    <>
      <Topbar migas={[{ texto: 'Inteligencia artificial' }, { texto: 'Sugerencias pendientes' }]} />
      <PageHeader titulo="Sugerencias pendientes" descripcion="Borradores de hallazgos propuestos por la IA que esperan tu decisión." />
      <EnDesarrollo responsable="Jorge" issues="FE1S-28" />
      <Card className="!p-0">
        <div className="px-3 py-2">
          <Table columnas={['Prioridad', 'Borrador de hallazgo', 'Severidad', 'Lote', '']}>
            {PENDIENTES.map((s) => (
              <tr key={s.id} className="hover:bg-subtle">
                <Td><span className="grid size-7 place-items-center rounded-full bg-subtle text-[12px] font-extrabold">{s.prioridad}</span></Td>
                <Td><div className="max-w-[420px] font-bold">{s.titulo}</div><div className="text-[12px] text-muted">{s.auditoria}</div></Td>
                <Td><Badge tono={TONO_SEV[s.severidad]}>{s.severidad}</Badge></Td>
                <Td><Link to={`/ia/lotes/${s.loteId}`} className="font-semibold hover:text-brand">{s.lote}</Link></Td>
                <Td className="whitespace-nowrap text-right">
                  <span className="inline-flex gap-2">
                    <Button variant="chip" icon="close" disabled>Descartar</Button>
                    <Button variant="chip" icon="edit" disabled>Modificar</Button>
                    <Button variant="chip" icon="check" disabled>Aceptar</Button>
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
        </div>
      </Card>
    </>
  );
}
