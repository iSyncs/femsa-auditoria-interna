import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

/** Carga `path` y expone { data, error, cargando, recargar }. `path` null = no cargar. */
export function useApi(path) {
  const [version, setVersion] = useState(0);
  const [estado, setEstado] = useState({ data: null, error: null, clave: null });
  const clave = path ? `${path}#${version}` : null;

  useEffect(() => {
    if (!path) return undefined;
    let vigente = true;
    api.get(path)
      .then((data) => vigente && setEstado({ data, error: null, clave: `${path}#${version}` }))
      .catch((error) => vigente && setEstado({ data: null, error, clave: `${path}#${version}` }));
    return () => { vigente = false; };
  }, [path, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { data: estado.data, error: estado.error, cargando: !!clave && estado.clave !== clave, recargar };
}
