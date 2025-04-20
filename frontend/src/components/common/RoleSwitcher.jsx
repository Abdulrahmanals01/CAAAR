import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const RoleSwitcher = () => {
  const { currentUser, switchRole } = useContext(AuthContext);

  const handleSwitchRole = () => {
    // Call switchRole and handle redirection directly without waiting for the promise
    switchRole();
    
    // Force redirect to home page immediately
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleSwitchRole}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Switch to {currentUser?.role === 'host' ? 'Renter' : 'Host'} Mode
    </button>
  );
};

export default RoleSwitcher;
