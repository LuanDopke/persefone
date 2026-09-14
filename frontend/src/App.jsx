import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import SpecimenCatalog from './pages/SpecimenCatalog';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<div className="p-6"><h1 className="text-3xl font-bold text-charcoal">DASHBOARD</h1><p className="mt-2 text-charcoal/70">Climate & Care overview coming soon.</p></div>} />
        <Route path="/collection" element={<SpecimenCatalog />} />
        <Route path="/specimens" element={<div className="p-6"><h1 className="text-3xl font-bold text-charcoal">DISCOVER</h1></div>} />
        <Route path="/specimens/:speciesId" element={<div className="p-6"><h1 className="text-3xl font-bold text-charcoal">DETALHE DA ESPÉCIE</h1></div>} />
        <Route path="/specimens/new" element={<div className="p-6"><h1 className="text-3xl font-bold text-charcoal">CADASTRAR EXEMPLAR</h1></div>} />
        <Route path="/taxonomy" element={<div className="p-6"><h1 className="text-3xl font-bold text-charcoal">TAXONOMY EXPLORER</h1></div>} />
      </Routes>
    </AppShell>
  );
}

export default App;
