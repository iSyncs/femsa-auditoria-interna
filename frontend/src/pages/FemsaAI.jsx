import Topbar from '../components/layout/Topbar';
import PageHeader from '../components/layout/PageHeader';
import { Vacio } from '../components/ui/Estados';

/** Placeholder del módulo de IA (triaje de incidencias). Fuera del alcance de las HU actuales. */
export default function FemsaAI() {
  return (
    <>
      <Topbar migas={[{ texto: 'Inteligencia Artificial' }, { texto: 'FEMSA AI' }]} />
      <PageHeader titulo="FEMSA AI" descripcion="Triaje inteligente de incidencias y validación de completitud de expedientes." />
      <Vacio icono="psychology" texto="Módulo en construcción: se conectará en una versión posterior." />
    </>
  );
}
