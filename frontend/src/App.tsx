
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import MapPage from './pages/MapPage';
import GeneratorPage from './pages/GeneratorPage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<MapPage />} />
          <Route path="/farmer" element={<GeneratorPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
