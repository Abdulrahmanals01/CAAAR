import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import PrivateRoute from './components/common/PrivateRoute';
import HostRoute from './components/common/HostRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ListCar from './pages/ListCar';
import ManageCars from './pages/ManageCars';
import BookingHistory from './pages/BookingHistory';
import BookingRequests from './pages/BookingRequests';
import CarDetails from './pages/CarDetails';
import SearchResults from './pages/SearchResults';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cars/:id" element={<CarDetails />} />
              <Route path="/cars/search" element={<SearchResults />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              
              <Route path="/list-car" element={
                <HostRoute>
                  <ListCar />
                </HostRoute>
              } />
              
              <Route path="/manage-cars" element={
                <HostRoute>
                  <ManageCars />
                </HostRoute>
              } />
              
              <Route path="/booking-history" element={
                <PrivateRoute>
                  <BookingHistory />
                </PrivateRoute>
              } />
              
              <Route path="/booking-requests" element={
                <HostRoute>
                  <BookingRequests />
                </HostRoute>
              } />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="bg-gray-800 text-white p-6">
            <div className="container mx-auto">
              <p className="text-center">&copy; {new Date().getFullYear()} Sayarati. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
