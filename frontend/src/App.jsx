import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Bookings from './pages/Bookings';
import Admin from './pages/Admin';
import Agency from './pages/Agency';
import Login from './pages/Login';

export default function App() {
  const initAuth = useStore(s => s.initAuth);
  useEffect(() => { initAuth(); }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/admin"   element={<Admin />} />
        <Route path="/agency"  element={<Agency />} />
        <Route path="/login"   element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
