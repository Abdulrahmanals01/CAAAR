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
