import { useNavigate } from 'react-router';
import Topbar from '../components/layout/Topbar';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

export default function NoEncontrado() {
  const navegar = useNavigate();
  return (
    <>
      <Topbar migas={[{ texto: 'No encontrado' }]} />
      <div className="flex flex-col items-center py-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-brand-light text-brand">
          <Icon name="travel_explore" size={28} />
        </span>
        <h1 className="mt-4 text-[22px] font-extrabold tracking-tight">No encontramos esta página</h1>
        <p className="mt-1 max-w-sm text-[13px] text-muted">El enlace puede estar incompleto o la página ya no existe.</p>
        <div className="mt-5 flex gap-2.5">
          <Button icon="arrow_back" onClick={() => navegar(-1)}>Regresar</Button>
          <Button variant="primary" icon="dashboard" onClick={() => navegar('/')}>Ir al dashboard</Button>
        </div>
      </div>
    </>
  );
}
