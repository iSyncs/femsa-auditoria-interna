import { iniciales } from '../../lib/formato';

export default function Avatar({ nombre, size = 30 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-pill font-extrabold text-ink"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      title={nombre}
    >
      {iniciales(nombre)}
    </span>
  );
}
