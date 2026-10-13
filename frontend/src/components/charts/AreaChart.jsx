import { useId, useState } from 'react';

const ANCHO = 600;
const ALTO = 180;
const MARGEN = 14;

/** Curva monótona (Fritsch-Carlson): suave, sin pasarse por debajo de 0 ni por encima del máximo. */
function curva(pts) {
  if (pts.length < 2) return '';
  const n = pts.length;
  const dx = pts.slice(1).map((p, i) => p.x - pts[i].x);
  const m = pts.slice(1).map((p, i) => (p.y - pts[i].y) / dx[i]);
  const t = pts.map((_, i) => {
    if (i === 0) return m[0];
    if (i === n - 1) return m[n - 2];
    return m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const h = Math.hypot(a, b);
    if (h > 3) { t[i] = (3 * a * m[i]) / h; t[i + 1] = (3 * b * m[i]) / h; }
  }
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const c = dx[i] / 3;
    d += ` C${pts[i].x + c},${pts[i].y + t[i] * c} ${pts[i + 1].x - c},${pts[i + 1].y - t[i + 1] * c} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

const aPuntos = (valores, max) => valores.map((v, i) => ({
  x: (i / Math.max(1, valores.length - 1)) * ANCHO,
  y: ALTO - MARGEN - (max ? (v / max) * (ALTO - MARGEN * 2) : 0),
}));

/**
 * Área suave con degradado y una serie "fantasma" opcional detrás (por ejemplo, el total
 * cuando se filtra una severidad). Al pasar el cursor muestra el valor de cada semana.
 */
export default function AreaChart({ serie, fantasma, color = 'var(--color-brand)', unidad = '' }) {
  const id = useId().replace(/:/g, '');
  const [activo, setActivo] = useState(null);
  const valores = serie.map((s) => s.valor);
  const max = Math.max(1, ...valores, ...(fantasma ?? []));
  const pts = aPuntos(valores, max);
  const linea = curva(pts);
  const area = `${linea} L${ANCHO},${ALTO} L0,${ALTO} Z`;
  const lineaFantasma = fantasma ? curva(aPuntos(fantasma, max)) : null;

  const mover = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (serie.length - 1));
    setActivo(Math.max(0, Math.min(serie.length - 1, i)));
  };
  const p = activo != null ? pts[activo] : null;

  return (
    <div>
      <div className="relative h-[180px]" onMouseMove={mover} onMouseLeave={() => setActivo(null)}>
        {/* key: al cambiar de filtro la curva se vuelve a revelar de izquierda a derecha. */}
        <svg key={valores.join('-')} viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.28" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <clipPath id={`c${id}`}>
              <rect width={ANCHO} height={ALTO} className="origin-left animate-revelar" />
            </clipPath>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={ANCHO} y1={ALTO * f} y2={ALTO * f} stroke="var(--color-line-subtle)" vectorEffect="non-scaling-stroke" />
          ))}
          {lineaFantasma && <path d={lineaFantasma} fill="none" stroke="var(--color-line)" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
          <g clipPath={`url(#c${id})`}>
            <path d={area} fill={`url(#g${id})`} />
            <path d={linea} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
        {p && (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-px bg-line" style={{ left: `${(p.x / ANCHO) * 100}%` }} />
            <div className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{ left: `${(p.x / ANCHO) * 100}%`, top: `${(p.y / ALTO) * 100}%`, background: color }} />
            <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-[12px] font-bold text-white"
              style={{ left: `${(p.x / ANCHO) * 100}%`, top: `${(p.y / ALTO) * 100}%` }}>
              {serie[activo].valor}{unidad} · {serie[activo].etiqueta}
            </div>
          </>
        )}
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-faint">
        {serie.map((s, i) => <span key={i} className={i === activo ? 'text-ink' : ''}>{s.etiqueta}</span>)}
      </div>
    </div>
  );
}
