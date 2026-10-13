import Icon from './Icon';

/** pasos: [{ titulo, descripcion, estado: 'done' | 'current' | 'pending' | 'rejected' }] */
export default function Stepper({ pasos }) {
  return (
    <ol className="flex flex-col">
      {pasos.map((p, i) => {
        const ultimo = i === pasos.length - 1;
        const ico = {
          done: 'bg-brand text-white',
          current: 'bg-white ring-2 ring-brand',
          pending: 'bg-pill ring-1 ring-line',
          rejected: 'bg-slate-700 text-white',
        }[p.estado];
        return (
          <li key={p.titulo} className={`relative grid grid-cols-[26px_1fr] gap-3.5 ${ultimo ? '' : 'pb-5'}`}>
            {!ultimo && <span className={`absolute left-3 top-[26px] -bottom-0.5 w-0.5 ${p.estado === 'done' ? 'bg-brand' : 'bg-line'}`} />}
            <span className={`z-10 flex h-[26px] w-[26px] items-center justify-center rounded-lg ${ico}`}>
              {p.estado === 'done' && <Icon name="check" size={16} />}
              {p.estado === 'rejected' && <Icon name="undo" size={15} />}
              {p.estado === 'current' && <span className="h-2 w-2 rounded-full bg-brand" />}
            </span>
            <div>
              <div className={`text-[13px] font-bold ${p.estado === 'current' ? 'text-brand' : 'text-ink'}`}>{p.titulo}</div>
              {p.descripcion && <div className="mt-0.5 text-xs text-muted">{p.descripcion}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
