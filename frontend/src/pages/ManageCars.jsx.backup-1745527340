import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ManageCars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/cars/owner', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setCars(response.data);
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Failed to load your cars. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCars();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Your Cars</h1>
        <Link to="/list-car" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Add New Car
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : cars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map(car => (
            <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {car.image_url && (
                <img
                  src={car.image_url}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{car.brand} {car.model}</h2>
                <p className="text-gray-600 mb-2">{car.year} • {car.color}</p>
                <p className="text-lg font-bold text-blue-600 mb-3">{car.price_per_day} SAR/day</p>
                <div className="flex justify-between">
                  <Link to={`/cars/${car.id}`} className="text-blue-500 hover:underline">
                    View Details
                  </Link>
                  <button className="text-gray-500 hover:underline">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-3">You don't have any cars listed yet</h2>
          <p className="mb-4">Start earning by adding your first car listing!</p>
          <Link to="/list-car" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-block">
            List a Car Now
          </Link>
        </div>
      )}
    </div>
  );
};

export default ManageCars;
