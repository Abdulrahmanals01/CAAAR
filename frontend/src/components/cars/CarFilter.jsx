import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CarFilter = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    location: '',
    brand: '',
    min_price: '',
    max_price: '',
    start_date: null,
    end_date: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleDateChange = (dateType, date) => {
    setFilters({
      ...filters,
      [dateType]: date
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert dates to ISO strings if they exist
    const formattedFilters = {
      ...filters,
      start_date: filters.start_date ? filters.start_date.toISOString().split('T')[0] : '',
      end_date: filters.end_date ? filters.end_date.toISOString().split('T')[0] : ''
    };
    
    onFilterChange(formattedFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      location: '',
      brand: '',
      min_price: '',
      max_price: '',
      start_date: null,
      end_date: null
    };
    
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">Filter Cars</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Location Filter */}
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={filters.location}
              onChange={handleInputChange}
              placeholder="City, Area"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Brand Filter */}
          <div className="mb-4">
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={filters.brand}
              onChange={handleInputChange}
              placeholder="Toyota, Honda, etc."
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Price Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Range (SAR/day)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                name="min_price"
                value={filters.min_price}
                onChange={handleInputChange}
                placeholder="Min"
                className="w-1/2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                name="max_price"
                value={filters.max_price}
                onChange={handleInputChange}
                placeholder="Max"
                className="w-1/2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Date Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <DatePicker
              selected={filters.start_date}
              onChange={date => handleDateChange('start_date', date)}
              minDate={new Date()}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select start date"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <DatePicker
              selected={filters.end_date}
              onChange={date => handleDateChange('end_date', date)}
              minDate={filters.start_date || new Date()}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select end date"
              disabled={!filters.start_date}
            />
          </div>
        </div>
        
        <div className="flex space-x-4 mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
          
          <button
            type="button"
            onClick={clearFilters}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default CarFilter;
