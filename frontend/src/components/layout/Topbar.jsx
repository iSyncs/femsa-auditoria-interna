import { Fragment } from 'react';
import { Link } from 'react-router';
import Icon from '../ui/Icon';

export default function Topbar({ migas = [], busqueda, onBusqueda, placeholder = 'Buscar…' }) {
  return (
    <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Ruta" className="flex items-center gap-2 text-[13px] text-muted">
        <Link to="/" className="hover:text-ink">Inicio</Link>
        {migas.map((m, i) => (
          <Fragment key={i}>
            <span className="text-faint">/</span>
            {m.to ? <Link to={m.to} className="hover:text-ink">{m.texto}</Link>
              : <span className={i === migas.length - 1 ? 'font-bold text-ink' : ''}>{m.texto}</span>}
          </Fragment>
        ))}
      </nav>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        {onBusqueda && (
          <label className="flex w-full min-w-[240px] items-center gap-2 rounded-full border border-line-subtle bg-subtle px-4 py-1.5 transition-colors focus-within:border-brand-border focus-within:bg-white sm:w-auto lg:min-w-[300px]">
            <Icon name="search" className="text-muted" />
            <input
              value={busqueda}
              onChange={(e) => onBusqueda(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="w-full bg-transparent text-[13px] text-ink outline-none"
            />
          </label>
        )}
      </div>
    </div>
  );
}
