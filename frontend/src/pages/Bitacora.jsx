import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fechaHora, utc } from '../lib/formato';
import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/ui/Badge';
import PillTabs from '../components/ui/PillTabs';
import { Table, Td } from '../components/ui/Table';
import { Cargando, ErrorCarga } from '../components/ui/Estados';

const TONO_ACCION = { CREAR: 'info', EVALUAR: 'info', APROBAR: 'ok', CERRAR: 'ok', RECHAZAR: 'brand', ACTUALIZAR: 'warn', EXPORTAR: 'neutral', SOLICITAR_CIERRE: 'info' };
const TONO_ACCESO = { exito: 'ok', fallo: 'brand', denegado: 'brand', cierre_sesion: 'neutral' };

const Fecha = ({ iso, zona }) => (
  <><div>{fechaHora(iso)}</div><div className="text-[11px] text-muted">{utc(iso)}{zona ? ` · usuario en ${zona}` : ''}</div></>
);

export default function Bitacora() {
  const { data, error, cargando } = useApi('/bitacora');
  const [tab, setTab] = useState('operaciones');

  return (
    <>
      <Topbar migas={[{ texto: 'Control' }, { texto: 'Bitácora' }]} />
      <PageHeader titulo="Bitácora auditable" descripcion="Registro de solo agregar de operaciones y accesos por usuario. Hora almacenada en UTC con la zona horaria del usuario (retención: accesos 30 días, operaciones 90 días)." />
      <PillTabs activo={tab} onChange={setTab} tabs={[
        { id: 'operaciones', label: 'Operaciones', count: data?.operaciones.length },
        { id: 'accesos', label: 'Accesos', count: data?.accesos.length },
      ]} />
      <div className="overflow-hidden rounded-card border border-line bg-white px-3 py-2">
        {cargando && <Cargando />}
        {error && <ErrorCarga error={error} />}
        {data && tab === 'operaciones' && (
          <Table columnas={['Fecha', 'Usuario', 'Acción', 'Entidad / folio', 'Detalle', 'IP']}>
            {data.operaciones.map((b) => (
              <tr key={b.id}>
                <Td className="text-xs"><Fecha iso={b.fecha} zona={b.zona_horaria} /></Td>
                <Td>{b.usuario ?? '—'}</Td>
                <Td><Badge tono={TONO_ACCION[b.accion] ?? 'neutral'}>{b.accion}</Badge></Td>
                <Td><b>{b.folio ?? '—'}</b><div className="text-[11px] text-muted">{b.entidad}</div></Td>
                <Td><code className="line-clamp-2 max-w-[300px] break-all text-[11px] text-muted">{b.detalle}</code></Td>
                <Td className="text-xs">{b.ip}</Td>
              </tr>
            ))}
          </Table>
        )}
        {data && tab === 'accesos' && (
          <Table columnas={['Fecha', 'Usuario', 'Resultado', 'Navegador', 'IP']}>
            {data.accesos.map((h) => (
              <tr key={h.id}>
                <Td className="text-xs"><Fecha iso={h.fecha} zona={h.zona_horaria} /></Td>
                <Td>{h.usuario ?? h.correo ?? '—'}</Td>
                <Td><Badge tono={TONO_ACCESO[h.resultado]}>{h.resultado}</Badge></Td>
                <Td className="max-w-[260px] truncate text-xs text-muted">{h.agente}</Td>
                <Td className="text-xs">{h.ip}</Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </>
  );
}
