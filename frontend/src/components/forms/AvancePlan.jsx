import { api } from '../../api/client';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import Notice from '../ui/Notice';
import { Input, Textarea } from '../ui/Field';
import { useFormulario } from './useFormulario';
import { texto } from '../../lib/validacion';

/** F_10: captura de avance del plan de remediación */
export default function AvancePlan({ plan, onCerrar, onGuardado }) {
  const f = useFormulario({ avance: String(plan?.avance_pct ?? 0), comentario: '' }, (v) => ({
    avance: !/^\d+$/.test(v.avance) || Number(v.avance) > 100 ? 'Captura un porcentaje entero de 0 a 100.'
      : Number(v.avance) < (plan?.avance_pct ?? 0) ? `No puede ser menor al último avance (${plan.avance_pct}%).` : null,
    comentario: texto(v.comentario, 10, 'el comentario de avance'),
  }));
  const cerrar = () => { f.reiniciar(); onCerrar(); };
  const guardar = async () => {
    let r;
    if (await f.enviar(async (v) => { r = await api.post(`/planes/${plan.id}/avances`, { avance: Number(v.avance), comentario: v.comentario }); })) {
      f.reiniciar(); onGuardado(r);
    }
  };
  return (
    <Drawer
      abierto={!!plan}
      onCerrar={cerrar}
      titulo={`Registrar avance · ${plan?.tracking_id ?? ''}`}
      subtitulo={plan?.descripcion}
      acciones={<><Button onClick={cerrar}>Cancelar</Button><Button variant="primary" icon="save" onClick={guardar} disabled={f.enviando}>Guardar avance</Button></>}
    >
      {f.errorGeneral && <Notice tono="error" titulo="No se guardó el avance">{f.errorGeneral.message}</Notice>}
      <Notice tono="info">Al llegar a 100% el plan pasa a <b>revisión de Control Interno (GRC)</b> y después a la Jefatura de Auditoría.</Notice>
      <Input type="number" min="0" max="100" label="Avance (%)" {...f.campo('avance')} />
      <Textarea label="Comentario y evidencia de implementación" ayuda="Describe qué se hizo; mínimo 10 caracteres con contenido." {...f.campo('comentario')} />
    </Drawer>
  );
}
