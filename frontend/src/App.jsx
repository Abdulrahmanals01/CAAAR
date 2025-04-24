import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CarDetails from './pages/CarDetails';
import Dashboard from './pages/Dashboard';
import ListCar from './pages/ListCar';
import PrivateRoute from './components/common/PrivateRoute';
import CarSearch from './pages/CarSearch';
import BookingHistory from './pages/BookingHistory';
import BookingRequests from './pages/BookingRequests';
import SearchResults from './pages/SearchResults';
import ManageCars from './pages/ManageCars';
import NotFound from './pages/NotFound';
import UserProfile from './pages/UserProfile';
import HostDashboard from './pages/dashboard/HostDashboard';
import RenterDashboard from './pages/dashboard/RenterDashboard';

// Import chat pages
import Inbox from './pages/chat/Inbox';
import Conversation from './pages/chat/Conversation';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cars/:id" element={<CarDetails />} />
              
              {/* Car search routes */}
              <Route path="/cars" element={<CarSearch />} />
              <Route path="/cars/search" element={<CarSearch />} />
              <Route path="/search" element={<CarSearch />} />
              
              <Route path="/searchresults" element={<SearchResults />} />
              
              {/* Dashboard routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/host" element={<HostDashboard />} />
              <Route path="/dashboard/renter" element={<RenterDashboard />} />
              
              {/* Fix: List car routes */}
              <Route path="/list-car" element={<PrivateRoute element={<ListCar />} />} />
              <Route path="/listcar" element={<PrivateRoute element={<ListCar />} />} />
              
              <Route path="/booking-history" element={<PrivateRoute element={<BookingHistory />} />} />
              <Route path="/bookinghistory" element={<PrivateRoute element={<BookingHistory />} />} />
              
              <Route path="/bookingrequests" element={<PrivateRoute element={<BookingRequests />} />} />
              <Route path="/booking-requests" element={<PrivateRoute element={<BookingRequests />} />} />
              
              <Route path="/manage-cars" element={<PrivateRoute element={<ManageCars />} />} />
              <Route path="/managecars" element={<PrivateRoute element={<ManageCars />} />} />
              
              {/* Chat routes */}
              <Route path="/messages" element={<Inbox />} />
              <Route path="/messages/:userId" element={<Conversation />} />
              
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
