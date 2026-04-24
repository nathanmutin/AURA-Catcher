import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import './index.css';

const MapPage = React.lazy(() => import('./pages/MapPage'));
const GeneratorPage = React.lazy(() => import('./pages/GeneratorPage'));
const StatsPage = React.lazy(() => import('./pages/StatsPage'));
const FaqPage = React.lazy(() => import('./pages/FaqPage'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Chargement...</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MapPage />} />
            <Route path="/farmer" element={<GeneratorPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/faq" element={<FaqPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
