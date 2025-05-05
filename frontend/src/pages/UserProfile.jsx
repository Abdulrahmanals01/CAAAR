import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserProfile } from '../api/profiles';
import { getUserRatings } from '../api/ratings';
import { AuthContext } from '../context/AuthContext';
import StarRating from '../components/common/StarRating';
import RatingCard from '../components/ratings/RatingCard';
import { formatDistanceToNow } from 'date-fns';

const UserProfile = () => {
  const { userId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about'); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        
        const profileResponse = await getUserProfile(userId);
        
        if (!profileResponse.success) {
          throw new Error(profileResponse.error || 'Failed to load user profile');
        }
        
        setProfile(profileResponse.data);
        
        
        const ratingsResponse = await getUserRatings(userId);
        
        if (!ratingsResponse.success) {
          throw new Error(ratingsResponse.error || 'Failed to load user ratings');
        }
        
        setRatings(ratingsResponse.data);
        
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
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

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          User not found
        </div>
      </div>
    );
  }

  const { user, stats } = profile;
  const isHost = user.role === 'host';
  const isCurrentUser = currentUser && currentUser.id === parseInt(userId);
  const memberSince = formatDistanceToNow(new Date(user.created_at), { addSuffix: true });
  const totalTrips = stats.totalBookings || 0;
  const isAllStarHost = isHost && stats.averageRating >= 4.8 && totalTrips >= 10;

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="md:col-span-1">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-5xl font-bold mb-4">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <div className="flex items-center justify-center mt-2">
                  <div className="font-bold mr-1">{stats.averageRating.toFixed(1)}</div>
                  <StarRating rating={stats.averageRating} size="md" />
                </div>
                <p className="text-gray-600 mt-1">
                  {totalTrips} {totalTrips === 1 ? 'trip' : 'trips'} • Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {isAllStarHost && (
                <div className="mt-4 bg-purple-100 rounded-lg p-4 w-full">
                  <div className="flex items-center mb-2">
                    <div className="relative">
                      <div className="absolute -top-1 -right-1 text-purple-500">✦</div>
                      <div className="bg-purple-500 text-white p-2 rounded-full">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-bold text-purple-800 ml-2">All-Star Host</h3>
                  </div>
                  <p className="text-sm text-purple-800">
                    All-Star Hosts like {user.name} are the top-rated and most experienced hosts on Sayarati.
                  </p>
                </div>
              )}

              <div className="mt-6 w-full border-t pt-6">
                <h3 className="font-bold text-gray-600 uppercase mb-4">VERIFIED INFO</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Email address</span>
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Phone number</span>
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ID verified</span>
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            {}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('about')}
                  className={`py-4 px-6 font-medium text-sm ${
                    activeTab === 'about'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ABOUT {user.name.toUpperCase()}
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-4 px-6 font-medium text-sm ${
                    activeTab === 'reviews'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  REVIEWS ({stats.totalRatings})
                </button>
              </nav>
            </div>

            {}
            <div className="p-1">
              {}
              {activeTab === 'about' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">About {user.name}</h2>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-2">Welcome Guests</h3>
                    {}
                    <p className="text-gray-700">
                      {user.bio || `${user.name} is a ${isHost ? 'host' : 'renter'} on Sayarati.`}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Stats</h3>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-gray-600">Total trips:</span>
                          <span className="font-medium">{stats.totalBookings}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Completed trips:</span>
                          <span className="font-medium">{stats.completedBookings}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Cancellations:</span>
                          <span className="font-medium">{stats.canceledBookings}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Average rating:</span>
                          <span className="font-medium flex items-center">
                            {stats.averageRating.toFixed(1)}
                            <StarRating rating={stats.averageRating} size="sm" />
                          </span>
                        </li>
                      </ul>
                    </div>
                    
                    {isCurrentUser && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-2">Actions</h3>
                        <div className="space-y-2">
                          <Link 
                            to="/dashboard" 
                            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                          >
                            Go to Dashboard
                          </Link>
                          {isHost ? (
                            <Link 
                              to="/manage-cars" 
                              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                            >
                              Manage Your Cars
                            </Link>
                          ) : (
                            <Link 
                              to="/dashboard/renter" 
                              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                            >
                              View Your Bookings
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {}
              {activeTab === 'reviews' && (
                <div>
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold">Reviews for {user.name}</h2>
                    <div className="ml-4 flex items-center">
                      <StarRating rating={stats.averageRating} size="md" />
                      <span className="ml-2 text-gray-600">
                        ({stats.totalRatings} {stats.totalRatings === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  </div>
                  
                  {ratings?.ratings.length === 0 ? (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <p className="text-gray-500">No reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {ratings?.ratings.map(rating => (
                        <div key={rating.id} className="border-b border-gray-200 pb-6">
                          <div className="flex items-center mb-2">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-blue-700 font-bold">
                              {rating.rated_by_name?.charAt(0).toUpperCase() || 'G'}
                            </div>
                            <div>
                              <div className="font-medium">{rating.rated_by_name}</div>
                              <div className="text-gray-500 text-sm">
                                {new Date(rating.created_at).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center mb-2">
                            <StarRating rating={rating.rating} size="sm" />
                          </div>
                          {rating.comment && (
                            <p className="text-gray-700">{rating.comment}</p>
                          )}
                          {rating.car_id && (
                            <div className="mt-2 text-sm text-gray-500">
                              <Link to={`/cars/${rating.car_id}`} className="hover:underline text-blue-600">
                                {rating.brand} {rating.model} ({rating.year})
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
