import { useEffect } from 'react';
import Button from './Button';

/** Panel lateral (quick panel del mockup) para formularios y detalles. */
export default function Drawer({ abierto, titulo, subtitulo, onCerrar, children, acciones }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const esc = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [abierto, onCerrar]);

  return (
    <>
      <div
        onClick={onCerrar}
        className={`fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] transition-opacity ${abierto ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[460px] flex-col bg-white transition-[transform,visibility,box-shadow] duration-200 ${abierto ? 'visible translate-x-0 shadow-2xl' : 'invisible translate-x-full shadow-none'}`}
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <div className="text-[17px] font-extrabold text-ink">{titulo}</div>
            {subtitulo && <div className="mt-0.5 text-xs text-muted">{subtitulo}</div>}
          </div>
          <Button variant="ghost" icon="close" onClick={onCerrar} aria-label="Cerrar" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{abierto && children}</div>
        {acciones && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{acciones}</div>}
      </aside>
    </>
  );
}
