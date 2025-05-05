import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCar } from '../api/cars';
import LocationPicker from '../components/cars/LocationPicker';

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
    latitude: '',
    longitude: '',
    description: '',
    car_type: '',
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  
  
  const imageSection = useRef(null);

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

      
      setFieldErrors(prev => ({...prev, image: null}));

      
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedImage);
    }
  };
  
  
  useEffect(() => {
    if (fieldErrors.image && imageSection.current) {
      imageSection.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [fieldErrors]);

  
  const handleLocationSelect = useCallback((locationData) => {
    setFormData(prev => ({
      ...prev,
      latitude: locationData.lat,
      longitude: locationData.lng,
      
      location: locationData.address || prev.location
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    
    
    let hasErrors = false;
    const newFieldErrors = {};
    
    if (!formData.latitude || !formData.longitude) {
      setError('Please select a location on the map');
      hasErrors = true;
    }
    
    
    if (!image) {
      newFieldErrors.image = 'Please upload a photo of your car';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }

    try {
      
      const featuresArray = Object.entries(carFeatures)
        .filter(([_, isEnabled]) => isEnabled)
        .map(([feature, _]) => feature);

      
      const carData = new FormData();

      
      Object.keys(formData).forEach(key => {
        carData.append(key, formData[key]);
      });

      
      carData.append('features', JSON.stringify(featuresArray));

      
      if (image) {
        carData.append('image', image);
      }

      
      const response = await createCar(carData);

      if (response.success) {
        console.log('Car listing created:', response.data);
        setSuccess(true);

        
        setFormData({
          brand: '',
          model: '',
          year: new Date().getFullYear(),
          color: '',
          plate: '',
          mileage: '',
          price_per_day: '',
          location: '',
          latitude: '',
          longitude: '',
          description: '',
          car_type: '',
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

        
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError(response.error || 'Failed to create car listing');
      }
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
          {}
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
                <label className="block text-gray-700 font-semibold mb-2">Car Type</label>
                <select
                  name="car_type"
                  value={formData.car_type}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select car type</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="sports">Sports</option>
                  <option value="luxury">Luxury</option>
                  <option value="compact">Compact</option>
                  <option value="convertible">Convertible</option>
                </select>
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

          {}
          <div>
            <h2 className="text-xl font-semibold mb-4">Price & Location</h2>
            <div className="grid grid-cols-1 gap-6">
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
                <label className="block text-gray-700 font-semibold mb-2">Address</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  maxLength="90"
                  placeholder="Riyadh, Jeddah, Dammam..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  This address will be shown to renters. Use the map below to set the exact location.
                </p>
              </div>

              {}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Select Location on Map</label>
                <LocationPicker onLocationSelect={handleLocationSelect} />

                {}
                <input type="hidden" name="latitude" value={formData.latitude} />
                <input type="hidden" name="longitude" value={formData.longitude} />
              </div>
            </div>
          </div>

          {}
          
          {}
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

          {}
          <div>
            <h2 className="text-xl font-semibold mb-4">Features & Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(carFeatures).map(([feature, checked]) => (
                <label key={feature} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name={feature}
                    checked={checked}
                    onChange={handleFeatureChange}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>{feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                </label>
              ))}
            </div>
          </div>

          {}
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

          {}
          <div id="image-section" ref={imageSection}>
            <h2 className="text-xl font-semibold mb-4">
              Car Photos <span className="text-red-500">*</span>
            </h2>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${!image && (fieldErrors.image || error) ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
              <input
                type="file"
                id="car-image"
                onChange={handleImageChange}
                accept="image/*" />
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Image Preview:</p>
                  <img src={imagePreview} alt="Car preview" className="max-h-48 mx-auto rounded-md" />
                </div>
              )}
            </div>
          </div>
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
