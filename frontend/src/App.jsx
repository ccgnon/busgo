import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store/index';
import Navbar      from './components/Navbar';
import Home        from './pages/Home';
import PaymentPage from './pages/PaymentPage';
import Bookings    from './pages/Bookings';
import Login       from './pages/Login';
import Admin       from './pages/Admin';
import Agency      from './pages/Agency';

export default function App() {
  const initAuth = useStore(s => s.initAuth);
  useEffect(() => { initAuth(); }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/payment"  element={<PaymentPage />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/admin"    element={<Admin />} />
        <Route path="/agency"   element={<Agency />} />
      </Routes>
    </BrowserRouter>
  );
}
