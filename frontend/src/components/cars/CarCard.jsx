import React from 'react';
import { Link } from 'react-router-dom';

const CarCard = ({ car }) => {
  // Default image if none provided
  const defaultImage = 'https://via.placeholder.com/300x200?text=No+Image';
  
  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Safe access to properties with fallbacks
  const mileage = car.mileage ? car.mileage.toLocaleString() : 'N/A';
  const brand = car.brand || car.make || 'Unknown Brand';
  const model = car.model || 'Unknown Model';
  const year = car.year || 'N/A';
  const location = car.location || 'Unknown Location';
  const color = car.color || 'Unknown';
  const price = car.price_per_day || '0';
  const hostName = car.host_name || 'Unknown Host';

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        {/* Car Image */}
        <img
          src={car.image_url || defaultImage}
          alt={`${brand} ${model}`}
          className="w-full h-48 object-cover"
          onError={(e) => { e.target.src = defaultImage; }}
        />
        {/* Price Tag */}
        <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg font-semibold">
          {price} SAR/day
        </div>
      </div>
      <div className="p-4">
        {/* Car Title */}
        <h3 className="text-xl font-semibold text-gray-800">
          {brand} {model} ({year})
        </h3>
        <div className="mt-2 space-y-2">
          {/* Location */}
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span>{location}</span>
          </div>
          {/* Car Details */}
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>      
            </svg>
            <span>{color} • {mileage} km</span>
          </div>
          {/* Availability */}
          {car.availability_start && car.availability_end && (
            <div className="flex items-center text-gray-600">
              <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>
                {formatDate(car.availability_start)} - {formatDate(car.availability_end)}
              </span>
            </div>
          )}
        </div>
        {/* Host Name */}
        <div className="mt-3 text-sm text-gray-500">
          Hosted by: {hostName}
        </div>
        {/* Action Button */}
        <div className="mt-4">
          <Link
            to={`/cars/${car.id}`}
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-300"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
