import { LETRAS } from './letrasFemsa';

/** Logotipo FEMSA en vector (mismos trazos que el video del login). */
export default function LogoFemsa({ className = '', color = '#9B2C3A', titulo = 'FEMSA' }) {
  return (
    <svg viewBox="0 0 1920 442" className={className} role="img" aria-label={titulo}>
      <g transform="translate(0,442) scale(0.1,-0.1)" fill={color}>
        {LETRAS.map((d, i) => <path key={i} d={d} />)}
      </g>
    </svg>
  );
}
