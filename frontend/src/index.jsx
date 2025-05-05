import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import axios from "./utils/axiosConfig";
import { initAuthHeaders } from './utils/auth';

window.axios = axios;

initAuthHeaders();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
