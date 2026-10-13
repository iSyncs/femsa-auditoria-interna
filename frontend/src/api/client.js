// Cliente HTTP de la API. El navegador nunca conoce credenciales de BD: sólo llama a /api.
const ZONA = Intl.DateTimeFormat().resolvedOptions().timeZone;
let usuarioId = null;

let noAutorizado = () => {};

export const setUsuarioActual = (id) => { usuarioId = id; };
export const alNoAutorizado = (fn) => { noAutorizado = fn; };

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error ?? `Error ${status}`);
    this.status = status;
    this.detalles = body?.detalles;
  }
}

async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(usuarioId ? { 'X-Usuario-Id': String(usuarioId) } : {}),
      'X-Zona-Horaria': ZONA,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (res.status === 401 && usuarioId) noAutorizado();
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  zona: ZONA,
};
