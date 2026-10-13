import Icon from './Icon';

/** Franja que marca una pantalla de estructura: diseño listo, datos todavía de ejemplo. */
export default function EnDesarrollo({ responsable, issues }) {
  return (
    <div className="no-print mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-inner border border-dashed border-line bg-subtle px-3.5 py-2.5 text-[12px] text-muted">
      <Icon name="construction" size={16} className="text-faint" />
      <span className="font-bold text-ink">En desarrollo · Sprint 2</span>
      <span>Diseño de referencia con datos de ejemplo; aún no está conectado a la API.</span>
      <span className="ml-auto flex items-center gap-2">
        <span>Responsable: <b className="text-ink">{responsable}</b></span>
        {issues && <span className="rounded-full bg-white px-2 py-px font-bold text-faint ring-1 ring-line">{issues}</span>}
      </span>
    </div>
  );
}
