import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import SpecimenCatalog from './pages/SpecimenCatalog';
import AccessPage from './pages/AccessPage';
import ConfirmAccessPage from './pages/ConfirmAccessPage';
import { useAuth } from './context/AuthContext';

function ProtectedApp() {
  const { isAuthenticated } = useAuth(); const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/access" replace state={{ from: location }} />;
  return <AppShell><Routes>
    <Route path="/" element={<div className="p-6"><h1 className="text-3xl font-bold text-charcoal">DASHBOARD</h1><p className="mt-2 text-charcoal/70">Climate & Care overview coming soon.</p></div>} />
    <Route path="/collection" element={<SpecimenCatalog />} />
    <Route path="/specimens" element={<div className="p-6"><h1 className="text-3xl font-bold text-charcoal">DISCOVER</h1></div>} />
    <Route path="/specimens/:speciesId" element={<div className="p-6"><h1 className="text-3xl font-bold text-charcoal">DETALHE DA ESPÉCIE</h1></div>} />
    <Route path="/specimens/new" element={<div className="p-6"><h1 className="text-3xl font-bold text-charcoal">CADASTRAR EXEMPLAR</h1></div>} />
    <Route path="/taxonomy" element={<div className="p-6"><h1 className="text-3xl font-bold text-charcoal">TAXONOMY EXPLORER</h1></div>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AppShell>;
}

function App() {
  return (
    <Routes><Route path="/access" element={<AccessPage />} /><Route path="/access/confirm" element={<ConfirmAccessPage />} /><Route path="/*" element={<ProtectedApp />} /></Routes>
  );
}

export default App;
