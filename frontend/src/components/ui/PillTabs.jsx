export default function PillTabs({ tabs, activo, onChange }) {
  return (
    <div role="tablist" className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => {
        const on = t.id === activo;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] transition-[background-color,color] duration-150 ease-out
              ${on ? 'bg-ink font-bold text-white' : 'bg-pill font-semibold text-body hover:bg-slate-200'}`}
          >
            {t.label}
            {t.count != null && (
              <span className={`rounded-full px-1.5 py-px text-[11px] font-bold ${on ? 'bg-white/20' : 'bg-slate-300/70 text-body'}`}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
