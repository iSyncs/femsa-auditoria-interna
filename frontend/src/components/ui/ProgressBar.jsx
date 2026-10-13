export default function ProgressBar({ valor, tono = 'brand', ancho = 'w-[90px]' }) {
  const color = { brand: 'bg-brand', warn: 'bg-warn', ok: 'bg-ok', neutral: 'bg-muted', info: 'bg-info' }[tono];
  return (
    <div className="flex items-center gap-2">
      <div className={`h-1.5 overflow-hidden rounded bg-slate-200 ${ancho}`} role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, valor))}%` }} />
      </div>
      <span className="text-[11px] font-bold text-muted">{valor}%</span>
    </div>
  );
}
