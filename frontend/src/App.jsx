import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import BookingFlow from './pages/BookingFlow';
import MyBookings from './pages/MyBookings';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/"              element={<Home />} />
      <Route path="/search"        element={<Search />} />
      <Route path="/book/:tripId"  element={<BookingFlow />} />
      <Route path="/mes-voyages"   element={<MyBookings />} />
      <Route path="/connexion"     element={<Login />} />
      <Route path="/inscription"   element={<Register />} />
      <Route path="/admin/*"       element={<Admin />} />
    </Routes>
  );
}
