import React from 'react';

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
    <div className="flex h-full">
      {/* Left side - image */}
      <div className="w-2/5 relative">
        <img
          src={car.image_url || defaultImage}
          alt={`${brand} ${model}`}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = defaultImage; }}
        />
      </div>
      
      {/* Right side - car details */}
      <div className="w-3/5 pl-4 flex flex-col justify-between">
        <div>
          {/* Car make, model, year */}
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold">
              {brand} {model} {year}
            </h3>
          </div>
          
          {/* Reviews/Rating (placeholder) */}
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1">5.0</span>
            </span>
            {/* Location */}
            <span className="ml-4 flex items-center">
              <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>{location}</span>
            </span>
          </div>
          
          {/* Car details */}
          <div className="mt-2 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span>{color} • {mileage} km</span>
            </div>
            {/* Availability */}
            {car.availability_start && car.availability_end && (
              <div className="flex items-center mt-1">
                <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>
                  {formatDate(car.availability_start)} - {formatDate(car.availability_end)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Price - aligned to the bottom */}
        <div className="mt-4 flex justify-between items-end">
          <div className="text-sm text-gray-500">
            Hosted by {hostName}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{price} SAR</div>
            <div className="text-sm text-gray-500">total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
