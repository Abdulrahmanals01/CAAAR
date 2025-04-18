import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SearchResults from './pages/SearchResults';
import ListCar from './pages/ListCar';
import HostDashboard from './pages/dashboard/HostDashboard';

// Protected route component
const ProtectedRoute = ({ element, requiredRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" />;
  }
  
  return element;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cars/search" element={<SearchResults />} />
            <Route 
              path="/list-car" 
              element={
                <ProtectedRoute 
                  element={<ListCar />} 
                  requiredRole="host" 
                />
              } 
            />
            <Route 
              path="/dashboard/host" 
              element={
                <ProtectedRoute 
                  element={<HostDashboard />} 
                  requiredRole="host" 
                />
              } 
            />
            {/* Add more routes as needed */}
          </Routes>
        </main>
        <footer className="bg-gray-800 text-white p-6">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold mb-2">Sayarati</h3>
                <p>The premier car sharing platform in Saudi Arabia</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Quick Links</h4>
                <ul className="space-y-1">
                  <li><a href="/" className="hover:text-blue-300">Home</a></li>
                  <li><a href="/cars" className="hover:text-blue-300">Browse Cars</a></li>
                  <li><a href="/about" className="hover:text-blue-300">About Us</a></li>
                  <li><a href="/contact" className="hover:text-blue-300">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-700 text-center">
              <p>&copy; {new Date().getFullYear()} Sayarati. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
