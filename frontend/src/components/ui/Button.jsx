import Icon from './Icon';

const VARIANTES = {
  primary: 'bg-brand text-white shadow-glow hover:bg-brand-hover hover:shadow-[0_6px_16px_rgba(234,29,62,0.28)]',
  outline: 'bg-white border border-line text-ink hover:bg-subtle hover:border-slate-300',
  chip: 'bg-white border border-line text-ink hover:bg-subtle hover:border-slate-300 !px-3.5 !py-1.5',
  ghost: 'text-muted hover:text-brand hover:bg-subtle !px-2',
  danger: 'bg-white border border-brand-border text-brand hover:bg-brand-light',
};

export default function Button({ variant = 'outline', icon, children, className = '', type = 'button', title, ...props }) {
  return (
    <button
      type={type}
      title={title}
      className={`inline-flex select-none items-center justify-center gap-1.5 rounded-full px-[18px] py-2 text-[13px] font-bold
        transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out
        active:translate-y-0 active:scale-[0.97] active:duration-75
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand
        disabled:cursor-not-allowed disabled:opacity-45 disabled:translate-y-0 disabled:scale-100 disabled:shadow-none ${VARIANTES[variant]} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}
