import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import { useSesion } from '../../context/Sesion';
import { puede } from '../../lib/permisos';

// Cada grupo tiene una ruta base; sus hijos son vistas filtradas (?vista=) o páginas propias.
const grupos = (usuario) => [
  {
    id: 'auditorias', texto: 'Auditorías', icon: 'layers', base: '/auditorias',
    hijos: [
      { texto: 'Todas', to: '/auditorias?vista=todas' },
      { texto: 'En ejecución', to: '/auditorias?vista=en_ejecucion' },
      { texto: 'En aprobación', to: '/auditorias?vista=en_aprobacion' },
      { texto: 'Solicitudes de información', to: '/auditorias/solicitudes', nuevo: true },
    ],
  },
  {
    id: 'hallazgos', texto: 'Hallazgos', icon: 'warning', base: '/hallazgos',
    hijos: [
      { texto: 'Críticos abiertos', to: '/hallazgos?vista=Crítica' },
      { texto: 'Sin responsable', to: '/hallazgos?vista=sin_resp' },
      { texto: 'Todos', to: '/hallazgos?vista=todos' },
    ],
  },
  {
    id: 'seguimiento', texto: 'Planes de remediación', icon: 'task_alt', base: '/seguimiento',
    hijos: [
      { texto: 'Todos', to: '/seguimiento?vista=todos' },
      { texto: 'Demorados', to: '/seguimiento?vista=demorado' },
      { texto: 'Por vencer', to: '/seguimiento?vista=por_vencer' },
      { texto: 'Bitácora de avances', to: '/seguimiento/avances', nuevo: true },
    ],
  },
  {
    id: 'ia', texto: 'Inteligencia artificial', icon: 'psychology', base: '/ia',
    hijos: [
      { texto: 'Bandeja de lotes', to: '/ia/lotes', nuevo: true },
      { texto: 'Sugerencias pendientes', to: '/ia/sugerencias', nuevo: true },
      { texto: 'Asistente FEMSA AI', to: '/ia', exacto: true },
    ],
  },
  {
    id: 'informes', texto: 'Informes y control', icon: 'analytics', base: '/informes',
    hijos: [
      puede.verReporte(usuario) && { texto: 'Reporte ejecutivo', to: '/reporte' },
      puede.verBitacora(usuario) && { texto: 'Bitácora del sistema', to: '/bitacora' },
    ].filter(Boolean),
  },
];

const ruta = (to) => to.split('?')[0];

/** Un hijo está activo si coinciden la ruta y, cuando la trae, la vista. */
function hijoActivo(hijo, { pathname, search }) {
  const [path, query] = hijo.to.split('?');
  if (!query) return pathname === path || (!hijo.exacto && pathname.startsWith(`${path}/`));
  if (pathname !== path) return false;
  return new URLSearchParams(search).get('vista') === new URLSearchParams(query).get('vista');
}

const grupoDeRuta = (lista, pathname) =>
  lista.find((g) => pathname.startsWith(g.base) || g.hijos.some((h) => pathname === ruta(h.to)))?.id ?? null;

function Enlace({ to, icon, children, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex min-h-[33px] items-center gap-3 whitespace-nowrap px-3.5 py-[7.5px] text-[13px] transition-colors
         ${isActive
           ? "font-bold text-brand before:absolute before:left-0 before:top-1/2 before:h-[18px] before:w-[3.5px] before:-translate-y-1/2 before:rounded-r before:bg-brand before:content-['']"
           : 'font-medium text-[#333945] rounded-r-[10px] hover:bg-slate-900/[0.04] hover:text-ink'}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} size={18} className={isActive ? 'text-brand' : 'text-slate-500'} />
          <span>{children}</span>
        </>
      )}
    </NavLink>
  );
}

