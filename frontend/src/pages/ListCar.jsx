import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ListCar = () => {
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
  const navigate = useNavigate();

  // Check if user is logged in and is a host
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
      setError('No token, authorization denied');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else if (userRole !== 'host') {
      setError('Only hosts can list cars');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No token, authorization denied');
        setLoading(false);
        return;
      }
      
      // Create FormData object to handle file uploads
      const carData = new FormData();
      
      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        carData.append(key, formData[key]);
      });
      
      // Add image to FormData if provided
      if (image) {
        carData.append('image', image);
      }
      
      console.log('Submitting car data...');
      
      // Send request with token
      const response = await axios.post('http://localhost:5000/api/cars', carData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Car listing response:', response.data);
      setSuccess(true);
      setLoading(false);
      
      // Reset form after successful submission
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
      
      // Redirect to car details page after short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      setLoading(false);
      console.error('Error listing car:', err);
      
      if (err.response) {
        setError(err.response.data?.message || `Error: ${err.response.status}`);
        console.log('Error details:', err.response.data);
      } else if (err.request) {
        setError('No response from server. Please try again later.');
      } else {
        setError('Error: ' + err.message);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">List Your Car</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Your car has been listed successfully! Redirecting...
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Car Brand */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Car Model */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Year */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Color */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* License Plate */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                License Plate
              </label>
              <input
                type="text"
                name="plate"
                value={formData.plate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Mileage */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Mileage (km)
              </label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Price per day */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Price per day (SAR)
              </label>
              <input
                type="number"
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Location */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="City, neighborhood"
              />
            </div>
            
            {/* Availability Start */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Available From
              </label>
              <input
                type="date"
                name="availability_start"
                value={formData.availability_start}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Availability End */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Available Until
              </label>
              <input
                type="date"
                name="availability_end"
                value={formData.availability_end}
                onChange={handleChange}
                min={formData.availability_start}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          {/* Description */}
          <div className="mt-6">
            <label className="block text-gray-700 font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your car, special features, condition, etc."
            ></textarea>
          </div>
          
          {/* Car Image */}
          <div className="mt-6">
            <label className="block text-gray-700 font-medium mb-2">
              Car Image
            </label>
            <input
              type="file"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              accept="image/*"
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload a clear image of your car
            </p>
          </div>
          
          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              disabled={loading}
            >
              {loading ? 'Listing Car...' : 'List Your Car'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ListCar;
