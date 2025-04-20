import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ListCar = () => {
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

  const [carFeatures, setCarFeatures] = useState({
    airConditioning: false,
    bluetooth: false,
    gps: false,
    usbPort: false,
    heatedSeats: false,
    sunroof: false,
    petFriendly: false,
    childSeat: false
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFeatureChange = (e) => {
    const { name, checked } = e.target;
    setCarFeatures({ ...carFeatures, [name]: checked });
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedImage);
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
        setLoading(false);
        return;
      }

      // Add features to description
      const featuresText = Object.entries(carFeatures)
        .filter(([_, isEnabled]) => isEnabled)
        .map(([feature, _]) => {
          // Convert camelCase to readable text
          return feature
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
        });
      
      let enhancedDescription = formData.description;
      
      if (featuresText.length > 0) {
        enhancedDescription += `\n\nFeatures: ${featuresText.join(', ')}`;
      }

      // Create FormData object for file upload
      const carData = new FormData();

      // Add form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key === 'description') {
          carData.append(key, enhancedDescription);
        } else {
          carData.append(key, formData[key]);
        }
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
      setCarFeatures({
        airConditioning: false,
        bluetooth: false,
        gps: false,
        usbPort: false,
        heatedSeats: false,
        sunroof: false,
        petFriendly: false,
        childSeat: false
      });
      setImage(null);
      setImagePreview(null);

      // Redirect after success
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err) {
      console.error('Error listing car:', err);
      setError(err.response?.data?.message || 'Failed to create car listing');
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Car Details Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Car Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Toyota, Honda, BMW..."
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
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Camry, Civic, X5..."
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
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="White, Black, Red..."
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
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Price & Location Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Price & Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Price per day (SAR)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600">
                    ﷼
                  </span>
                  <input
                    type="number"
                    name="price_per_day"
                    value={formData.price_per_day}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="Riyadh, Jeddah, Dammam..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Availability Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Availability</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
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

              <div>
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
            </div>
          </div>

          {/* Features Section - Similar to Turo */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Features & Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="airConditioning"
                  checked={carFeatures.airConditioning}
                  onChange={handleFeatureChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Air Conditioning</span>
              </label>
              <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="bluetooth"
                  checked={carFeatures.bluetooth}
                  onChange={handleFeatureChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Bluetooth</span>
              </label>
              <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="gps"
                  checked={carFeatures.gps}
                  onChange={handleFeatureChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>GPS</span>
              </label>
              <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="usbPort"
                  checked={carFeatures.usbPort}
                  onChange={handleFeatureChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>USB Port</span>
              </label>
              <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="heatedSeats"
                  checked={carFeatures.heatedSeats}
                  onChange={handleFeatureChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Heated Seats</span>
              </label>
              <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="sunroof"
                  checked={carFeatures.sunroof}
                  onChange={handleFeatureChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Sunroof</span>
              </label>
              <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="petFriendly"
                  checked={carFeatures.petFriendly}
                  onChange={handleFeatureChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Pet Friendly</span>
              </label>
              <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="childSeat"
                  checked={carFeatures.childSeat}
                  onChange={handleFeatureChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Child Seat</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your car, features, condition, and anything special renters should know."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          {/* Car Images */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Car Photos</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="car-image"
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <label 
                htmlFor="car-image"
                className="cursor-pointer block w-full"
              >
                {!imagePreview ? (
                  <>
                    <div className="mx-auto w-12 h-12 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Click to upload a photo of your car (Max size: 5MB)
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      JPG, PNG or GIF
                    </p>
                  </>
                ) : (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Car preview" 
                      className="max-h-64 mx-auto rounded"
                    />
                    <p className="mt-2 text-sm text-gray-500">Click to change the image</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50 text-lg font-semibold"
          >
            {loading ? 'Creating Listing...' : 'List Your Car'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ListCar;
