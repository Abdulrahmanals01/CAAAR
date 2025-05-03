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
