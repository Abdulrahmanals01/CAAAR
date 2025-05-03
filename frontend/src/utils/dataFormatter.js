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
