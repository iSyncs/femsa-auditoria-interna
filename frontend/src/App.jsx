import { Navigate, Route, Routes } from 'react-router';
import { useSesion } from './context/Sesion';
import { puede } from './lib/permisos';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Auditorias from './pages/Auditorias';
import DetalleAuditoria from './pages/DetalleAuditoria';
import Hallazgos from './pages/Hallazgos';
import Seguimiento from './pages/Seguimiento';
import Reporte from './pages/Reporte';
import Bitacora from './pages/Bitacora';
import NoEncontrado from './pages/NoEncontrado';
import FemsaAI from './pages/FemsaAI';
import BandejaLotes from './pages/BandejaLotes';
import DetalleLote from './pages/DetalleLote';
import SugerenciasIA from './pages/SugerenciasIA';
import SolicitudesPBC from './pages/SolicitudesPBC';
import BitacoraAvances from './pages/BitacoraAvances';

export default function App() {
  const { usuario } = useSesion();
  if (!usuario) return <Login />;
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="auditorias" element={<Auditorias />} />
        <Route path="auditorias/solicitudes" element={<SolicitudesPBC />} />
        <Route path="auditorias/:id" element={<DetalleAuditoria />} />
        <Route path="hallazgos" element={<Hallazgos />} />
        <Route path="seguimiento" element={<Seguimiento />} />
        <Route path="seguimiento/avances" element={<BitacoraAvances />} />
        <Route path="reporte" element={puede.verReporte(usuario) ? <Reporte /> : <Navigate to="/" replace />} />
        <Route path="bitacora" element={puede.verBitacora(usuario) ? <Bitacora /> : <Navigate to="/" replace />} />
        <Route path="ia" element={<FemsaAI />} />
        <Route path="ia/lotes" element={<BandejaLotes />} />
        <Route path="ia/lotes/:id" element={<DetalleLote />} />
        <Route path="ia/sugerencias" element={<SugerenciasIA />} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
