
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import MapPage from './pages/MapPage';
import GeneratorPage from './pages/GeneratorPage';
import StatsPage from './pages/StatsPage';
import ManifestoPage from './pages/ManifestoPage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<MapPage />} />
          <Route path="/farmer" element={<GeneratorPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/manifeste" element={<ManifestoPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
