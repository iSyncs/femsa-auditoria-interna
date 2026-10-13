const TONOS = {
  brand: 'bg-brand-light text-brand',
  ok: 'bg-ok-bg text-ok',
  warn: 'bg-warn-bg text-warn',
  info: 'bg-info-bg text-info',
  neutral: 'bg-slate-200/70 text-muted',
};

export default function Badge({ tono = 'neutral', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-bold ${TONOS[tono]} ${className}`}>
      {children}
    </span>
  );
}

/** Badge a partir de un catálogo { clave: { texto, tono } } */
export function EstadoBadge({ catalogo, valor }) {
  const e = catalogo[valor] ?? { texto: valor, tono: 'neutral' };
  return <Badge tono={e.tono}>{e.texto}</Badge>;
}
