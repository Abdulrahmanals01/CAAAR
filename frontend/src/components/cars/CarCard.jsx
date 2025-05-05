import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../common/StarRating';
import { formatCurrency } from '../../utils/dataFormatter';
import { getImageUrl } from '../../utils/imageUtils';

const CarCard = ({ car }) => {

  return (
    <div className="flex flex-col md:flex-row w-full h-full shadow-md rounded-lg overflow-hidden bg-white">
      {}
      <div className="md:w-1/3 h-48 md:h-auto relative">
        <img
          src={car.image_url || getImageUrl(car.image, 'cars')}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/images/car-placeholder.jpg';
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold">{formatCurrency(car.price_per_day).replace('.00', '')}/day</span>
            {car.rating && (
              <div className="flex items-center">
                <StarRating rating={car.rating} size="sm" />
                <span className="text-white ml-1">{car.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {}
      <div className="md:w-2/3 p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {car.brand} {car.model} {car.year}
          </h2>
          <p className="text-gray-600 text-sm mb-2">{car.location}</p>
          
          <div className="flex flex-wrap gap-2 my-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {car.color}
            </span>
            {car.mileage && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {car.mileage.toLocaleString()} km
              </span>
            )}
            {car.car_type && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {car.car_type}
              </span>
            )}
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              Insurance: Tawuniya
            </span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {car.availability_start && car.availability_end && (
              <p>
                Available: {new Date(car.availability_start).toLocaleDateString()} - {new Date(car.availability_end).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <Link
            to={`/cars/${car.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
