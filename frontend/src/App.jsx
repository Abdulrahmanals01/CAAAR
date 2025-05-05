import React, { useState, useEffect } from 'react';
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
import AdminRoute from './components/common/AdminRoute';
import DashboardRoute from './components/common/DashboardRoute';
import CarSearch from './pages/CarSearch';
import BookingRequests from './pages/BookingRequests';
import SearchResults from './pages/SearchResults';
import ManageCars from './pages/ManageCars';
import NotFound from './pages/NotFound';
import Support from './pages/Support';
import UserProfile from './pages/UserProfile';
import HostDashboard from './pages/dashboard/HostDashboard';
import RenterDashboard from './pages/dashboard/RenterDashboard';
import Inbox from './pages/chat/Inbox';
import Conversation from './pages/chat/Conversation';
import AdminDashboard from './pages/admin/AdminDashboard';
import StatusMessage from './components/common/StatusMessage';
import axios from './utils/axiosConfig';

function App() {
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          
          await axios.get('/api/cars');
        } catch (error) {
          if (error.response && error.response.status === 403) {
            setUserStatus(error.response.data);
          }
        }
      }
    };

    checkUserStatus();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            {userStatus && (
              <StatusMessage
                status={userStatus.status}
                reason={userStatus.reason}
                until={userStatus.until}
              />
            )}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cars/:id" element={<CarDetails />} />
              {}
              <Route path="/cars" element={<CarSearch />} />
              <Route path="/cars/search" element={<CarSearch />} />
              <Route path="/search" element={<CarSearch />} />
              <Route path="/searchresults" element={<CarSearch />} />
              {}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/dashboard/host"
                element={
                  <DashboardRoute allowedRoles={['host']}>
                    <HostDashboard />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/renter"
                element={
                  <DashboardRoute allowedRoles={['renter']}>
                    <RenterDashboard />
                  </DashboardRoute>
                }
              />
              {}
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              {}
              <Route path="/list-car" element={<PrivateRoute element={<ListCar />} />} />
              <Route path="/listcar" element={<PrivateRoute element={<ListCar />} />} />
              <Route path="/bookingrequests" element={<PrivateRoute element={<BookingRequests />} />} />
              <Route path="/booking-requests" element={<PrivateRoute element={<BookingRequests />} />} />
              <Route path="/manage-cars" element={<PrivateRoute element={<ManageCars />} />} />
              <Route path="/managecars" element={<PrivateRoute element={<ManageCars />} />} />
              {}
              <Route path="/messages" element={<Inbox />} />
              <Route path="/messages/:userId" element={<Conversation />} />
              <Route path="/support" element={<Support />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
