import { useEffect } from 'react';
import Button from './Button';

/** Recuadro centrado para ver listas completas sin cambiar de página. */
export default function Modal({ abierto, titulo, subtitulo, onCerrar, children }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const esc = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div onClick={onCerrar} className="absolute inset-0 animate-aparecer bg-slate-900/25 backdrop-blur-[1px]" />
      <div role="dialog" aria-modal="true" aria-label={titulo}
        className="relative flex max-h-[80vh] w-full max-w-[620px] animate-entrada flex-col rounded-outer bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <div className="text-[17px] font-extrabold text-ink">{titulo}</div>
            {subtitulo && <div className="mt-0.5 text-xs text-muted">{subtitulo}</div>}
          </div>
          <Button variant="ghost" icon="close" onClick={onCerrar} aria-label="Cerrar" />
        </div>
        <div className="overflow-y-auto px-6 py-3">{children}</div>
      </div>
    </div>
  );
}
