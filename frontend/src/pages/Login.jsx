import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { setToken, setUserData, clearAuth } from '../utils/auth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    try {
      console.log('Sending login request with:', formData);
      
      // Clear previous auth data
      clearAuth();
      
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      console.log('Login response:', response.data);
      
      if (response.data && response.data.token) {
        // Save token and user info using utility
        setToken(response.data.token);
        
        if (response.data.user) {
          setUserData(response.data.user);
        }
        
        // Set global authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Display success message
        setSuccess(true);
        
        // Use the login function from context if available
        if (login) {
          await login(formData.email, formData.password);
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login to Sayarati</h2>
      {error && <div className="bg-red-100 p-3 mb-4 text-red-700 rounded">{error}</div>}
      {success && <div className="bg-green-100 p-3 mb-4 text-green-700 rounded">Login successful! Redirecting...</div>}      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>
      <div className="mt-4 text-center">
        Don't have an account? <Link to="/register" className="text-blue-500">Register</Link>
      </div>
    </div>
  );
};

export default Login;
