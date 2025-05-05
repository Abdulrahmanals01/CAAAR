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
        
        const { token, user: updatedUser } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        
        setUserData(updatedUser);
        
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        
        updateUser(updatedUser);
        
        
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
