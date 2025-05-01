import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCarById } from '../api/cars';
import { getCarRatings } from '../api/ratings';
import BookingForm from '../components/bookings/BookingForm';
import StarRating from '../components/common/StarRating';

const CarDetails = () => {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const userRole = localStorage.getItem('userRole');
  const userId = parseInt(localStorage.getItem('userId')) || 0;
  const isHost = userRole === 'host';

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        const response = await getCarById(id);
        if (response.success) {
          setCar(response.data);
          // Check if the current user is the owner of this car
          setIsOwner(response.data.user_id === userId);

          // Fetch car ratings
          const ratingsResponse = await getCarRatings(id);
          if (ratingsResponse.success) {
            setRatings(ratingsResponse.data);
          }
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError('Failed to load car details');
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [id, userId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          Car not found
        </div>
      </div>
    );
  }

  const averageRating = ratings?.averageRating || 0;
  const totalRatings = ratings?.totalRatings || 0;

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 font-medium ${
                activeTab === 'overview' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`py-4 px-6 font-medium ${
                activeTab === 'features' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              FEATURES
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-6 font-medium ${
                activeTab === 'reviews' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              REVIEWS
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`py-4 px-6 font-medium ${
                activeTab === 'location' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              LOCATION
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
          <div className="md:col-span-2">
            {/* Car Image */}
            {car.image_url ? (
              <img
                src={car.image_url}
                alt={`${car.brand} ${car.model}`}
                className="w-full h-96 object-cover rounded-lg mb-6"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg mb-6">
                <p className="text-gray-500">No image available</p>
              </div>
            )}

            <div className="mb-6">
              <h1 className="text-3xl font-bold">
                {car.brand} {car.model} {car.year}
              </h1>
              <p className="text-gray-600">{car.location}</p>
            </div>

            {/* Car rating summary */}
            <div className="flex items-center mb-6">
              <div className="text-2xl font-bold mr-2">{averageRating.toFixed(1)}</div>
              <StarRating rating={averageRating} size="md" />
              <span className="ml-2 text-gray-600">
                ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
              </span>
              {car.host_rating && car.host_rating >= 4.8 && (
                <div className="ml-4 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  All-Star Host
                </div>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h3 className="font-medium">Color</h3>
                      <p className="text-gray-600">{car.color}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <h3 className="font-medium">Mileage</h3>
                      <p className="text-gray-600">{car.mileage} km</p>
                    </div>
                  </div>
                </div>

                {car.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-700">{car.description}</p>
                  </div>
                )}

                {/* Host Information */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">HOSTED BY</h3>
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4 text-blue-700 text-xl font-bold">
                      {car.host_name?.charAt(0).toUpperCase() || 'H'}
                    </div>
                    <div>
                      <Link to={`/profile/${car.user_id}`} className="text-xl font-bold hover:underline">
                        {car.host_name}
                      </Link>
                      {car.host_joined_date && (
                        <p className="text-gray-600 text-sm">
                          Joined {new Date(car.host_joined_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      )}
                      {car.host_rating && (
                        <div className="flex items-center mt-1">
                          <div className="text-lg font-bold">{car.host_rating.toFixed(1)}</div>
                          <StarRating rating={car.host_rating} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
                      <p>This is your own car listing. You cannot book your own car.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Car Features</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{car.color} exterior</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{car.mileage} km mileage</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Model year: {car.year}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h2 className="text-xl font-semibold mb-2">RATINGS AND REVIEWS</h2>
                <div className="flex items-center mb-6">
                  <div className="text-4xl font-bold mr-2">{averageRating.toFixed(1)}</div>
                  <StarRating rating={averageRating} size="lg" />
                  <span className="ml-2 text-gray-600">
                    ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>

                {ratings && ratings.ratings && ratings.ratings.length > 0 ? (
                  <div className="space-y-6">
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Cleanliness</span>
                        <div className="flex items-center">
                          <div className="w-48 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full" 
                              style={{ width: `${(ratings.categories?.cleanliness || 0) * 20}%` }}
                            ></div>
                          </div>
                          <span>{ratings.categories?.cleanliness?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Maintenance</span>
                        <div className="flex items-center">
                          <div className="w-48 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full" 
                              style={{ width: `${(ratings.categories?.maintenance || 0) * 20}%` }}
                            ></div>
                          </div>
                          <span>{ratings.categories?.maintenance?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Communication</span>
                        <div className="flex items-center">
                          <div className="w-48 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full" 
                              style={{ width: `${(ratings.categories?.communication || 0) * 20}%` }}
                            ></div>
                          </div>
                          <span>{ratings.categories?.communication?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Convenience</span>
                        <div className="flex items-center">
                          <div className="w-48 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full" 
                              style={{ width: `${(ratings.categories?.convenience || 0) * 20}%` }}
                            ></div>
                          </div>
                          <span>{ratings.categories?.convenience?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-6">Based on {totalRatings} guest ratings</p>

                    {/* Individual reviews */}
                    <div className="space-y-8">
                      {ratings.ratings.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 pb-6">
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-blue-700 font-bold">
                              {review.renter_name?.charAt(0).toUpperCase() || 'G'}
                            </div>
                            <div>
                              <div className="font-medium">{review.renter_name}</div>
                              <div className="text-gray-500 text-sm">
                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center mb-2">
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">No reviews yet for this car</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'location' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Car Location</h2>
                <p className="mb-4">{car.location}</p>
                <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Location map would appear here</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="sticky top-6">
              {isOwner ? (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4">Your Car Listing</h2>
                  <p className="text-gray-600 mb-4">
                    This is your own car listing. You cannot book your own car, even when in renter mode.
                  </p>
                  <p className="text-gray-600">
                    You can manage this listing from your host dashboard.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="bg-gray-100 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price</span>
                      <span className="text-2xl font-bold">${car.price_per_day}/day</span>
                    </div>
                  </div>
                  <BookingForm car={car} isHost={isHost} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetails;
