import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import SpecimenCatalog from './pages/SpecimenCatalog';
import AccessPage from './pages/AccessPage';
import ConfirmAccessPage from './pages/ConfirmAccessPage';
import SpecimenCreatePage from './pages/SpecimenCreatePage';
import SpecimenDetailPage from './pages/SpecimenDetailPage';
import ObservationCatalogPage from './pages/ObservationCatalogPage';
import ObservationDetailPage from './pages/ObservationDetailPage';
import TaxonomyPage from './pages/TaxonomyPage';
import IdentificationKeysPage from './pages/IdentificationKeysPage';
import IdentificationKeyDetailPage from './pages/IdentificationKeyDetailPage';
import IdentificationKeyEditorPage from './pages/IdentificationKeyEditorPage';
import ExternalKeyReaderPage from './pages/ExternalKeyReaderPage';
import { useAuth } from './context/AuthContext';
import PageContainer from './components/layout/PageContainer';
import PageHeader from './components/layout/PageHeader';

function PlaceholderPage({ title, description }) {
  return <PageContainer><PageHeader title={title} description={description} /></PageContainer>;
}

function ProtectedApp() {
  const { isAuthenticated } = useAuth(); const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/access" replace state={{ from: location }} />;
  return <AppShell><Routes>
    <Route path="/" element={<PlaceholderPage title="Painel" description="Visão geral da coleção e dos cuidados." />} />
    <Route path="/collection" element={<SpecimenCatalog />} />
    <Route path="/specimens" element={<ObservationCatalogPage />} />
    <Route path="/observations/:observationId" element={<ObservationDetailPage />} />
    <Route path="/specimens/:speciesId" element={<PlaceholderPage title="Detalhe da espécie" />} />
    <Route path="/specimens/new" element={<SpecimenCreatePage />} />
    <Route path="/specimens/instances/:specimenId" element={<SpecimenDetailPage />} />
    <Route path="/taxonomy" element={<TaxonomyPage />} />
    <Route path="/keys" element={<IdentificationKeysPage />} />
    <Route path="/keys/external" element={<ExternalKeyReaderPage />} />
    <Route path="/keys/new" element={<IdentificationKeyEditorPage />} />
    <Route path="/keys/:keyId" element={<IdentificationKeyDetailPage />} />
    <Route path="/keys/:keyId/edit" element={<IdentificationKeyEditorPage />} />
    <Route path="/keys/:keyId/suggest" element={<IdentificationKeyEditorPage suggestion />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AppShell>;
}

function App() {
  return (
    <Routes><Route path="/access" element={<AccessPage />} /><Route path="/access/confirm" element={<ConfirmAccessPage />} /><Route path="/*" element={<ProtectedApp />} /></Routes>
  );
}

export default App;
