/** Barras verticales con etiqueta. barras: [{ etiqueta, valor, color }] */
export default function Bars({ barras }) {
  const max = Math.max(1, ...barras.map((b) => b.valor));
  return (
    <div>
      <div className="mt-3.5 flex h-[110px] items-end gap-2.5">
        {barras.map((b, i) => (
          <div key={b.etiqueta} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${b.etiqueta}: ${b.valor}`}>
            <span className="text-[11px] font-extrabold text-ink">{b.valor}</span>
            <div
              className="w-full origin-bottom animate-crecer rounded-t-md"
              style={{ height: `${Math.max(6, (b.valor / max) * 85)}px`, background: b.color, animationDelay: `${i * 70}ms` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2.5">
        {barras.map((b) => <span key={b.etiqueta} className="flex-1 truncate text-center text-[11px] font-bold text-muted">{b.etiqueta}</span>)}
      </div>
    </div>
  );
}
