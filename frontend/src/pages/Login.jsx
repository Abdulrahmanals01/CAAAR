import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [accountStatus, setAccountStatus] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useContext(AuthContext);

  // Check if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAccountStatus(null);
    setSuccess(false);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        setSuccess(true);
        // Navigation will happen automatically via the useEffect
      } else {
        if (result.status === 'banned' || result.status === 'frozen') {
          setAccountStatus(result);
        } else {
          setError(result.error || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login to Sayarati</h2>

      {error && <div className="bg-red-100 p-3 mb-4 text-red-700 rounded">{error}</div>}
      {success && <div className="bg-green-100 p-3 mb-4 text-green-700 rounded">Login successful! Redirecting...</div>}
      
      {accountStatus && accountStatus.status === 'banned' && (
        <div className="bg-red-100 p-4 mb-6 text-red-800 rounded border border-red-300">
          <h3 className="font-bold text-lg mb-2">Account Banned</h3>
          <p className="mb-2">Your account has been permanently banned from Sayarati.</p>
          {accountStatus.reason && (
            <p className="mb-2"><strong>Reason:</strong> {accountStatus.reason}</p>
          )}
          <p>Please contact customer support if you believe this is an error.</p>
        </div>
      )}
      
      {accountStatus && accountStatus.status === 'frozen' && (
        <div className="bg-yellow-100 p-4 mb-6 text-yellow-800 rounded border border-yellow-300">
          <h3 className="font-bold text-lg mb-2">Account Temporarily Frozen</h3>
          <p className="mb-2">Your account has been temporarily frozen.</p>
          {accountStatus.reason && (
            <p className="mb-2"><strong>Reason:</strong> {accountStatus.reason}</p>
          )}
          {accountStatus.until && (
            <p className="mb-2"><strong>Frozen until:</strong> {formatDate(accountStatus.until)}</p>
          )}
          <p>Your account will be automatically unfrozen after this period.</p>
        </div>
      )}

      {!accountStatus && (
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
      )}

      <div className="mt-4 text-center">
        Don't have an account? <Link to="/register" className="text-blue-500">Register</Link>
      </div>
    </div>
  );
};

export default Login;
