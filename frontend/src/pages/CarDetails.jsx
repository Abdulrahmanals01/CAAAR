import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCarById } from '../api/cars';
import { getCarRatings } from '../api/ratings';
import useAuth from '../hooks/useAuth';
import BookingForm from '../components/bookings/BookingForm';
import StarRating from '../components/common/StarRating';
import { getImageUrl } from '../utils/imageUtils';
import { formatCurrency } from '../utils/dataFormatter';

const CarDetails = () => {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { user } = useAuth();
  const userRole = localStorage.getItem('userRole') || user?.role;
  const isHost = userRole === 'host';
  const userId = parseInt(localStorage.getItem('userId')) || user?.id || 0;

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        const response = await getCarById(id);
        if (response.success) {
          
          const carData = response.data;
          if (carData.image && !carData.image_url) {
            carData.image_url = getImageUrl(carData.image, 'cars');
          }
          
          
          if (carData.host_rating) {
            carData.host_rating = parseFloat(carData.host_rating);
          }
          
          setCar(carData);
          
          // For debugging car data structure
          console.log("Car data:", carData);

          
          setIsOwner(carData.user_id === userId);

          
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
        {}
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
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
          <div className="md:col-span-2">
            {}
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

            {}
            <div className="flex items-center mb-6">
              {car.host_rating && car.host_rating >= 4.8 && (
                <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  All-Star Host
                </div>
              )}
            </div>

            {}
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

                {/* Car Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 border-b pb-2">Description</h3>
                  {car.description ? (
                    <p className="text-gray-700">{car.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No description provided for this vehicle.</p>
                  )}
                </div>

                {}
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
                <h2 className="text-xl font-semibold mb-6">Car Details & Features</h2>
                
                {/* Basic Info Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span><strong>Brand & Model:</strong> {car.brand} {car.model}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span><strong>Year:</strong> {car.year}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      <span><strong>Color:</strong> {car.color}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span><strong>Mileage:</strong> {car.mileage} km</span>
                    </div>
                    {car.car_type && (
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span><strong>Car Type:</strong> {car.car_type}</span>
                      </div>
                    )}
                    {car.transmission && (
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <span><strong>Transmission:</strong> {car.transmission}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Features & Amenities Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">Features & Amenities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {car.features && typeof car.features === 'string' ? (
                      // If features is a string, split it by comma
                      car.features.split(',').map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <svg className="w-6 h-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature.trim()}</span>
                        </div>
                      ))
                    ) : car.features && Array.isArray(car.features) ? (
                      // If features is already an array
                      car.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <svg className="w-6 h-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{typeof feature === 'string' ? feature.trim() : feature}</span>
                        </div>
                      ))
                    ) : (
                      // Fallback if no features are available
                      <div className="col-span-2 text-gray-500 italic">
                        No specific features listed for this vehicle.
                      </div>
                    )}
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
                    <p className="text-gray-600 mb-6">Based on {totalRatings} guest ratings</p>

                    {}
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
                      <span className="text-2xl font-bold">{formatCurrency(car.price_per_day).replace('.00', '')}/day</span>
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
