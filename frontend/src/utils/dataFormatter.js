

export const formatDateForApi = (date) => {
  if (!date) return null;
  
  
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  
  if (!(dateObj instanceof Date) || isNaN(dateObj)) {
    return null;
  }
  
  
  return dateObj.toISOString().split('T')[0];
};

export const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  
  if (isNaN(date)) {
    return dateString;
  }
  
  
  return date.toLocaleDateString('en-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '';
  
  return parseFloat(amount).toLocaleString('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2
  });
};

export const prepareFormData = (data, fileFields = []) => {
  
  if (fileFields.length > 0 && fileFields.some(field => data[field])) {
    const formData = new FormData();
    
    
    Object.entries(data).forEach(([key, value]) => {
      
      if (value instanceof Date) {
        formData.append(key, formatDateForApi(value));
      }
      
      else if (typeof value === 'object' && value !== null && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      }
      
      else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    
    return formData;
  }
  
  
  const formattedData = { ...data };
  
  Object.entries(formattedData).forEach(([key, value]) => {
    
    if (value instanceof Date) {
      formattedData[key] = formatDateForApi(value);
    }
  });
  
  return formattedData;
};
