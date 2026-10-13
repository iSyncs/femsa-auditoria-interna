export default function Icon({ name, className = '', size }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${className}`} style={size ? { fontSize: size } : undefined}>
      {name}
    </span>
  );
}
