import Icon from './Icon';
import Notice from './Notice';

export function Cargando({ texto = 'Cargando datos…' }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted">
      <Icon name="progress_activity" className="animate-spin" /> {texto}
    </div>
  );
}

export function ErrorCarga({ error }) {
  if (error?.status === 404 && /Ruta no encontrada/.test(error.message)) {
    return <Notice tono="info" titulo="Módulo en desarrollo">Este módulo todavía no está disponible en la API de NestJS. Se habilitará cuando se implemente su historia de usuario.</Notice>;
  }
  return <Notice tono="error" titulo="No se pudo cargar la información">{error?.message ?? 'Error desconocido.'}</Notice>;
}

export function Vacio({ icono = 'inbox', texto }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-[13px] text-muted">
      <Icon name={icono} size={26} className="text-faint" />
      {texto}
    </div>
  );
}
