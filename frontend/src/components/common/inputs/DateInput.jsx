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
