import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import './index.css';

const MapPage = React.lazy(() => import('./pages/MapPage'));
const GeneratorPage = React.lazy(() => import('./pages/GeneratorPage'));
const GaleriePage = React.lazy(() => import('./pages/GaleriePage'));
const StatsPage = React.lazy(() => import('./pages/StatsPage'));
const ProjetPage = React.lazy(() => import('./pages/ProjetPage'));
const AccountPage = React.lazy(() => import('./pages/AccountPage'));

// Conserve l'ancre et les paramètres : /faq#source-crc1 reste utilisable.
const RedirectToProjet: React.FC = () => {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: '/projet', search, hash }} replace />;
};

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Chargement...</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MapPage />} />
            <Route path="/farmer" element={<GeneratorPage />} />
            <Route path="/galerie" element={<GaleriePage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/projet" element={<ProjetPage />} />
            <Route path="/compte" element={<AccountPage />} />
            {/* Ancienne adresse de la page d'information. */}
            <Route path="/faq" element={<RedirectToProjet />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
