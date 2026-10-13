/** Gráfica de línea con área (estilo del mockup). serie: [{ etiqueta, valor }] */
export default function LineChart({ serie, meta, sufijo = '' }) {
  const W = 700, H = 210, x0 = 40, x1 = 680, y0 = 20, y1 = 200;
  const max = Math.max(1, ...serie.map((p) => p.valor), ...(meta ?? []).map((p) => p.valor));
  const tope = Math.ceil(max * 1.25);
  const px = (i) => x0 + (i * (x1 - x0)) / Math.max(1, serie.length - 1);
  const py = (v) => y1 - (v / tope) * (y1 - y0);
  const linea = (s) => s.map((p, i) => `${i ? 'L' : 'M'}${px(i)},${py(p.valor)}`).join(' ');
  const idxMax = serie.reduce((m, p, i) => (p.valor > serie[m].valor ? i : m), 0);
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(tope * (1 - f)));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-[210px] w-full" role="img" aria-label="Gráfica de línea">
        <defs>
          <linearGradient id="relleno" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {marcas.map((m, i) => (
          <g key={i}>
            <line x1={x0} x2={x1 + 10} y1={y0 + (i * (y1 - y0)) / 4} y2={y0 + (i * (y1 - y0)) / 4} stroke={i === 4 ? 'var(--color-line)' : 'var(--color-line-subtle)'} />
            <text x={4} y={y0 + (i * (y1 - y0)) / 4 + 4} fontSize="11" fontWeight="700" fill="var(--color-faint)">{m}{sufijo}</text>
          </g>
        ))}
        <path d={`${linea(serie)} L${px(serie.length - 1)},${y1} L${px(0)},${y1} Z`} fill="url(#relleno)" />
        {meta && <path d={linea(meta)} fill="none" stroke="var(--color-faint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 5" />}
        <path d={linea(serie)} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={px(idxMax)} x2={px(idxMax)} y1={y0} y2={y1} stroke="var(--color-line)" strokeDasharray="3 3" />
        <circle cx={px(idxMax)} cy={py(serie[idxMax].valor)} r="5" fill="#fff" stroke="var(--color-brand)" strokeWidth="3" />
      </svg>
      <div
        className="pointer-events-none absolute animate-aparecer whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[11px] font-bold text-white"
        style={{ left: `min(calc(${(px(idxMax) / W) * 100}% - 30px), calc(100% - 64px))`, top: `${(py(serie[idxMax].valor) / H) * 210 - 38}px` }}
      >
        {serie[idxMax].valor}{sufijo} · pico
      </div>
      <div className="ml-10 mt-1.5 flex justify-between text-[11px] font-bold text-muted">
        {serie.map((p) => <span key={p.etiqueta}>{p.etiqueta}</span>)}
      </div>
    </div>
  );
}