function Grupo({ grupo, abierto, activo, onAlternar, onNavegar }) {
  const ubicacion = useLocation();
  const navegar = useNavigate();
  if (grupo.hijos.length === 0) return null;
  return (
    <div>
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => {
          onAlternar();
          if (!abierto && !activo) { navegar(grupo.hijos[0].to); onNavegar?.(); }
        }}
        className={`group relative flex min-h-[33px] w-full items-center gap-3 whitespace-nowrap px-3.5 py-[7.5px] text-left text-[13px] transition-colors
          ${activo
            ? "font-bold text-brand before:absolute before:left-0 before:top-1/2 before:h-[18px] before:w-[3.5px] before:-translate-y-1/2 before:rounded-r before:bg-brand before:content-['']"
            : 'rounded-r-[10px] font-medium text-[#333945] hover:bg-slate-900/[0.04] hover:text-ink'}`}
      >
        <Icon name={grupo.icon} size={18} className={activo ? 'text-brand' : 'text-slate-500'} />
        <span className="flex-1">{grupo.texto}</span>
        <Icon name="expand_more" size={16}
          className={`text-slate-400 transition-transform duration-200 ease-out ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {/* Despliegue: la fila del grid pasa de 0fr a 1fr; la lista se desvanece y baja 4px. */}
      <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <ul
            inert={!abierto}
            className={`mb-1 ml-[26px] border-l border-line py-0.5 pl-2.5 transition-[opacity,transform] duration-200 ease-out
              ${abierto ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`}
          >
            {grupo.hijos.map((h) => {
              const on = hijoActivo(h, ubicacion);
              return (
                <li key={h.to}>
                  <Link
                    to={h.to}
                    onClick={onNavegar}
                    aria-current={on ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-[5.5px] text-[13px] transition-colors
                      ${on ? 'bg-brand-light/70 font-bold text-brand' : 'font-medium text-muted hover:bg-slate-900/[0.04] hover:text-ink'}`}
                  >
                    <span className="truncate">{h.texto}</span>
                    {h.nuevo && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-brand-mid" title="Nuevo en Sprint 2" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

const Seccion = ({ children }) => (
  <div className="px-3.5 pb-1.5 pt-4 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-faint">{children}</div>
);

export default function Sidebar({ onNavegar }) {
  const { usuario, cerrar } = useSesion();
  const { pathname } = useLocation();
  const lista = grupos(usuario);
  const actual = grupoDeRuta(lista, pathname);
  const [abierto, setAbierto] = useState(actual);

  // Al cambiar de página, se abre el grupo que la contiene (solo uno a la vez).
  useEffect(() => { if (actual) setAbierto(actual); }, [actual]);

  const g = (id) => {
    const grupo = lista.find((x) => x.id === id);
    return (
      <Grupo grupo={grupo} abierto={abierto === id} activo={actual === id} onNavegar={onNavegar}
        onAlternar={() => setAbierto((a) => (a === id ? null : id))} />
    );
  };

  return (
    <aside className="no-print flex h-full flex-col overflow-y-auto pb-4 pt-2">
      <div className="px-3.5 pb-6 pt-2 text-xl font-extrabold tracking-tight text-ink">FEMSA</div>
      <Seccion>Ejecución</Seccion>
      <Enlace onClick={onNavegar} to="/" icon="dashboard" end>Dashboard</Enlace>
      {g('auditorias')}
      {g('hallazgos')}
      <Seccion>Seguimiento</Seccion>
      {g('seguimiento')}
      <Seccion>Inteligencia artificial</Seccion>
      {g('ia')}
      <Seccion>Informes y control</Seccion>
      {g('informes')}
      <div className="mt-auto border-t border-black/5 px-3.5 pt-3.5">
        <div className="flex items-center gap-2.5">
          <Avatar nombre={usuario?.nombre} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-ink">{usuario?.nombre}</div>
            <div className="truncate text-[11px] text-muted">{usuario?.rol_nombre}{usuario?.direccion ? ` · ${usuario.direccion}` : ''}</div>
          </div>
          <button type="button" onClick={cerrar} aria-label="Cerrar sesión" title="Cerrar sesión"
            className="grid size-8 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-900/[0.05] hover:text-ink">
            <Icon name="logout" size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
