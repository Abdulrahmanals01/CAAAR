import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { initAuthHeaders } from './utils/auth';
import axios from 'axios';

// Make axios available globally
window.axios = axios;

// Initialize authentication headers from localStorage
initAuthHeaders();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
