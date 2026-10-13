import { useEffect, useRef, useState } from 'react';
import { useSesion } from '../context/Sesion';
import LogoFemsa from '../components/ui/LogoFemsa';
import Icon from '../components/ui/Icon';

const campo = 'w-full border-0 border-b border-line bg-transparent px-0 pb-2.5 pt-1.5 text-[14.5px] text-ink outline-none transition-[border-color] duration-150 ease-out placeholder:text-faint focus:border-ink';

/** Video del panel derecho; con "reducir movimiento" se queda en la imagen fija. */
function VideoMarca() {
  const ref = useRef(null);
  useEffect(() => {
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducir.matches) ref.current?.pause();
  }, []);
  return (
    <video ref={ref} autoPlay muted loop playsInline preload="auto" poster="/login/femsa-login-poster.jpg"
      className="h-full w-full object-cover" aria-hidden="true">
      <source src="/login/femsa-login.webm" type="video/webm" />
      <source src="/login/femsa-login.mp4" type="video/mp4" />
    </video>
  );
}

export default function Login() {
  const { iniciar, entrarTest } = useSesion();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(null);
  const [error, setError] = useState(null);

  const ejecutar = async (tipo, accion) => {
    setEnviando(tipo);
    setError(null);
    try {
      await accion();
    } catch (e) {
      setError(e.status === 401 ? 'Correo o contraseña incorrectos.' : 'No se pudo conectar con el servidor. Intenta de nuevo.');
      setEnviando(null);
    }
  };

  const enviar = (e) => {
    e.preventDefault();
    if (!correo.trim() || !contrasena) { setError('Escribe tu correo y tu contraseña.'); return; }
    ejecutar('login', () => iniciar(correo.trim(), contrasena));
  };

  return (
    <div className="min-h-dvh bg-[#F7F7F5] lg:h-dvh">
      <div className="grid min-h-dvh lg:h-full lg:min-h-0 lg:grid-cols-[1fr_1.05fr]">
        <section className="flex min-h-0 flex-col px-6 py-6 sm:px-12 lg:overflow-y-auto lg:px-[clamp(48px,7vw,104px)]">
          <header className="flex items-center justify-between">
            <LogoFemsa className="h-[22px] w-auto" />
            <span className="text-[12px] font-semibold text-muted">Release 1</span>
          </header>

          <div className="my-auto w-full max-w-[460px] animate-entrada py-8">
            <div className="text-[12px] text-faint">Auditoría Interna <span className="mx-1">/</span> Acceso</div>
            <h1 className="mt-3 text-[clamp(32px,3.6vw,44px)] font-semibold leading-[1.05] tracking-[-0.02em] text-ink">Inicia sesión</h1>
            <p className="mt-3 max-w-[400px] text-[14.5px] leading-relaxed text-body">
              Revisa auditorías, hallazgos y planes de remediación, y las evidencias que ya analizó la IA.
            </p>

            <form onSubmit={enviar} className="mt-8 space-y-5" noValidate>
              <label className="block">
                <span className="text-[13px] text-body">Correo corporativo</span>
                <input type="email" autoComplete="username" className={campo} placeholder="nombre@femsa.com"
                  value={correo} onChange={(e) => setCorreo(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[13px] text-body">Contraseña</span>
                <input type="password" autoComplete="current-password" className={campo} placeholder="Tu contraseña"
                  value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
              </label>

              {error && (
                <p role="alert" className="flex items-center gap-2 text-[13px] font-semibold text-brand">
                  <Icon name="error" size={16} />{error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button type="submit" disabled={!!enviando}
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-ink px-6 text-[13px] font-bold text-white transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:opacity-60">
                  {enviando === 'login' && <Icon name="progress_activity" size={16} className="animate-spin" />}
                  Iniciar sesión
                </button>
                {/* TODO FE1S-2 HU_01: iniciar sesión con Microsoft Entra ID (MSAL). */}
                <button type="button" disabled title="Disponible con Entra ID en el Sprint 2"
                  className="inline-flex h-11 items-center gap-2.5 rounded-[10px] border border-line bg-white px-5 text-[13px] font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50">
                  <svg viewBox="0 0 21 21" className="size-4" aria-hidden="true">
                    <rect width="10" height="10" fill="#F25022" /><rect x="11" width="10" height="10" fill="#7FBA00" />
                    <rect y="11" width="10" height="10" fill="#00A4EF" /><rect x="11" y="11" width="10" height="10" fill="#FFB900" />
                  </svg>
                  Continuar con Microsoft
                </button>
              </div>
            </form>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5">
              <button type="button" onClick={() => ejecutar('test', entrarTest)} disabled={!!enviando}
                className="inline-flex items-center gap-2 text-[13px] font-bold text-ink underline decoration-line decoration-2 underline-offset-4 transition-[text-decoration-color] duration-150 ease-out hover:decoration-ink disabled:opacity-60">
                {enviando === 'test' ? <Icon name="progress_activity" size={16} className="animate-spin" /> : <Icon name="science" size={16} />}
                Entrar test
              </button>
              <span className="flex items-center gap-1.5 text-[12px] text-muted">
                <Icon name="info" size={15} />Entra como José Martínez, auditor líder, con datos de prueba.
              </span>
            </div>
          </div>

          <footer className="text-[12px] text-faint">Sistema de Auditoría Interna FEMSA</footer>
        </section>

        <aside className="relative hidden min-h-0 p-3 lg:block">
          <div className="h-full overflow-hidden rounded-[18px] bg-[#F7F2EC]">
            <VideoMarca />
          </div>
        </aside>
      </div>
    </div>
  );
}
