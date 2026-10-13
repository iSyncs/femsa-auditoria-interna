import Icon from './Icon';

const TONOS = {
  ok: ['bg-ok-bg border-emerald-200 text-emerald-800', 'check_circle'],
  warn: ['bg-warn-bg border-amber-200 text-amber-900', 'warning'],
  error: ['bg-brand-light border-brand-border text-rose-800', 'error'],
  info: ['bg-info-bg border-blue-200 text-blue-900', 'info'],
};

export default function Notice({ tono = 'info', titulo, children }) {
  const [clases, icono] = TONOS[tono];
  return (
    <div className={`mb-4 flex gap-2.5 rounded-inner border p-3.5 text-[13px] ${clases}`} role={tono === 'error' ? 'alert' : 'status'}>
      <Icon name={icono} size={18} />
      <div className="min-w-0">
        {titulo && <div className="font-bold">{titulo}</div>}
        <div className="mt-0.5 [&_li]:mt-1">{children}</div>
      </div>
    </div>
  );
}
