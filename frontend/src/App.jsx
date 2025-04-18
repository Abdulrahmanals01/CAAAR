import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CarSearch from './pages/CarSearch';
import CarDetails from './pages/CarDetails';
import BookingHistory from './pages/BookingHistory';
import HostDashboard from './pages/dashboard/HostDashboard';
import RenterDashboard from './pages/dashboard/RenterDashboard';
import NotFound from './pages/NotFound';

// Simple Navbar component
const Navbar = () => (
  <nav className="bg-blue-600 p-4 text-white">
    <div className="container mx-auto flex justify-between">
      <a href="/" className="font-bold text-xl">Sayarati</a>
      <div className="space-x-4">
        <a href="/cars" className="hover:underline">Find Cars</a>
        <a href="/bookings" className="hover:underline">My Bookings</a>
        <a href="/login" className="hover:underline">Login</a>
        <a href="/register" className="hover:underline">Register</a>
      </div>
    </div>
  </nav>
);

// Simple Footer component
const Footer = () => (
  <footer className="bg-gray-800 text-white p-4 mt-auto">
    <div className="container mx-auto text-center">
      <p>© 2023 Sayarati Car Sharing. All rights reserved.</p>
    </div>
  </footer>
);

const App = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cars" element={<CarSearch />} />
            <Route path="/cars/:id" element={<CarDetails />} />
            <Route path="/bookings" element={<BookingHistory />} />
            <Route path="/host-dashboard" element={<HostDashboard />} />
            <Route path="/renter-dashboard" element={<RenterDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
