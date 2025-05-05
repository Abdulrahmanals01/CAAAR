import axios from '../utils/axiosConfig';
import { getImageUrl } from '../utils/imageUtils';

export const getCars = async (filters = {}) => {
  try {
    
    const queryParams = new URLSearchParams();

    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !['features', 'colors'].includes(key)) {
        queryParams.append(key, value);
      }
    });

    
    if (filters.features && filters.features.length > 0) {
      queryParams.append('features', JSON.stringify(filters.features));
    }

    
    if (filters.colors && filters.colors.length > 0) {
      queryParams.append('colors', JSON.stringify(filters.colors));
    }

    const response = await axios.get(`/api/cars?${queryParams.toString()}`);
    console.log("Raw API response:", response.data);

    
    const carsWithFormattedImages = response.data.map(car => {
      
      let processedCar = { ...car };

      
      if (car.image && !car.image_url) {
        processedCar.image_url = getImageUrl(car.image, 'cars');
      }

      
      if (car.latitude !== undefined && car.latitude !== null) {
        processedCar.latitude = parseFloat(car.latitude);
      }

      if (car.longitude !== undefined && car.longitude !== null) {
        processedCar.longitude = parseFloat(car.longitude);
      }

      return processedCar;
    });

    
    console.log("Processed cars:", carsWithFormattedImages);
    console.log("Cars with coordinates:", carsWithFormattedImages.filter(car => car.latitude && car.longitude).length); 

    return { success: true, data: carsWithFormattedImages };
  } catch (error) {
    console.error("Error in getCars:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching cars'
    };
  }
};

export const getCarById = async (carId) => {
  try {
    const response = await axios.get(`/api/cars/${carId}`);

    
    const car = response.data;
    if (car.image && !car.image_url) {
      car.image_url = getImageUrl(car.image, 'cars');
    }

    
    if (car.latitude) car.latitude = parseFloat(car.latitude);
    if (car.longitude) car.longitude = parseFloat(car.longitude);

    return { success: true, data: car };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching car details'
    };
  }
};

export const createCar = async (carData) => {
  try {
    const response = await axios.post(`/api/cars`, carData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    
    const newCar = response.data;
    if (newCar.image && !newCar.image_url) {
      newCar.image_url = getImageUrl(newCar.image, 'cars');
    }

    return { success: true, data: newCar };
  } catch (error) {
    console.error('Car creation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Error creating car listing'
    };
  }
};

export const updateCar = async (carId, carData) => {
  try {
    const response = await axios.put(`/api/cars/${carId}`, carData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    
    const updatedCar = response.data;
    if (updatedCar.image && !updatedCar.image_url) {
      updatedCar.image_url = getImageUrl(updatedCar.image, 'cars');
    }

    return { success: true, data: updatedCar };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error updating car listing'
    };
  }
};

export const updateCarAvailability = async (carId, availabilityData) => {
  try {
    const response = await axios.patch(
      `/api/cars/${carId}/availability`,
      availabilityData
    );

    
    const updatedCar = response.data.car;
    if (updatedCar.image && !updatedCar.image_url) {
      updatedCar.image_url = getImageUrl(updatedCar.image, 'cars');
    }

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error updating car availability'
    };
  }
};

export const checkActiveBookings = async (carId) => {
  try {
    const response = await axios.get(`/api/cars/${carId}/active-bookings`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error checking active bookings'
    };
  }
};

export const deleteCar = async (carId) => {
  try {
    await axios.delete(`/api/cars/${carId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error deleting car listing'
    };
  }
};

export const getHostCars = async () => {
  try {
    const response = await axios.get(`/api/cars/owner`);

    
    const carsWithFormattedImages = response.data.map(car => {
      if (car.image && !car.image_url) {
        car.image_url = getImageUrl(car.image, 'cars');
      }

      
      if (car.latitude) car.latitude = parseFloat(car.latitude);
      if (car.longitude) car.longitude = parseFloat(car.longitude);

      return car;
    });

    return { success: true, data: carsWithFormattedImages };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching your car listings'
    };
  }
};
