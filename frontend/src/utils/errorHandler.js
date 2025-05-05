

export const getErrorMessage = (error) => {
  
  if (error.response) {
    
    if (error.response.data) {
      
      if (error.response.data.message) {
        return error.response.data.message;
      }
      
      
      if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
        return error.response.data.errors.map(err => err.msg || err.message).join(', ');
      }
      
      
      if (typeof error.response.data === 'object') {
        return JSON.stringify(error.response.data);
      }
      
      return String(error.response.data);
    }
    
    
    return `Error ${error.response.status}: ${error.response.statusText}`;
  }
  
  
  if (error.request) {
    return 'No response received from server. Please check your internet connection.';
  }
  
  
  return error.message || 'An unknown error occurred';
};

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

export const handleApiError = (error, setError, setFieldErrors = null) => {
  
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }
  
  
  const message = getErrorMessage(error);
  setError(message);
  
  
  if (setFieldErrors && error.response?.data?.errors) {
    setFieldErrors(formatValidationErrors(error.response.data.errors));
  }
  
  
  return false;
};
