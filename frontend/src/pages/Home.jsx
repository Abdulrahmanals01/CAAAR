import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import SearchBar from '../components/SearchBar';
import Footer from '../components/common/Footer';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeAccordion, setActiveAccordion] = useState(null);

  
  const destinations = [
    { name: 'Riyadh', icon: '��️' },
    { name: 'Jeddah', icon: '🌊' },
    { name: 'Dammam', icon: '🏝️' },
    { name: 'Mecca', icon: '🕋' },
    { name: 'Medina', icon: '🕌' },
    { name: 'Al Khobar', icon: '🌇' }
  ];

  
  const faqItems = [
    {
      question: 'How do I rent a car on Sayarati?',
      answer: 'To rent a car, simply search for available cars at your desired location and dates. Once you find a car you like, you can book it instantly with your verified account. You\'ll pick up the car from the owner and be on your way!'
    },
    {
      question: 'What are the requirements to rent a car?',
      answer: 'To rent a car, you must be at least 18 years old with a valid driver\'s license. You\'ll need to complete your profile and provide payment information before booking.'
    },
    {
      question: 'How is insurance handled?',
      answer: 'All rentals on Sayarati come with comprehensive insurance coverage. This protects both hosts and renters during the rental period.'
    },
    {
      question: 'Can I share my own car on Sayarati?',
      answer: 'Yes! You can list your car on Sayarati and earn money when others rent it. Simply create an account, switch to host mode, and add your car details.'
    },
    {
      question: 'What happens if I need to cancel my booking?',
      answer: 'Cancellation policies vary by host. You can find the specific policy for each car on its listing page before you book.'
    }
  ];

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    setLoading(false);
  }, []);

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {}
        <div
          className="relative bg-cover bg-center h-96 flex items-center justify-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2000&auto=format&fit=crop')",
            backgroundPosition: 'center 60%'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="relative text-center text-white z-10 px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Skip the rental counter</h1>
            <p className="text-xl md:text-2xl mb-8">
              Rent the car you need for your next adventure in Saudi Arabia
            </p>
          </div>
        </div>

        {}
        <SearchBar />

        <div className="container mx-auto px-4 py-12">
          {}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Welcome to Sayarati</h2>
            <p className="text-xl text-gray-600 mb-6">
              The premier car sharing platform in Saudi Arabia
            </p>

            {isLoggedIn && (
              <div className="bg-green-100 p-4 max-w-md mx-auto rounded">
                <p className="text-green-800">
                  You are logged in! You can now browse and book cars or manage your listings.
                </p>
              </div>
            )}
          </div>

          {}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8 text-center">How Sayarati Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">      
                  <span className="text-blue-600 text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Search for a Car</h3>
                <p className="text-gray-600">Find the perfect car for your needs and schedule in our diverse selection.</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">      
                  <span className="text-blue-600 text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Book Your Trip</h3>
                <p className="text-gray-600">Book instantly with your verified account. No waiting for approval.</p>    
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">      
                  <span className="text-blue-600 text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Hit the Road</h3>
                <p className="text-gray-600">Pick up the car and enjoy your journey with full insurance coverage.</p>   
              </div>
            </div>
          </div>

          {}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Browse by destination</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {destinations.map((destination, index) => (
                <Link
                  key={index}
                  to={`/cars?location=${destination.name}`}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 text-center"
                >
                  <div className="text-4xl mb-2">{destination.icon}</div>
                  <div className="font-medium">{destination.name}</div>
                </Link>
              ))}
            </div>
          </div>

          {}
          {!isLoggedIn && (
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 p-8 rounded-lg flex flex-col items-center text-center">
                <div className="text-4xl mb-4">🚗</div>
                <h3 className="text-2xl font-bold mb-2">Book a car</h3>
                <p className="mb-6">Down the street or across the country, find the perfect vehicle for your next adventure.</p>
                <Link
                  to="/cars"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Browse cars
                </Link>
              </div>
              <div className="bg-purple-50 p-8 rounded-lg flex flex-col items-center text-center">
                <div className="text-4xl mb-4">🔑</div>
                <h3 className="text-2xl font-bold mb-2">Become a host</h3>
                <p className="mb-6">Accelerate your entrepreneurship and start building a small car sharing business on Sayarati.</p>
                <Link
                  to="/register"
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
                >
                  Get started
                </Link>
              </div>
            </div>
          )}

          {}
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    className="flex items-center justify-between w-full p-4 text-left bg-white hover:bg-gray-50"        
                    onClick={() => toggleAccordion(index)}
                  >
                    <span className="font-medium">{item.question}</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${activeAccordion === index ? 'transform rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {activeAccordion === index && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <p className="text-gray-700">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
