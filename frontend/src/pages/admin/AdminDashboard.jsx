import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [deletedListings, setDeletedListings] = useState([]);
  const [adminActions, setAdminActions] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [freezeDuration, setFreezeDuration] = useState(7);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'listings') {
      fetchListings();
    } else if (activeTab === 'deleted') {
      fetchDeletedListings();
    } else if (activeTab === 'actions') {
      fetchAdminActions();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.users || []);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/listings');
      setListings(response.data.listings || []);
    } catch (err) {
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedListings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/listings/deleted');
      setDeletedListings(response.data.deletedListings || []);
    } catch (err) {
      setError('Failed to fetch deleted listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminActions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/actions');
      setAdminActions(response.data.actions || []);
    } catch (err) {
      setError('Failed to fetch admin actions');
    } finally {
      setLoading(false);
    }
  };

  const handleFreezeUser = async (userId) => {
    if (!reason) {
      alert('Please provide a reason');
      return;
    }
    try {
      await axios.post(`/api/admin/users/${userId}/freeze`, {
        duration: freezeDuration,
        reason
      });
      fetchUsers();
      setSelectedUser(null);
      setReason('');
    } catch (err) {
      setError('Failed to freeze user');
    }
  };

  const handleUnfreezeUser = async (userId) => {
    try {
      await axios.post(`/api/admin/users/${userId}/unfreeze`);
      fetchUsers();
    } catch (err) {
      setError('Failed to unfreeze user');
    }
  };

  const handleBanUser = async (userId) => {
    if (!reason) {
      alert('Please provide a reason');
      return;
    }
    try {
      await axios.post(`/api/admin/users/${userId}/ban`, { reason });
      fetchUsers();
      setSelectedUser(null);
      setReason('');
    } catch (err) {
      setError('Failed to ban user');
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

  const handleDeleteListing = async (listingId) => {
    if (!reason) {
      alert('Please provide a reason');
      return;
    }
    try {
      await axios.delete(`/api/admin/listings/${listingId}`, { data: { reason } });
      fetchListings();
      setSelectedListing(null);
      setReason('');
    } catch (err) {
      setError('Failed to delete listing');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get badge colors based on action type
  const getActionBadgeClass = (actionType) => {
    switch (actionType) {
      case 'freeze':
        return 'bg-yellow-100 text-yellow-800';
      case 'unfreeze':
        return 'bg-green-100 text-green-800';
      case 'ban':
        return 'bg-red-100 text-red-800';
      case 'unban':
        return 'bg-green-100 text-green-800';
      case 'delete_listing':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format action type for display
  const formatActionType = (actionType) => {
    switch (actionType) {
      case 'delete_listing':
        return 'Delete Listing';
      default:
        return actionType.charAt(0).toUpperCase() + actionType.slice(1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'listings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Listings
            </button>
            <button
              onClick={() => setActiveTab('deleted')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'deleted'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Deleted Listings
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'actions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Action History
            </button>
          </nav>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div>
          {activeTab === 'users' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap capitalize">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'frozen' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.status === 'frozen' && user.freeze_until && (
                            <div>
                              <p>Frozen until: {formatDate(user.freeze_until)}</p>
                              <p>Reason: {user.freeze_reason}</p>
                            </div>
                          )}
                          {user.status === 'banned' && (
                            <div>
                              <p>Ban reason: {user.ban_reason}</p>
                            </div>
                          )}
                        </td>
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

          {activeTab === 'listings' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Car
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings && listings.length > 0 ? (
                    listings.map((listing) => (
                      <tr key={listing.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {listing.brand} {listing.model}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{listing.owner_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">${listing.price_per_day}/day</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(listing.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedListing(listing)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No listings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'deleted' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Car
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deleted By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deleted At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deletedListings && deletedListings.length > 0 ? (
                    deletedListings.map((listing) => (
                      <tr key={listing.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {listing.brand} {listing.model} ({listing.year})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{listing.owner_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{listing.admin_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(listing.deleted_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{listing.reason}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No deleted listings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adminActions && adminActions.length > 0 ? (
                    adminActions.map((action) => (
                      <tr key={action.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{action.admin_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadgeClass(action.action_type)}`}>
                            {formatActionType(action.action_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className="capitalize">{action.target_type}:</span> {action.target_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(action.performed_at)}</td>
                        <td className="px-6 py-4">{action.reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {action.expires_at ? formatDate(action.expires_at) : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No admin actions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Freeze User Modal */}
      {selectedUser && selectedUser.action === 'freeze' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Freeze User Account</h2>
            <p className="mb-4">Freeze account for: {selectedUser.name}</p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Duration (days):
              </label>
              <input
                type="number"
                value={freezeDuration}
                onChange={(e) => setFreezeDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Reason:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                rows="3"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFreezeUser(selectedUser.id)}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Freeze Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {selectedUser && selectedUser.action === 'ban' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Ban User Account</h2>
            <p className="mb-4">Ban account for: {selectedUser.name}</p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Reason:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                rows="3"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBanUser(selectedUser.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Ban Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Listing Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Delete Listing</h2>
            <p className="mb-4">Delete listing: {selectedListing.brand} {selectedListing.model}</p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Reason:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                rows="3"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedListing(null)}
                className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteListing(selectedListing.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
