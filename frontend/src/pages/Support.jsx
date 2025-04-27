import React, { useState, useEffect } from 'react';
import { submitSupportInquiry, getUserInfo } from '../api/support';

const Support = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);

  const isAuthenticated = localStorage.getItem('token') !== null;

  useEffect(() => {
    // If user is authenticated, get their information
    if (isAuthenticated) {
      fetchUserInfo();
    }
  }, [isAuthenticated]);

  const fetchUserInfo = async () => {
    setLoadingUserInfo(true);
    try {
      const response = await getUserInfo();
      if (response.success) {
        setFormData(prevState => ({
          ...prevState,
          name: response.data.name || '',
          email: response.data.email || ''
        }));
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    } finally {
      setLoadingUserInfo(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setTicketId('');

    // Validate form
    if (!formData.name.trim() || !formData.email.trim() ||
        !formData.subject.trim() || !formData.message.trim()) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const result = await submitSupportInquiry(formData);

      if (result.success) {
        setSuccess(result.data.message || 'Your support request has been submitted successfully!');
        if (result.data.ticketId) {
          setTicketId(result.data.ticketId);
        }
        
        // Reset form fields except for name and email if the user is authenticated
        setFormData(prevState => ({
          name: isAuthenticated ? prevState.name : '',
          email: isAuthenticated ? prevState.email : '',
          subject: '',
          message: ''
        }));
      } else {
        setError(result.error || 'Failed to submit your request. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting support request:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Contact Support</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
          <p>{success}</p>
          {ticketId && (
            <p className="mt-2 font-medium">
              Your ticket ID: <span className="bg-green-50 px-2 py-1 rounded border border-green-200">{ticketId}</span>
              <br />
              <span className="text-sm">Please save this ID for future reference.</span>
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="mb-6 text-gray-600">
          Have questions or need assistance? Fill out the form below and our support team will get back to you as soon as possible.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
                required
                disabled={loadingUserInfo}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Your Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="johndoe@example.com"
                required
                disabled={loadingUserInfo}
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Booking Issue, Account Help, etc."
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="6"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please describe your issue or question in detail..."
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>      
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : 'Submit Support Request'}
          </button>
        </form>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Other Ways to Contact Us</h2>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="font-medium">Email</h3>
              <p className="text-gray-600">support@sayarati.com</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="font-medium">Support Hours</h3>
              <p className="text-gray-600">Sunday through Thursday, 9:00 AM to 6:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
