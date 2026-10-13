export function Card({ children, className = '', ...props }) {
  return <div className={`rounded-card border border-line bg-white p-5 shadow-card ${className}`} {...props}>{children}</div>;
}

/** Contenedor gris del mockup (panel) con tarjetas blancas dentro. */
export function Panel({ titulo, subtitulo, accion, children, className = '' }) {
  return (
    <section className={`rounded-card border border-line bg-subtle p-5 ${className}`}>
      {(titulo || accion) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[14.5px] font-extrabold text-ink">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-xs text-muted">{subtitulo}</p>}
          </div>
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tile({ children, className = '' }) {
  return <div className={`rounded-inner border border-line bg-white p-4 ${className}`}>{children}</div>;
}

export function CardHead({ titulo, subtitulo, accion }) {
  return (
    <div className="mb-3.5 flex items-start justify-between gap-3">
      <div>
        <div className="text-[15px] font-extrabold text-ink">{titulo}</div>
        {subtitulo && <div className="mt-0.5 text-[12px] text-muted">{subtitulo}</div>}
      </div>
      {accion}
    </div>
  );
}
