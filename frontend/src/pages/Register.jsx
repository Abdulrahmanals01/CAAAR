import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'renter',
    phone: '',
    id_number: ''
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);
    
    console.log('Submitting form data:', formData);
    
    try {
      // Add debug logging
      const requestBody = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        id_number: formData.id_number
      };
      
      console.log('Request body:', requestBody);
      
      // Set specific content type and send as application/json
      const response = await axios({
        method: 'post',
        url: 'http://localhost:5000/api/users/register',
        data: requestBody,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Registration successful:', response.data);
      localStorage.setItem('token', response.data.token);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }
      
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register for Sayarati</h2>
      
      {error && <div className="bg-red-100 p-3 mb-4 text-red-700 rounded">{error}</div>}
      
      {validationErrors.length > 0 && (
        <div className="bg-yellow-100 p-3 mb-4 text-yellow-800 rounded">
          <p className="font-bold">Please fix the following issues:</p>
          <ul className="list-disc ml-5">
            {validationErrors.map((err, index) => (
              <li key={index}>{err.param}: {err.msg}</li>
            ))}
          </ul>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
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
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">ID Number</label>
          <input
            type="text"
            name="id_number"
            value={formData.id_number}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="renter">Renter</option>
            <option value="host">Host</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            minLength="6"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Register
        </button>
      </form>
      
      <div className="mt-4 text-center">
        Already have an account? <Link to="/login" className="text-blue-500">Login</Link>
      </div>
    </div>
  );
};

export default Register;
