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
