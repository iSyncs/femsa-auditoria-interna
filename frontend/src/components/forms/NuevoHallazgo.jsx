import { api } from '../../api/client';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import Notice from '../ui/Notice';
import { Input, Select, Textarea } from '../ui/Field';
import { useFormulario } from './useFormulario';
import { requerido, texto } from '../../lib/validacion';

/** F_04: registro metodológico (condición, criterio, causa, efecto, recomendación) */
export default function NuevoHallazgo({ abierto, onCerrar, onCreado, auditorias = [], auditoriaFija, procedimientos = [] }) {
  const f = useFormulario(
    { auditoriaId: auditoriaFija ?? '', procedimientoId: '', titulo: '', condicion: '', criterio: '', causa: '', efecto: '', recomendacion: '', severidad: '', tipo: '', impactoMxn: '' },
    (v) => ({
      auditoriaId: requerido(v.auditoriaId, 'Selecciona la auditoría.'),
      titulo: texto(v.titulo, 5, 'el título'),
      condicion: texto(v.condicion, 20, 'la condición detectada'),
      criterio: texto(v.criterio, 10, 'el criterio incumplido'),
      causa: texto(v.causa, 10, 'la causa raíz'),
      efecto: texto(v.efecto, 10, 'el efecto o impacto'),
      recomendacion: texto(v.recomendacion, 10, 'la recomendación'),
      severidad: requerido(v.severidad, 'Selecciona la severidad.'),
      tipo: requerido(v.tipo, 'Selecciona el tipo.'),
      impactoMxn: v.impactoMxn !== '' && !(Number(v.impactoMxn) >= 0) ? 'Captura un monto válido en MXN.' : null,
    }),
  );
  const cerrar = () => { f.reiniciar(); onCerrar(); };
  const guardar = async () => {
    let creado;
    const ok = await f.enviar(async (v) => {
      creado = await api.post('/hallazgos', { ...v, auditoriaId: Number(v.auditoriaId), procedimientoId: v.procedimientoId ? Number(v.procedimientoId) : null });
    });
    if (ok) { f.reiniciar(); onCreado(creado); }
  };

  return (
    <Drawer
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Registrar hallazgo"
      subtitulo="Registro metodológico (GIAS). Se asigna folio FND-###### automáticamente."
      acciones={<><Button onClick={cerrar}>Cancelar</Button><Button variant="primary" icon="add_task" onClick={guardar} disabled={f.enviando}>{f.enviando ? 'Guardando…' : 'Registrar'}</Button></>}
    >
      {f.errorGeneral && <Notice tono="error" titulo="No se pudo registrar">{f.errorGeneral.message}</Notice>}
      {!auditoriaFija && (
        <Select label="Auditoría" opciones={auditorias.map((a) => ({ value: a.id, label: `${a.tracking_id} · ${a.nombre}` }))} {...f.campo('auditoriaId')} />
      )}
      {procedimientos.length > 0 && (
        <Select label="Procedimiento evaluado (opcional)" placeholder="Sin vincular" opciones={procedimientos.map((p) => ({ value: p.id, label: `${p.tracking_id} · ${p.control}` }))} {...f.campo('procedimientoId')} />
      )}
      <Input label="Título" placeholder="Ej. Ajustes manuales sin soporte documental" {...f.campo('titulo')} />
      <Textarea label="Condición (qué pasó)" {...f.campo('condicion')} />
      <Textarea label="Criterio (norma o política incumplida)" {...f.campo('criterio')} />
      <Textarea label="Causa raíz" {...f.campo('causa')} />
      <Textarea label="Efecto / impacto potencial" {...f.campo('efecto')} />
      <Textarea label="Recomendación" {...f.campo('recomendacion')} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Severidad" opciones={['Crítica', 'Alta', 'Moderada', 'Baja'].map((s) => ({ value: s, label: s }))} {...f.campo('severidad')} />
        <Select label="Tipo" opciones={['Debilidad de control', 'Debilidad menor'].map((s) => ({ value: s, label: s }))} {...f.campo('tipo')} />
      </div>
      <Input type="number" min="0" step="1000" label="Impacto estimado (MXN)" placeholder="Opcional" {...f.campo('impactoMxn')} />
    </Drawer>
  );
}
