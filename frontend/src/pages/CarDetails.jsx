import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const CarDetails = () => {
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageAttempts, setImageAttempts] = useState([]);
  const { id } = useParams();

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        console.log('Fetching car details for ID:', id);
        setLoading(true);
        setError('');
        
        const response = await axios.get(`http://localhost:5000/api/cars/${id}`);
        console.log('Car details response:', response.data);
        setCar(response.data);
        
        // Log the car.image value
        console.log('Image path from API:', response.data.image);
        
        if (response.data.image) {
          // Extract the filename
          const filename = response.data.image.includes('/') 
            ? response.data.image.split('/').pop() 
            : response.data.image;
          
          console.log('Extracted filename:', filename);
          
          // Try different image paths
          const attempts = [
            { url: response.data.image_url, label: "API's image_url" },
            { url: `http://localhost:5000/${response.data.image}`, label: "Direct path" },
            { url: `http://localhost:5000/uploads/cars/${filename}`, label: "uploads/cars path" },
            { url: `http://localhost:5000/debug-image/${filename}`, label: "Debug route" }
          ];
          
          setImageAttempts(attempts);
          console.log('Will try these image URLs:', attempts);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching car details:', err);
        setError('Could not load car details. Please try again later.');
        setLoading(false);
      }
    };

    if (id) {
      fetchCarDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <p className="mt-2">
            <Link to="/" className="text-blue-500 hover:underline">
              Return to homepage
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>No car details found for ID: {id}</p>
          <p className="mt-2">
            <Link to="/" className="text-blue-500 hover:underline">
              Return to homepage
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Car Details</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            {car.image ? (
              <div className="relative">
                {/* Use an actual <img> for visual styling, but we'll load all attempts in hidden iframes */}
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Attempting to load image...</span>
                </div>
                
                {/* Hidden iframes to test each URL */}
                <div className="hidden">
                  {imageAttempts.map((attempt, index) => (
                    <iframe 
                      key={index}
                      src={attempt.url}
                      style={{position: 'absolute', width: '1px', height: '1px', opacity: 0}}
                      onLoad={(e) => {
                        console.log(`SUCCESS: Image loaded from ${attempt.label}:`, attempt.url);
                        // If we can load in iframe, we can display it as an image
                        document.getElementById('car-image').src = attempt.url;
                        document.getElementById('car-image').style.display = 'block';
                        document.getElementById('loading-placeholder').style.display = 'none';
                      }}
                      onError={(e) => {
                        console.error(`FAILED: Image failed to load from ${attempt.label}:`, attempt.url);
                      }}
                    />
                  ))}
                </div>
                
                {/* The actual image that will be displayed once we find a working URL */}
                <img 
                  id="car-image"
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-64 object-cover absolute top-0 left-0"
                  style={{display: 'none'}}
                />
                
                {/* Placeholder while loading */}
                <div 
                  id="loading-placeholder"
                  className="w-full h-64 bg-gray-200 flex items-center justify-center absolute top-0 left-0"
                >
                  <span className="text-gray-500">Image could not be loaded</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No image available</span>
              </div>
            )}
          </div>
          
          <div className="p-6 md:w-1/2">
            <h2 className="text-2xl font-bold text-gray-800">
              {car.brand} {car.model} ({car.year})
            </h2>
            <p className="text-gray-600 mt-2">{car.location}</p>
            <p className="text-green-600 font-bold text-xl mt-4">${car.price_per_day}/day</p>
            
            <div className="mt-6 grid grid-cols-2 gap-y-4">
              <div>
                <span className="text-gray-500 text-sm">Color</span>
                <p>{car.color}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Mileage</span>
                <p>{car.mileage} km</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Available From</span>
                <p>{new Date(car.availability_start).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Available Until</span>
                <p>{new Date(car.availability_end).toLocaleDateString()}</p>
              </div>
            </div>
            
            <button className="mt-8 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 w-full">
              Book Now
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Link to="/" className="text-blue-600 hover:underline">
          ← Back to Listings
        </Link>
      </div>
      
      {/* Debug panel - This will show all the image paths we're trying */}
      <div className="mt-6 p-4 bg-gray-100 rounded text-sm">
        <h3 className="font-bold mb-2">Image Debugging:</h3>
        <p className="mb-1">Raw image path: {car.image || 'None'}</p>
        <p className="mb-3">Image URL from API: {car.image_url || 'None'}</p>
        
        <h4 className="font-semibold mb-1">Attempted URLs:</h4>
        <ul className="list-disc pl-5 space-y-1">
          {imageAttempts.map((attempt, index) => (
            <li key={index}>
              <a 
                href={attempt.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 hover:underline break-all"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(attempt.url, '_blank');
                }}
              >
                {attempt.label}: {attempt.url}
              </a>
            </li>
          ))}
        </ul>
        
        <div className="mt-4">
          <h4 className="font-semibold mb-1">Hard-coded test:</h4>
          {car.image && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {imageAttempts.map((attempt, index) => (
                <div key={index} className="mb-2">
                  <p className="text-xs mb-1">{attempt.label}:</p>
                  <img 
                    src={attempt.url} 
                    alt={`Test ${index+1}`}
                    className="w-full h-32 object-cover border border-gray-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x150?text=Failed+to+Load';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarDetails;
