/** Dona con conic-gradient (como el mockup). segmentos: [{ etiqueta, valor, color, nota }] */
export default function Donut({ segmentos, centro, leyendaCentro }) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0) || 1;
  const cortes = segmentos.map((_, i) => segmentos.slice(0, i + 1).reduce((s, x) => s + x.valor, 0));
  const gradiente = segmentos
    .map((s, i) => `${s.color} ${((cortes[i] - s.valor) / total) * 100}% ${(cortes[i] / total) * 100}%`)
    .join(', ');
  return (
    <div>
      <div className="mx-auto mb-3 mt-1.5 flex h-[150px] w-[150px] items-center justify-center rounded-full" style={{ background: `conic-gradient(${gradiente})` }}>
        <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-white">
          <div className="text-[30px] font-extrabold tracking-tight text-ink">{centro}</div>
          <div className="text-[11px] font-bold text-muted">{leyendaCentro}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {segmentos.map((s) => (
          <div key={s.etiqueta} className="flex flex-col gap-0.5 text-[12px]">
            <span className="flex items-center gap-1.5 font-extrabold text-ink">
              <span className="inline-block h-[9px] w-[9px] rounded-[3px]" style={{ background: s.color }} />
              {s.valor} {s.etiqueta}
            </span>
            {s.nota && <span className="ml-[15px] text-[11px] text-muted">{s.nota}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
