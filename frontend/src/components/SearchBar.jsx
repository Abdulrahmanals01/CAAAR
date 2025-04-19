import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const [searchParams, setSearchParams] = useState({
    location: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '10:00'
  });
  
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({
      ...searchParams,
      [name]: value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Create query string from search parameters
    const queryString = new URLSearchParams({
      location: searchParams.location,
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
      startTime: searchParams.startTime,
      endTime: searchParams.endTime
    }).toString();
    
    // Navigate to search results page with query parameters
    navigate(`/cars/search?${queryString}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-6xl mx-auto -mt-8 relative z-10">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Where</label>
          <input
            type="text"
            id="location"
            name="location"
            placeholder="City, airport, address or hotel"
            value={searchParams.location}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:w-2/5">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <div className="flex">
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={searchParams.startDate}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <select
                name="startTime"
                value={searchParams.startTime}
                onChange={handleInputChange}
                className="p-3 border border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                    {i < 12 ? `${i === 0 ? 12 : i}:00 AM` : `${i === 12 ? 12 : i - 12}:00 PM`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Until</label>
            <div className="flex">
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={searchParams.endDate}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                min={searchParams.startDate}
                required
              />
              <select
                name="endTime"
                value={searchParams.endTime}
                onChange={handleInputChange}
                className="p-3 border border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                    {i < 12 ? `${i === 0 ? 12 : i}:00 AM` : `${i === 12 ? 12 : i - 12}:00 PM`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex items-end">
          <button 
            type="submit" 
            className="w-full md:w-auto p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
