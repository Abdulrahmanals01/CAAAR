import React, { useState, useEffect } from 'react';
import { updateCarAvailability } from '../../api/cars';

const EditAvailabilityModal = ({ car, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    availability_start: car?.availability_start || new Date().toISOString().split('T')[0],
    availability_end: car?.availability_end || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (car) {
      setFormData({
        availability_start: car.availability_start || new Date().toISOString().split('T')[0],
        availability_end: car.availability_end || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
      });
    }
  }, [car]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await updateCarAvailability(car.id, formData);
      
      if (result.success) {
        setLoading(false);
        onSuccess(result.data.car);
        onClose();
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error updating availability:', err);
      setError('An unexpected error occurred. Please try again later.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Edit Availability</h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Available From</label>
            <input
              type="date"
              name="availability_start"
              value={formData.availability_start}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Available Until</label>
            <input
              type="date"
              name="availability_end"
              value={formData.availability_end}
              onChange={handleChange}
              required
              min={formData.availability_start}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAvailabilityModal;
