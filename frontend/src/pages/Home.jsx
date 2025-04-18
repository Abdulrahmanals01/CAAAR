import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-blue-50 min-h-[calc(100vh-144px)]">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-800">Welcome to Sayarati</h1>
        <p className="text-xl mb-8 text-gray-600 max-w-3xl mx-auto">
          The premier car-sharing platform in Saudi Arabia. Rent a car or share yours with others.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link 
            to="/cars" 
            className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-bold text-lg"
          >
            Find a Car
          </Link>
          <Link 
            to="/register" 
            className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-bold text-lg"
          >
            List Your Car
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-3">Browse Cars</h3>
            <p className="text-gray-600 mb-4">Find the perfect car for your needs from our wide selection.</p>
            <Link to="/cars" className="text-blue-600 hover:underline">Learn more →</Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-3">Easy Booking</h3>
            <p className="text-gray-600 mb-4">Book your car with just a few clicks and get on the road.</p>
            <Link to="/register" className="text-blue-600 hover:underline">Sign up now →</Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-3">Share Your Car</h3>
            <p className="text-gray-600 mb-4">Make money by sharing your car when you're not using it.</p>
            <Link to="/register" className="text-blue-600 hover:underline">Become a host →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
