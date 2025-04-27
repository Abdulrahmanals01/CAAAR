import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StatusMessage from './components/common/StatusMessage';
import axios from './utils/axiosConfig';
// ... [Other imports remain the same] ...

function App() {
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Try to make any authenticated request to check status
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
              {/* ... [Routes remain the same] ... */}
            </Routes>
          </div>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
