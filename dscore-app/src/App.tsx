import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import FieldView from './pages/FieldView';
import RankingsView from './pages/RankingsView';
import PlayerProfile from './pages/PlayerProfile';
import About from './pages/About';
import Baserunning from './pages/Baserunning';
import Footer from './components/Footer';

export default function App() {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<FieldView />} />
          <Route path="/rankings/:pos" element={<RankingsView />} />
          <Route path="/player/:pos/:rank" element={<PlayerProfile />} />
          <Route path="/about" element={<About />} />
          <Route path="/baserunning" element={<Baserunning />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </>
  );
}
