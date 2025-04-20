import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ListCar = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    plate: '',
    mileage: '',
    price_per_day: '',
    location: '',
    description: '',
    availability_start: new Date().toISOString().split('T')[0],
    availability_end: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
  });
  
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      // Create FormData object for file upload
      const carData = new FormData();
      
      // Add form fields to FormData
      Object.keys(formData).forEach(key => {
        carData.append(key, formData[key]);
      });
      
      // Add image if provided
      if (image) {
        carData.append('image', image);
      }
      
      // Make API request to create car listing
      const response = await axios.post(
        'http://localhost:5000/api/cars',
        carData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Car listing created:', response.data);
      setSuccess(true);
      
      // Reset form
      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        plate: '',
        mileage: '',
        price_per_day: '',
        location: '',
        description: '',
        availability_start: new Date().toISOString().split('T')[0],
        availability_end: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
      });
      
      setImage(null);
      
      // Redirect after success
      setTimeout(() => navigate('/dashboard'), 2000);
      
    } catch (err) {
      console.error('Error listing car:', err);
      setError(err.response?.data?.message || 'Failed to create car listing');
    } finally {
      setLoading(false);
    }
  };

  // Protection already applied via HostRoute, this is just an extra check
  if (currentUser?.role !== 'host') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-bold">Access Denied</p>
          <p>You need to be in host mode to list a car.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">List Your Car</h1>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            Your car has been listed successfully! Redirecting to dashboard...
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Car details form fields */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">License Plate</label>
              <input
                type="text"
                name="plate"
                value={formData.plate}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Mileage (km)</label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                required
                min="0"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Price per day (SAR)</label>
              <input
                type="number"
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleChange}
                required
                min="1"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="City, neighborhood"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Available From</label>
              <input
                type="date"
                name="availability_start"
                value={formData.availability_start}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Available Until</label>
              <input
                type="date"
                name="availability_end"
                value={formData.availability_end}
                onChange={handleChange}
                required
                min={formData.availability_start}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your car, features, condition, etc."
              className="w-full p-3 border border-gray-300 rounded-md"
            ></textarea>
          </div>
          
          {/* Car Image */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Car Image</label>
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              className="w-full p-3 border border-gray-300 rounded-md"
            />
            <p className="text-sm text-gray-500 mt-2">Upload a clear image of your car</p>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating Listing...' : 'List Your Car'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ListCar;
