import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-2xl mb-8">Oops! Page not found.</p>
      <p className="mb-8">The page you are looking for might have been removed or is temporarily unavailable.</p>
      <Link to="/" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium">
        Go back to Homepage
      </Link>
    </div>
  );
};

export default NotFound;
