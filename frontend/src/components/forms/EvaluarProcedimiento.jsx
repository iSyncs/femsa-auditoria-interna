import { api } from '../../api/client';
import { requerido, texto } from '../../lib/validacion';
import Button from '../ui/Button';
import Drawer from '../ui/Drawer';
import { Select, Textarea } from '../ui/Field';
import Notice from '../ui/Notice';
import { useFormulario } from './useFormulario';

const MADUREZ = ['Inicial', 'Funcional', 'Definido', 'Administrado', 'Optimizado'];
const opciones = (valores) => valores.map((value) => ({ value, label: value }));

export default function EvaluarProcedimiento({ abierto, auditoriaId, procedimiento, onCerrar, onGuardado }) {
  const inicial = {
    diseno: procedimiento?.calif_diseno ?? '',
    efectividad: procedimiento?.calif_efectividad ?? '',
    vulnerabilidad: procedimiento?.vulnerabilidad ?? '',
    comentarios: procedimiento?.comentarios ?? '',
  };
  const f = useFormulario(inicial, (v) => ({
    diseno: requerido(v.diseno, 'Selecciona la madurez de diseño.'),
    efectividad: requerido(v.efectividad, 'Selecciona la efectividad.'),
    vulnerabilidad: requerido(v.vulnerabilidad, 'Selecciona la vulnerabilidad histórica.'),
    comentarios: ['Inicial', 'Funcional'].includes(v.efectividad)
      ? texto(v.comentarios, 20, 'la justificación técnica') : null,
  }));

  const cerrar = () => { f.reiniciar(); onCerrar(); };
  const guardar = async () => {
    let resultado;
    const ok = await f.enviar(async (v) => {
      resultado = await api.post(`/auditorias/${auditoriaId}/procedimientos/${procedimiento.id}/evaluacion`, v);
    });
    if (ok) { f.reiniciar(); onGuardado(resultado); }
  };

  return (
    <Drawer abierto={abierto} onCerrar={cerrar} titulo="Evaluar control"
      subtitulo={`${procedimiento?.tracking_id ?? ''} · ${procedimiento?.control ?? ''}`}
      acciones={<><Button onClick={cerrar}>Cancelar</Button><Button variant="primary" icon="save" onClick={guardar} disabled={f.enviando}>{f.enviando ? 'Guardando…' : 'Guardar evaluación'}</Button></>}>
      {f.errorGeneral && <Notice tono="error" titulo="No se pudo guardar">{f.errorGeneral.message}</Notice>}
      <Notice tono="info" titulo="Avance automático">Al guardar, el procedimiento pasa a Evaluado (70%). La revisión y supervisión lo elevan a 80% y 100%.</Notice>
      <Select label="Madurez de diseño" opciones={opciones(MADUREZ)} {...f.campo('diseno')} />
      <Select label="Efectividad" opciones={opciones(MADUREZ)} {...f.campo('efectividad')} />
      <Select label="Vulnerabilidad histórica" opciones={opciones(['Bajo', 'Moderado', 'Alto'])} {...f.campo('vulnerabilidad')} />
      <Textarea label="Justificación técnica"
        ayuda={['Inicial', 'Funcional'].includes(f.valores.efectividad) ? 'Obligatoria: mínimo 20 caracteres con contenido real.' : 'Opcional para esta calificación.'}
        {...f.campo('comentarios')} />
    </Drawer>
  );
}
