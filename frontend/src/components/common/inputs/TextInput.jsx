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
