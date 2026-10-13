const base = 'w-full rounded-inner border bg-white px-3 py-2 text-[13px] text-ink outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/10';

function Envoltura({ label, error, ayuda, children, htmlFor }) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold text-body">{label}</label>
      {children}
      {error ? <p className="mt-1 text-[12px] font-semibold text-brand">{error}</p>
        : ayuda && <p className="mt-1 text-[12px] text-muted">{ayuda}</p>}
    </div>
  );
}

export function Input({ label, error, ayuda, name, className = '', ...props }) {
  return (
    <Envoltura label={label} error={error} ayuda={ayuda} htmlFor={name}>
      <input id={name} name={name} aria-invalid={!!error} className={`${base} ${error ? 'border-brand' : 'border-line'} ${className}`} {...props} />
    </Envoltura>
  );
}

export function Textarea({ label, error, ayuda, name, ...props }) {
  return (
    <Envoltura label={label} error={error} ayuda={ayuda} htmlFor={name}>
      <textarea id={name} name={name} rows={3} aria-invalid={!!error} className={`${base} resize-y ${error ? 'border-brand' : 'border-line'}`} {...props} />
    </Envoltura>
  );
}

export function Select({ label, error, ayuda, name, opciones, placeholder = 'Selecciona…', ...props }) {
  return (
    <Envoltura label={label} error={error} ayuda={ayuda} htmlFor={name}>
      <select id={name} name={name} aria-invalid={!!error} className={`${base} ${error ? 'border-brand' : 'border-line'}`} {...props}>
        <option value="">{placeholder}</option>
        {opciones.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Envoltura>
  );
}
