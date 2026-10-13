export function KpiGrid({ children }) {
  return <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}

export default function KpiCard({ label, valor, nota, destacado = false, tonoNota, small = false }) {
  return (
    <div className={`flex flex-col rounded-card border px-5 py-[18px] ${destacado ? 'border-brand-border bg-brand-light' : 'border-line bg-subtle'}`}>
      <div className="text-[12px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 font-extrabold tracking-tight ${small ? 'text-xl' : 'text-[25px]'} ${destacado ? 'text-brand' : 'text-ink'}`}>{valor}</div>
      {nota && <div className={`mt-1 text-[12px] ${tonoNota ?? (destacado ? 'text-brand' : 'text-muted')}`}>{nota}</div>}
    </div>
  );
}
