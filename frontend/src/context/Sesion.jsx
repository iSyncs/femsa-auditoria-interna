import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { alNoAutorizado, api, setUsuarioActual } from '../api/client';

const SesionContext = createContext(null);
const CLAVE = 'femsa.sesion';

/*
 * Sesión del usuario.
 * - iniciar(correo, contraseña): POST /api/sesion, valida contra la base (hoy: José Martínez).
 * - entrarTest(): POST /api/sesion/demo, entra directo con la cuenta de José Martínez mientras
 *   no estén los datos de prueba del Sprint 2.
 * La sesión se guarda solo en sessionStorage (se borra al cerrar la pestaña). Si el id ya no existe
 * (por ejemplo, al cambiar entre memoria y SQL) la API responde 401 y se regresa al login.
 * TODO FE1S-2 HU_01 (Carlos): inicio de sesión con Microsoft Entra ID (MSAL). La API valida el token
 * de Entra, ubica al usuario por correo y emite la sesión; la cuenta de prueba queda solo para pruebas.
 */
function leerGuardada() {
  try {
    const u = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null');
    if (u?.id) setUsuarioActual(u.id);
    return u;
  } catch {
    return null;
  }
}

function guardar(u) {
  try {
    if (u) sessionStorage.setItem(CLAVE, JSON.stringify(u));
    else sessionStorage.removeItem(CLAVE);
  } catch { /* sin almacenamiento: la sesión vive solo en memoria */ }
}

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(leerGuardada);

  const abrir = useCallback((u) => {
    setUsuarioActual(u.id);
    guardar(u);
    setUsuario(u);
  }, []);

  const cerrar = useCallback(() => {
    setUsuarioActual(null);
    guardar(null);
    setUsuario(null);
  }, []);

  useEffect(() => { alNoAutorizado(cerrar); }, [cerrar]);

  const iniciar = useCallback(async (correo, contrasena) => {
    abrir(await api.post('/sesion', { correo, contrasena, zonaHoraria: api.zona }));
  }, [abrir]);

  const entrarTest = useCallback(async () => {
    abrir(await api.post('/sesion/demo'));
  }, [abrir]);

  return <SesionContext.Provider value={{ usuario, iniciar, entrarTest, cerrar }}>{children}</SesionContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export const useSesion = () => useContext(SesionContext);
