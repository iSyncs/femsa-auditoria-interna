export default function PageHeader({ titulo, descripcion, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[25px] font-extrabold tracking-tight text-ink">{titulo}</h1>
        {descripcion && <p className="mt-1 text-[13px] text-muted">{descripcion}</p>}
      </div>
      {children && <div className="no-print flex flex-wrap gap-2.5">{children}</div>}
    </div>
  );
}
