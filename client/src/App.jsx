import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import MandiPrices from './pages/MandiPrices';
import Insurance from './pages/Insurance';
import CostTracker from './pages/CostTracker';
import Advisory from './pages/Advisory';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 pb-20 md:pb-8 sm:py-8 max-w-7xl w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mandi" element={<MandiPrices />} />
            <Route path="/advisory" element={<Advisory />} />
            <Route path="/insurance" element={<Insurance />} />
            <Route path="/costs" element={<CostTracker />} />
          </Routes>
        </main>
        <BottomNav />
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;
