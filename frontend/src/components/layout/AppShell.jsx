import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import Sidebar from './Sidebar';
import Icon from '../ui/Icon';

export default function AppShell() {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const lienzo = useRef(null);

  useEffect(() => { lienzo.current?.scrollTo({ top: 0 }); }, [pathname]);

  useEffect(() => {
    if (!menu) return undefined;
    const esc = (e) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [menu]);

  return (
    <div className="min-h-screen px-3 pb-5 pt-3 sm:px-[18px] sm:pt-4 md:h-screen md:overflow-hidden md:pb-4 print:block print:h-auto print:overflow-visible print:p-0">
      <header className="no-print mb-3 flex items-center justify-between px-1 md:hidden">
        <div className="text-lg font-extrabold tracking-tight">FEMSA</div>
        <button
          type="button"
          onClick={() => setMenu(true)}
          aria-label="Abrir menú"
          aria-expanded={menu}
          className="grid size-10 place-items-center rounded-full bg-white text-ink shadow-card transition-transform active:scale-95"
        >
          <Icon name="menu" size={20} />
        </button>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 animate-aparecer bg-slate-900/30" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 w-[270px] animate-deslizar bg-frame px-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setMenu(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-4 grid size-9 place-items-center rounded-full text-muted hover:bg-white"
            >
              <Icon name="close" size={20} />
            </button>
            <Sidebar onNavegar={() => setMenu(false)} />
          </div>
        </div>
      )}

      <div className="app-shell mx-auto grid min-h-[calc(100vh-36px)] max-w-[1720px] grid-cols-1 gap-3.5 md:h-full md:min-h-0 md:grid-cols-[215px_minmax(0,1fr)] print:block print:h-auto">
        <div className="hidden min-h-0 md:block"><Sidebar /></div>
        <main ref={lienzo} className="app-canvas print-full flex min-w-0 flex-col rounded-outer bg-white px-4 pb-11 pt-6 shadow-canvas sm:px-5 md:min-h-0 md:overflow-y-auto md:px-9 md:pt-7 print:overflow-visible">
          <div key={pathname} className="animate-pagina">
            <Outlet />
          </div>
          <footer className="no-print mt-auto flex flex-wrap justify-between gap-2 border-t border-line pt-4 text-[12px] text-muted">
            <span>Sistema de Auditoría Interna FEMSA · Equipo 2</span>
            <span>Fechas en tu zona horaria ({Intl.DateTimeFormat().resolvedOptions().timeZone}); almacenadas en UTC</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
