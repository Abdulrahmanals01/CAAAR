import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'renter',
    phone: '',
    id_number: '',
    gender: 'male',
    date_of_birth: '',
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [licenseImage, setLicenseImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUnderage, setIsUnderage] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const navigate = useNavigate();

  // Check age whenever date of birth changes
  useEffect(() => {
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      
      // Calculate age
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Set underage flag
      setIsUnderage(age < 18);
    }
  }, [formData.date_of_birth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields({
      ...touchedFields,
      [name]: true
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLicenseImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
    
    setTouchedFields({
      ...touchedFields,
      licenseImage: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);
    
    // Mark all fields as touched
    const allFields = {
      name: true,
      email: true,
      phone: true,
      id_number: true,
      password: true,
      gender: true,
      date_of_birth: true,
      licenseImage: true,
      role: true
    };
    setTouchedFields(allFields);

    // Validate driver's license image is provided
    if (!licenseImage) {
      return; // Let the field-level validation handle this
    }

    // Validate age is 18 or older
    if (isUnderage) {
      return; // Let the field-level validation handle this
    }

    try {
      // Create FormData object for multipart/form-data (file upload)
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('email', formData.email);
      formDataObj.append('password', formData.password);
      formDataObj.append('role', formData.role);
      formDataObj.append('phone', formData.phone);
      formDataObj.append('id_number', formData.id_number);
      formDataObj.append('gender', formData.gender);
      formDataObj.append('date_of_birth', formData.date_of_birth);

      // Append the license image file
      formDataObj.append('licenseImage', licenseImage);

      // Send registration request
      const response = await axios({
        method: 'post',
        url: 'http://localhost:5000/api/auth/register',
        data: formDataObj,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Registration successful:', response.data);
      localStorage.setItem('token', response.data.token);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);

      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }

      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register for Sayarati</h2>

      {error && <div className="bg-red-100 p-3 mb-4 text-red-700 rounded">{error}</div>}

      {validationErrors.length > 0 && (
        <div className="bg-yellow-100 p-3 mb-4 text-yellow-800 rounded">
          <p className="font-bold">Please fix the following issues:</p>
          <ul className="list-disc ml-5">
            {validationErrors.map((err, index) => (
              <li key={index}>{err.param}: {err.msg}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full p-2 border rounded"
            required
          />
          {touchedFields.name && !formData.name && (
            <div className="mt-1 text-red-500 flex items-center">
              <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2">!</span>
              Please fill out this field.
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full p-2 border rounded"
            required
          />
          {touchedFields.email && !formData.email && (
            <div className="mt-1 text-red-500 flex items-center">
              <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2">!</span>
              Please fill out this field.
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full p-2 border rounded"
            required
          />
          {touchedFields.phone && !formData.phone && (
            <div className="mt-1 text-red-500 flex items-center">
              <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2">!</span>
              Please fill out this field.
            </div>
          )}
        </div>

        {/* Gender */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full p-2 border rounded"
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* Date of Birth with age validation */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Date of Birth (Must be 18+) <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-2 border rounded ${isUnderage ? 'border-red-500' : ''}`}
            required
          />
          {touchedFields.date_of_birth && !formData.date_of_birth && (
            <div className="mt-1 text-red-500 flex items-center">
              <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2">!</span>
              Please fill out this field.
            </div>
          )}
          {touchedFields.date_of_birth && formData.date_of_birth && isUnderage && (
            <div className="mt-1 text-red-500 flex items-center">
              <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2">!</span>
              You must be at least 18 years old to register.
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            ID Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="id_number"
            value={formData.id_number}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full p-2 border rounded"
            required
          />
          {touchedFields.id_number && !formData.id_number && (
            <div className="mt-1 text-red-500 flex items-center">
              <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2">!</span>
              Please fill out this field.
            </div>
          )}
        </div>

        {/* Driver's License Image Upload */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Driver's License Image <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            onBlur={handleBlur}
            className="w-full p-2 border rounded"
            required
          />
          {touchedFields.licenseImage && !licenseImage && (
            <div className="mt-1 text-red-500 flex items-center">
              <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2">!</span>
              Please choose a file.
            </div>
          )}
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Preview:</p>
              <img
                src={imagePreview}
                alt="License Preview"
                className="w-full max-h-40 object-contain border rounded mt-1"
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full p-2 border rounded"
            required
          >
            <option value="renter">Renter</option>
            <option value="host">Host</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full p-2 border rounded"
            required
            minLength="6"
          />
          {touchedFields.password && !formData.password && (
            <div className="mt-1 text-red-500 flex items-center">
              <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2">!</span>
              Please fill out this field.
            </div>
          )}
          {touchedFields.password && formData.password && formData.password.length < 6 && (
            <div className="mt-1 text-red-500 flex items-center">
              <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2">!</span>
              Password must be at least 6 characters long.
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Register
        </button>
      </form>

      <div className="mt-4 text-center">
        Already have an account? <Link to="/login" className="text-blue-500">Login</Link>
      </div>
    </div>
  );
};

export default Register;
