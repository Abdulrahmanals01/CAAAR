#!/bin/bash

echo "Fixing frontend index.jsx file..."

# Create backup
cp frontend/src/index.jsx frontend/src/index.jsx.bak-fix

# Fix the index.jsx file by removing the duplicate axios import
cat > frontend/src/index.jsx << 'EOFJS'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import axios from "./utils/axiosConfig";
import { initAuthHeaders } from './utils/auth';

// Make axios available globally
window.axios = axios;

// Initialize authentication headers from localStorage
initAuthHeaders();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOFJS

echo "✅ Fixed duplicate axios import in index.jsx"
