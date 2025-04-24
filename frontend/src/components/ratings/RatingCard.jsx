import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import StarRating from '../common/StarRating';
import { Link } from 'react-router-dom';

const RatingCard = ({ rating, type = 'user' }) => {
  // Format the date
  const formattedDate = rating.created_at
    ? formatDistanceToNow(new Date(rating.created_at), { addSuffix: true })
    : '';

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-700 font-medium">
              {type === 'user' 
                ? rating.rated_by_name?.charAt(0).toUpperCase() 
                : rating.renter_name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-medium">
              {type === 'user' ? rating.rated_by_name : rating.renter_name}
            </h4>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <StarRating rating={rating.rating} size="sm" />
              <span className="ml-2">{formattedDate}</span>
            </div>
          </div>
        </div>
        {type === 'user' && (
          <div className="text-sm text-gray-500">
            <Link to={`/cars/${rating.car_id}`} className="hover:underline">
              {rating.brand} {rating.model}
            </Link>
          </div>
        )}
      </div>
      
      {rating.comment && (
        <div className="mt-3 text-gray-700">
          {rating.comment}
        </div>
      )}
      
      {type === 'user' && (
        <div className="mt-2 text-xs text-gray-500">
          Trip: {new Date(rating.start_date).toLocaleDateString()} - {new Date(rating.end_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default RatingCard;
