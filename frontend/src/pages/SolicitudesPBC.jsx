import { useState } from 'react';
import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import PillTabs from '../components/ui/PillTabs';
import EnDesarrollo from '../components/ui/EnDesarrollo';
import { Card } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';

/*
 * SOLICITUDES DE INFORMACIÓN (PBC) · Responsable: Carlos · FE1S-12 (HU_05)
 *
 * Flujo real de FEMSA (video de Archer): solicitar información → el auditado envía →
 * reenviar si falta algo → completa → aprobada.
 * La lista de puntos solicitados es la ENTRADA del agente Verificador de PBC: compara lo pedido
 * contra lo que llegó en el lote y reporta la evidencia faltante.
 *
 * Por hacer:
 * 1. Tablas (Héctor): pbc_solicitud (folio PBC-000001, auditoria_id, solicitado_a, fecha_limite,
 *    estado) y pbc_punto (solicitud_id, descripcion, obligatorio, estado). Revisar si ya existe
 *    algo en el esquema compartido antes de crear.
 * 2. API: GET /api/pbc?auditoria=, POST /api/pbc (con sus puntos), PATCH /api/pbc/:id/estado.
 * 3. Al recibir un lote que responde a una solicitud, ligar lote ↔ solicitud y pasar la
 *    solicitud a "Enviada"; la IA marca qué puntos quedaron cubiertos.
 * 4. Botón "Nueva solicitud" abre un Drawer con auditoría (fija si se entra desde la auditoría),
 *    responsable auditado, fecha límite y la lista de puntos.
 * 5. Mostrar también esta tabla como pestaña dentro del detalle de la auditoría.
 * 6. Las alertas de vencimiento usan la misma regla 15/5/1 días de los planes.
 */

const ESTADOS = {
  solicitada: { texto: 'Solicitada', tono: 'neutral' },
  enviada: { texto: 'Enviada', tono: 'info' },
  reenviar: { texto: 'Por reenviar', tono: 'warn' },
  completa: { texto: 'Completa', tono: 'ok' },
  aprobada: { texto: 'Aprobada', tono: 'ok' },
};

// EJEMPLO
const SOLICITUDES = [
  { folio: 'PBC-000004', auditoria: 'AUD-000011', a: 'Tesorería · E. Ramos', puntos: '5 de 7', limite: '15 oct', estado: 'reenviar' },
  { folio: 'PBC-000003', auditoria: 'AUD-000009', a: 'Cuentas por pagar · L. Ortiz', puntos: '4 de 4', limite: '10 oct', estado: 'completa' },
  { folio: 'PBC-000002', auditoria: 'AUD-000007', a: 'Ética · M. Salinas', puntos: '0 de 3', limite: '20 oct', estado: 'solicitada' },
];

export default function SolicitudesPBC() {
  const [filtro, setFiltro] = useState('todas');
  const lista = SOLICITUDES.filter((s) => filtro === 'todas' || s.estado === filtro);
  return (
    <>
      <Topbar migas={[{ texto: 'Auditorías', to: '/auditorias' }, { texto: 'Solicitudes de información' }]} />
      <PageHeader titulo="Solicitudes de información" descripcion="Lo que se pidió a cada área auditada y lo que ha entregado. Base para la revisión de evidencias de la IA.">
        <Button variant="primary" icon="add" disabled title="Disponible cuando se conecte la API">Nueva solicitud</Button>
      </PageHeader>
      <EnDesarrollo responsable="Carlos" issues="FE1S-12" />
      <PillTabs activo={filtro} onChange={setFiltro} tabs={[
        { id: 'todas', label: 'Todas', count: SOLICITUDES.length },
        ...Object.entries(ESTADOS).map(([id, e]) => ({ id, label: e.texto, count: SOLICITUDES.filter((s) => s.estado === id).length })),
      ]} />
      <Card className="!p-0">
        <div className="px-3 py-2">
          <Table columnas={['Solicitud', 'Auditoría', 'Solicitado a', 'Puntos entregados', 'Fecha límite', 'Estado']}>
            {lista.map((s) => (
              <tr key={s.folio} className="hover:bg-subtle">
                <Td className="font-bold">{s.folio}</Td>
                <Td className="font-semibold">{s.auditoria}</Td>
                <Td className="text-muted">{s.a}</Td>
                <Td className="tabular-nums">{s.puntos}</Td>
                <Td className="whitespace-nowrap text-muted">{s.limite}</Td>
                <Td><Badge tono={ESTADOS[s.estado].tono}>{ESTADOS[s.estado].texto}</Badge></Td>
              </tr>
            ))}
          </Table>
        </div>
      </Card>
    </>
  );
}
