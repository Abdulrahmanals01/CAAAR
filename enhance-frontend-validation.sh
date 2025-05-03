#!/bin/bash
# Implement frontend validation improvements

# Add form validation helper for frontend
cat > frontend/src/utils/validation.js << 'EOFJS'
/**
 * Form validation utility functions
 */

// Validate required fields
export const required = value => !!value || 'This field is required';

// Validate email format
export const isEmail = value => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return !value || regex.test(value) || 'Please enter a valid email address';
};

// Validate phone number format (Saudi format)
export const isPhone = value => {
  const regex = /^(05|5)[0-9]{8}$/;
  return !value || regex.test(value) || 'Please enter a valid Saudi phone number';
};

// Validate minimum length
export const minLength = (length) => value => {
  return !value || value.length >= length || `Must be at least ${length} characters`;
};

// Validate maximum length
export const maxLength = (length) => value => {
  return !value || value.length <= length || `Cannot exceed ${length} characters`;
};

// Validate number range
export const numberRange = (min, max) => value => {
  const num = Number(value);
  return !value || (num >= min && num <= max) || `Must be between ${min} and ${max}`;
};

// Validate date range
export const dateRange = (min, max) => value => {
  if (!value) return true;
  
  const date = new Date(value);
  const minDate = min ? new Date(min) : null;
  const maxDate = max ? new Date(max) : null;
  
  if (minDate && date < minDate) {
    return `Date must be after ${minDate.toLocaleDateString()}`;
  }
  
  if (maxDate && date > maxDate) {
    return `Date must be before ${maxDate.toLocaleDateString()}`;
  }
  
  return true;
};

// Validate end date is after start date
export const endDateAfterStartDate = (startDate) => value => {
  if (!value || !startDate) return true;
  
  const start = new Date(startDate);
  const end = new Date(value);
  
  return end >= start || 'End date must be after start date';
};

// Validate image file
export const isValidImage = file => {
  if (!file) return true;
  
  // Check file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return 'Image size must be less than 5MB';
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return 'Only JPEG, PNG, and GIF images are allowed';
  }
  
  return true;
};

// Run multiple validations
export const validateAll = (value, validations) => {
  for (const validation of validations) {
    const result = validation(value);
    if (result !== true) {
      return result;
    }
  }
  return true;
};
EOFJS

# Create a shared error handling helper
cat > frontend/src/utils/errorHandler.js << 'EOFJS'
/**
 * Centralized error handling for API responses
 */

// Parse error response to get most useful message
export const getErrorMessage = (error) => {
  // Handle axios error response
  if (error.response) {
    // The request was made and the server responded with an error status
    if (error.response.data) {
      // API returned a formatted error message
      if (error.response.data.message) {
        return error.response.data.message;
      }
      
      // API returned array of validation errors
      if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
        return error.response.data.errors.map(err => err.msg || err.message).join(', ');
      }
      
      // API returned some other object
      if (typeof error.response.data === 'object') {
        return JSON.stringify(error.response.data);
      }
      
      return String(error.response.data);
    }
    
    // Fall back to status text
    return `Error ${error.response.status}: ${error.response.statusText}`;
  }
  
  // The request was made but no response was received
  if (error.request) {
    return 'No response received from server. Please check your internet connection.';
  }
  
  // Something happened in setting up the request
  return error.message || 'An unknown error occurred';
};

// Format validation errors from the backend
export const formatValidationErrors = (errors) => {
  if (!errors || !Array.isArray(errors)) {
    return {};
  }
  
  const formattedErrors = {};
  
  errors.forEach(error => {
    if (error.param) {
      formattedErrors[error.param] = error.msg || 'Invalid value';
    }
  });
  
  return formattedErrors;
};

// Create a standardized error handler for components
export const handleApiError = (error, setError, setFieldErrors = null) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }
  
  // Set main error message
  const message = getErrorMessage(error);
  setError(message);
  
  // Handle field validation errors if handler provided
  if (setFieldErrors && error.response?.data?.errors) {
    setFieldErrors(formatValidationErrors(error.response.data.errors));
  }
  
  // Return false to indicate error was handled
  return false;
};
EOFJS

# Create a centralized API data format utility
cat > frontend/src/utils/dataFormatter.js << 'EOFJS'
/**
 * Data formatting utilities for consistent frontend-backend communication
 */

