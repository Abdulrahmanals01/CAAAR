import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';

const AdminDashboard = () => {
  // ... [Previous state declarations remain the same] ...

  const handleUnfreezeUser = async (userId) => {
    try {
      await axios.post(`/api/admin/users/${userId}/unfreeze`);
      fetchUsers();
    } catch (err) {
      setError('Failed to unfreeze user');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await axios.post(`/api/admin/users/${userId}/unban`);
      fetchUsers();
    } catch (err) {
      setError('Failed to unban user');
    }
  };

  // ... [Previous functions remain the same] ...

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... [Previous JSX remains the same] ... */}

      {activeTab === 'users' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {/* ... [Table headers remain the same] ... */}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    {/* ... [Previous columns remain the same] ... */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.status === 'active' && user.role !== 'admin' && (
                        <>
                          <button
                            onClick={() => setSelectedUser({ ...user, action: 'freeze' })}
                            className="text-yellow-600 hover:text-yellow-900 mr-4"
                          >
                            Freeze
                          </button>
                          <button
                            onClick={() => setSelectedUser({ ...user, action: 'ban' })}
                            className="text-red-600 hover:text-red-900"
                          >
                            Ban
                          </button>
                        </>
                      )}
                      {user.status === 'frozen' && (
                        <button
                          onClick={() => handleUnfreezeUser(user.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Unfreeze
                        </button>
                      )}
                      {user.status === 'banned' && (
                        <button
                          onClick={() => handleUnbanUser(user.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Unban
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ... [Rest of the JSX remains the same] ... */}
    </div>
  );
};

export default AdminDashboard;
