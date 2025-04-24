import React, { useState } from 'react';
import StarRating from '../common/StarRating';
import { createRating } from '../../api/ratings';

const RatingForm = ({ booking, isRenter, onSuccess, onCancel }) => {
  const [userRating, setUserRating] = useState(0);
  const [carRating, setCarRating] = useState(0);
  const [comment, setComment] = useState('');
  const [carComment, setCarComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate ratings
    if (userRating < 1) {
      setError('Please provide a rating for the user');
      return;
    }
    
    if (isRenter && carRating < 1) {
      setError('Please provide a rating for the car');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create the rating payload
      const ratingData = {
        booking_id: booking.id,
        rating_for: isRenter ? booking.host_id : booking.renter_id,
        car_id: booking.car_id,
        rating: userRating,
        comment
      };
      
      // If renter, add car rating
      if (isRenter) {
        ratingData.car_rating = carRating;
        ratingData.car_comment = carComment;
      }
      
      const response = await createRating(ratingData);
      
      if (response.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(response.error || 'Failed to submit rating');
      }
    } catch (err) {
      setError('An error occurred while submitting your rating');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">
        Rate your {isRenter ? 'Host' : 'Renter'}
      </h3>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">
            Rate {isRenter ? (
              <span>host <strong>{booking.host_name}</strong></span>
            ) : (
              <span>renter <strong>{booking.renter_name}</strong></span>
            )}:
          </label>
          <StarRating 
            rating={userRating}
            size="lg"
            interactive={true}
            onChange={setUserRating}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Comment (optional):</label>
          <textarea
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
          ></textarea>
        </div>
        
        {isRenter && (
          <>
            <div className="border-t pt-4 mt-6 mb-6">
              <h4 className="text-lg font-medium mb-4">
                Rate the car: {booking.brand} {booking.model}
              </h4>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Car Rating:</label>
                <StarRating 
                  rating={carRating}
                  size="lg"
                  interactive={true}
                  onChange={setCarRating}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Car Comment (optional):</label>
                <textarea
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={carComment}
                  onChange={(e) => setCarComment(e.target.value)}
                  placeholder="Share your experience with the car..."
                ></textarea>
              </div>
            </div>
          </>
        )}
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RatingForm;