// Format a date to YYYY-MM-DD for API requests
export const formatDateForApi = (date) => {
  if (!date) return null;
  
  // If already a string in YYYY-MM-DD format, return as is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Convert to Date object if it's a string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Ensure it's a valid date
  if (!(dateObj instanceof Date) || isNaN(dateObj)) {
    return null;
  }
  
  // Format as YYYY-MM-DD
  return dateObj.toISOString().split('T')[0];
};

// Format a date for display
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Ensure it's a valid date
  if (isNaN(date)) {
    return dateString;
  }
  
  // Format based on locale
  return date.toLocaleDateString('en-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format a price in SAR
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '';
  
  return parseFloat(amount).toLocaleString('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2
  });
};

// Convert form data to match API expectations
export const prepareFormData = (data, fileFields = []) => {
  // For multipart/form-data (with files), create FormData object
  if (fileFields.length > 0 && fileFields.some(field => data[field])) {
    const formData = new FormData();
    
    // Add all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      // Handle date fields
      if (value instanceof Date) {
        formData.append(key, formatDateForApi(value));
      }
      // Handle arrays and objects (needs to be stringified for FormData)
      else if (typeof value === 'object' && value !== null && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      }
      // Handle normal fields
      else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    
    return formData;
  }
  
  // For regular JSON data, format dates
  const formattedData = { ...data };
  
  Object.entries(formattedData).forEach(([key, value]) => {
    // Format dates
    if (value instanceof Date) {
      formattedData[key] = formatDateForApi(value);
    }
  });
  
  return formattedData;
};
EOFJS

# Create improved input components with validation
mkdir -p frontend/src/components/common/inputs

# Create DateInput component
cat > frontend/src/components/common/inputs/DateInput.jsx << 'EOFJS'
import React from 'react';

const DateInput = ({ 
  id, 
  name, 
  value, 
  onChange, 
  label, 
  error,
  min,
  max,
  required = false,
  disabled = false,
  className = ''
}) => {
  const handleChange = (e) => {
    onChange(e);
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id || name} className="block text-gray-700 font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="date"
        id={id || name}
        name={name}
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-100' : ''}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default DateInput;
EOFJS

# Create TextInput component
cat > frontend/src/components/common/inputs/TextInput.jsx << 'EOFJS'
import React from 'react';

const TextInput = ({ 
  id, 
  name, 
  value, 
  onChange, 
  label, 
  error,
  placeholder = '',
  type = 'text',
  required = false,
  disabled = false,
  className = '',
  maxLength
}) => {
  const handleChange = (e) => {
    onChange(e);
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id || name} className="block text-gray-700 font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id || name}
        name={name}
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-100' : ''}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default TextInput;
EOFJS

# Create SelectInput component
cat > frontend/src/components/common/inputs/SelectInput.jsx << 'EOFJS'
import React from 'react';

const SelectInput = ({ 
  id, 
  name, 
  value, 
  onChange, 
  label, 
  error,
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = ''
}) => {
  const handleChange = (e) => {
    onChange(e);
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id || name} className="block text-gray-700 font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={id || name}
        name={name}
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-100' : ''}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default SelectInput;
EOFJS

# Create FileInput component
cat > frontend/src/components/common/inputs/FileInput.jsx << 'EOFJS'
import React, { useState } from 'react';

const FileInput = ({ 
  id, 
  name, 
  onChange, 
  label, 
  error,
  accept = 'image/*',
  required = false,
  disabled = false,
  className = '',
  previewUrl = null
}) => {
  const [preview, setPreview] = useState(previewUrl);

  const handleChange = (e) => {
    const file = e.target.files[0];
    
    // Create preview if it's an image
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    
    onChange(e);
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id || name} className="block text-gray-700 font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id={id || name}
          name={name}
          onChange={handleChange}
          accept={accept}
          required={required}
          disabled={disabled}
          className="hidden"
        />
        
        <label
          htmlFor={id || name}
          className="cursor-pointer block w-full"
        >
          {!preview ? (
            <>
              <div className="mx-auto w-12 h-12 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Click to upload a file
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {accept === 'image/*' ? 'JPG, PNG or GIF up to 5MB' : 'Accepted file types: ' + accept}
              </p>
            </>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded"
              />
              <p className="mt-2 text-sm text-gray-500">Click to change</p>
            </div>
          )}
        </label>
      </div>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FileInput;
EOFJS

# Create an index file to export all inputs
cat > frontend/src/components/common/inputs/index.js << 'EOFJS'
export { default as TextInput } from './TextInput';
export { default as DateInput } from './DateInput';
export { default as SelectInput } from './SelectInput';
export { default as FileInput } from './FileInput';
EOFJS

echo "✅ Frontend validation and data consistency improvements have been applied"
