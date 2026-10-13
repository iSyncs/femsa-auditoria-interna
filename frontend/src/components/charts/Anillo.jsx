/**
 * Anillo de progreso. `punteado` lo dibuja con segmentos (estilo "cache hit rate"):
 * los segmentos dentro del porcentaje van en color y el resto en gris.
 */
export default function Anillo({ valor, total = 100, color = 'var(--color-brand)', tam = 44, grosor = 4, punteado = false, children }) {
  const pct = total > 0 ? Math.min(1, valor / total) : 0;
  const r = (tam - grosor) / 2;
  const c = tam / 2;

  if (punteado) {
    const n = 24;
    return (
      <span className="relative inline-grid place-items-center" style={{ width: tam, height: tam }}>
        <svg width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`} aria-hidden="true">
          {Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            const lleno = i < Math.round(pct * n);
            return (
              <line key={i} x1={c + Math.cos(a) * (r - grosor)} y1={c + Math.sin(a) * (r - grosor)}
                x2={c + Math.cos(a) * r} y2={c + Math.sin(a) * r}
                stroke={lleno ? color : 'var(--color-line)'} strokeWidth={grosor * 0.55} strokeLinecap="round"
                className="animate-aparecer" style={{ animationDelay: `${i * 18}ms` }} />
            );
          })}
        </svg>
        {children && <span className="absolute">{children}</span>}
      </span>
    );
  }

  const L = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: tam, height: tam }}>
      <svg width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`} className="-rotate-90" aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--color-line-subtle)" strokeWidth={grosor} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round"
          strokeDasharray={L} strokeDashoffset={L * (1 - pct)} className="transition-[stroke-dashoffset] duration-700 ease-out" />
      </svg>
      {children && <span className="absolute">{children}</span>}
    </span>
  );
}
