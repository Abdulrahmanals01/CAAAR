import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import axios from '../../utils/axiosConfig';
import { setUserData } from '../../utils/auth';

const RoleSwitcher = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitchRole = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const newRole = user?.role === 'host' ? 'renter' : 'host';
    
    try {
      const response = await axios.post('/api/roles/switch', { role: newRole });
      
      if (response.data.success) {
        // Update token in localStorage
        const { token, user: updatedUser } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Also update the separate userRole in localStorage
        setUserData(updatedUser);
        
        // Update axios default headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update user in context
        updateUser(updatedUser);
        
        // Navigate to home page
        navigate('/');
      }
    } catch (error) {
      console.error('Error switching role:', error);
      alert(error.response?.data?.message || 'Failed to switch role');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;
  if (user.role === 'admin') return null;

  return (
    <button
      onClick={handleSwitchRole}
      disabled={isLoading}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'
      } ml-4`}
    >
      {isLoading ? 'Switching...' : `Switch to ${user.role === 'host' ? 'Renter' : 'Host'} Mode`}
    </button>
  );
};

export default RoleSwitcher;
