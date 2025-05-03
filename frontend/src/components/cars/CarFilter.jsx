import React, { useState, useEffect } from 'react';
import { CAR_TYPE_OPTIONS, COLOR_OPTIONS, FEATURE_OPTIONS, YEAR_OPTIONS } from '../../constants/filters';

const CarFilter = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    car_type: 'all',
    min_year: '',
    max_year: '',
    colors: [],
    features: []
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name.startsWith('color-')) {
        // Handle color checkbox
        const color = name.replace('color-', '');
        let updatedColors = [...filters.colors];
        
        if (checked) {
          if (!updatedColors.includes(color)) {
            updatedColors.push(color);
          }
        } else {
          updatedColors = updatedColors.filter(c => c !== color);
        }
        
        setFilters({
          ...filters,
          colors: updatedColors
        });
      } else {
        // Handle feature checkbox
        let updatedFeatures = [...filters.features];
        
        if (checked) {
          if (!updatedFeatures.includes(name)) {
            updatedFeatures.push(name);
          }
        } else {
          updatedFeatures = updatedFeatures.filter(feature => feature !== name);
        }
        
        setFilters({
          ...filters,
          features: updatedFeatures
        });
      }
    } else {
      // Handle other inputs (select, number, etc.)
      setFilters({
        ...filters,
        [name]: value
      });
    }
  };

  // Apply filters whenever they change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Filters</h3>

      {/* Price range */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Price range (SAR)</h4>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            name="min_price"
            value={filters.min_price}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            min="0"
            placeholder="Min"
          />
          <span>to</span>
          <input
            type="number"
            name="max_price"
            value={filters.max_price}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            min="0"
            placeholder="Max"
          />
        </div>
      </div>

      {/* Year range - NEW */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Year range</h4>
        <div className="flex items-center space-x-2">
          <select
            name="min_year"
            value={filters.min_year}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
          >
            <option value="">From</option>
            {YEAR_OPTIONS.map(year => (
              <option key={`min-${year.value}`} value={year.value}>{year.label}</option>
            ))}
          </select>
          <span>to</span>
          <select
            name="max_year"
            value={filters.max_year}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
          >
            <option value="">To</option>
            {YEAR_OPTIONS.map(year => (
              <option key={`max-${year.value}`} value={year.value}>{year.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Car type */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Car type</h4>
        <select
          name="car_type"
          value={filters.car_type}
          onChange={handleInputChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="all">All types</option>
          {CAR_TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Colors - NEW */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Colors</h4>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_OPTIONS.map(color => (
            <label key={color.value} className="flex items-center text-sm">
              <input
                type="checkbox"
                name={`color-${color.value}`}
                checked={filters.colors.includes(color.value)}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span>{color.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Features</h4>
        <div className="space-y-2">
          {FEATURE_OPTIONS.map(feature => (
            <label key={feature.value} className="flex items-center">
              <input
                type="checkbox"
                name={feature.value}
                checked={filters.features.includes(feature.value)}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span>{feature.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarFilter;
