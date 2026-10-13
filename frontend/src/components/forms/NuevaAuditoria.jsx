import { useApi } from '../../hooks/useApi';
import { api } from '../../api/client';
import { useSesion } from '../../context/Sesion';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import Notice from '../ui/Notice';
import { Input, Select, Textarea } from '../ui/Field';
import { useFormulario } from './useFormulario';
import { requerido, texto } from '../../lib/validacion';

const INICIAL = { nombre: '', objetivo: '', unidadNegocioId: '', tipo: '', area: '', prioridad: 'Media', fechaInicio: '', fechaFin: '' };

export default function NuevaAuditoria({ abierto, onCerrar, onCreada }) {
  const { usuario } = useSesion();
  const { data: catalogos } = useApi(abierto ? '/catalogos' : null);
  const f = useFormulario(INICIAL, (v) => ({
    nombre: texto(v.nombre, 5, 'el nombre de la auditoría'),
    objetivo: texto(v.objetivo, 20, 'el objetivo'),
    unidadNegocioId: requerido(v.unidadNegocioId, 'Selecciona la unidad de negocio.'),
    tipo: requerido(v.tipo, 'Selecciona el tipo.'),
    fechaFin: v.fechaInicio && v.fechaFin && v.fechaFin < v.fechaInicio ? 'La fecha fin no puede ser anterior al inicio.' : null,
  }));

  // Seguridad matricial: sólo unidades de la Dirección del usuario (salvo Director)
  const unidades = (catalogos?.unidades ?? []).filter((u) => !usuario?.direccion || u.direccion === usuario.direccion);

  const cerrar = () => { f.reiniciar(); onCerrar(); };
  const guardar = async () => {
    let creada;
    const ok = await f.enviar(async (v) => { creada = await api.post('/auditorias', { ...v, unidadNegocioId: Number(v.unidadNegocioId) }); });
    if (ok) { f.reiniciar(); onCreada(creada); }
  };

  return (
    <Drawer
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Crear nueva auditoría"
      subtitulo="Se registra en la base de datos con folio AUD-###### y estado Pendiente."
      acciones={<><Button onClick={cerrar}>Cancelar</Button><Button variant="primary" icon="add" onClick={guardar} disabled={f.enviando}>{f.enviando ? 'Guardando…' : 'Crear auditoría'}</Button></>}
    >
      {f.errorGeneral && <Notice tono="error" titulo="No se pudo crear">{f.errorGeneral.message}</Notice>}
      <Input label="Nombre de la auditoría" placeholder="Ej. Control de inventarios · CEDIS Monterrey" {...f.campo('nombre')} />
      <Textarea label="Objetivo del trabajo" placeholder="¿Qué se va a validar y con qué alcance?" ayuda="Mínimo 20 caracteres con contenido." {...f.campo('objetivo')} />
      <Select label="Unidad de negocio" opciones={unidades.map((u) => ({ value: u.id, label: `${u.unidad} · ${u.direccion} (${u.pais})` }))} {...f.campo('unidadNegocioId')} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Tipo" opciones={['Operativa', 'Financiera', 'Cybersecurity', 'Cumplimiento'].map((t) => ({ value: t, label: t }))} {...f.campo('tipo')} />
        <Select label="Prioridad" placeholder="—" opciones={['Alta', 'Media', 'Baja'].map((t) => ({ value: t, label: t }))} {...f.campo('prioridad')} />
      </div>
      <Input label="Área auditada" placeholder="Ej. Cadena de suministro" {...f.campo('area')} />
      <div className="grid grid-cols-2 gap-3">
        <Input type="date" label="Fecha de inicio" {...f.campo('fechaInicio')} />
        <Input type="date" label="Fecha de fin" {...f.campo('fechaFin')} />
      </div>
    </Drawer>
  );
}
