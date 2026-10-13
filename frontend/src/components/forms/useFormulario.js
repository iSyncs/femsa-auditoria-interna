import { useState } from 'react';
import { ApiError } from '../../api/client';

/**
 * Estado de formulario con validación en cliente + errores del servidor (422 -> por campo).
 * `validar(valores)` regresa { campo: mensaje|null }.
 */
export function useFormulario(inicial, validar) {
  const [valores, setValores] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const campo = (nombre) => ({
    name: nombre,
    value: valores[nombre] ?? '',
    error: errores[nombre],
    onChange: (e) => {
      setValores((v) => ({ ...v, [nombre]: e.target.value }));
      if (errores[nombre]) setErrores((er) => ({ ...er, [nombre]: null }));
    },
  });

  async function enviar(accion) {
    const locales = Object.fromEntries(Object.entries(validar(valores)).filter(([, m]) => m));
    setErrores(locales);
    setErrorGeneral(null);
    if (Object.keys(locales).length) return false;
    setEnviando(true);
    try {
      await accion(valores);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.detalles && !Array.isArray(err.detalles) && typeof err.detalles === 'object') {
        setErrores(err.detalles);
      }
      setErrorGeneral(err);
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return { valores, setValores, errores, errorGeneral, enviando, campo, enviar, reiniciar: () => { setValores(inicial); setErrores({}); setErrorGeneral(null); } };
}
