

export const required = value => !!value || 'This field is required';

export const isEmail = value => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return !value || regex.test(value) || 'Please enter a valid email address';
};

export const isPhone = value => {
  const regex = /^(05|5)[0-9]{8}$/;
  return !value || regex.test(value) || 'Please enter a valid Saudi phone number';
};

export const minLength = (length) => value => {
  return !value || value.length >= length || `Must be at least ${length} characters`;
};

export const maxLength = (length) => value => {
  return !value || value.length <= length || `Cannot exceed ${length} characters`;
};

export const numberRange = (min, max) => value => {
  const num = Number(value);
  return !value || (num >= min && num <= max) || `Must be between ${min} and ${max}`;
};

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

export const endDateAfterStartDate = (startDate) => value => {
  if (!value || !startDate) return true;
  
  const start = new Date(startDate);
  const end = new Date(value);
  
  return end >= start || 'End date must be after start date';
};

export const isValidImage = file => {
  if (!file) return true;
  
  
  if (file.size > 5 * 1024 * 1024) {
    return 'Image size must be less than 5MB';
  }
  
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return 'Only JPEG, PNG, and GIF images are allowed';
  }
  
  return true;
};

export const validateAll = (value, validations) => {
  for (const validation of validations) {
    const result = validation(value);
    if (result !== true) {
      return result;
    }
  }
  return true;
};
