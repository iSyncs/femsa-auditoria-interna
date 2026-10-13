import { useState } from 'react';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import Notice from '../ui/Notice';
import { Textarea } from '../ui/Field';
import { texto } from '../../lib/validacion';

/** Aprobar / Rechazar (cadena de firmas de cierre o validación de planes). El rechazo exige motivo. */
export default function Decision({ abierto, titulo, subtitulo, aviso, onCerrar, onDecidir }) {
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState(null);
  const [falla, setFalla] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cerrar = () => { setComentario(''); setError(null); setFalla(null); onCerrar(); };
  const decidir = async (decision) => {
    const e = decision === 'rechazado' ? texto(comentario, 20, 'el motivo del rechazo') : null;
    setError(e);
    if (e) return;
    setEnviando(true);
    try {
      await onDecidir(decision, comentario.trim() || null);
      cerrar();
    } catch (err) {
      setFalla(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Drawer
      abierto={abierto}
      onCerrar={cerrar}
      titulo={titulo}
      subtitulo={subtitulo}
      acciones={<>
        <Button variant="danger" icon="block" onClick={() => decidir('rechazado')} disabled={enviando}>Rechazar</Button>
        <Button variant="primary" icon="verified" onClick={() => decidir('aprobado')} disabled={enviando}>Aprobar</Button>
      </>}
    >
      {falla && <Notice tono="error" titulo="No se registró la decisión">{falla.message}</Notice>}
      {aviso && <Notice tono="warn">{aviso}</Notice>}
      <Textarea
        label="Comentarios"
        name="comentario"
        value={comentario}
        error={error}
        onChange={(e) => { setComentario(e.target.value); setError(null); }}
        ayuda="Obligatorio al rechazar (mínimo 20 caracteres con contenido)."
        rows={5}
      />
    </Drawer>
  );
}
