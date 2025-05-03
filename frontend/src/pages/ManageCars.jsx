import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { Link } from 'react-router-dom';
import { getHostCars, deleteCar, checkActiveBookings } from '../api/cars';
import EditAvailabilityModal from '../components/cars/EditAvailabilityModal';

const ManageCars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedCar, setSelectedCar] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const response = await getHostCars();

        if (response.success) {
          setCars(response.data);
        } else {
          setError(response.error || 'Failed to load your cars. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Failed to load your cars. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [refreshTrigger]);

  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this car listing? This action cannot be undone.')) {
      return;
    }

    setActionInProgress(true);
    setStatusMessage('');

    // First check if car has active bookings
    try {
      const activeBookingsCheck = await checkActiveBookings(carId);

      if (!activeBookingsCheck.success) {
        setStatusMessage(activeBookingsCheck.error || 'Error checking active bookings.');
        setActionInProgress(false);
        return;
      }

      if (activeBookingsCheck.data.hasActiveBookings) {
        setStatusMessage('Cannot delete car with active bookings. You must wait until all current bookings are completed.'); 
        setActionInProgress(false);
        return;
      }

      // Proceed with deletion if no active bookings
      const response = await deleteCar(carId);

      if (response.success) {
        setStatusMessage('Car deleted successfully!');
        // Remove the car from state
        setCars(cars.filter(car => car.id !== carId));
      } else {
        setStatusMessage(response.error || 'Failed to delete car. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting car:', err);
      setStatusMessage('An unexpected error occurred. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleEditAvailability = (car) => {
    setSelectedCar(car);
    setIsEditModalOpen(true);
  };

  const formatDateString = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleAvailabilityUpdated = (updatedCar) => {
    // Update the car in the state
    setCars(cars.map(car =>
      car.id === updatedCar.id ? { ...car, ...updatedCar } : car
    ));
    setStatusMessage('Availability updated successfully!');

    // Close the modal
    setIsEditModalOpen(false);
    setSelectedCar(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Your Cars</h1>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {statusMessage && (
        <div className={`p-4 mb-6 rounded-md ${statusMessage.includes('success') ? 'bg-green-100 text-green-700 border-l-4 border-green-500' : 'bg-yellow-100 text-yellow-700 border-l-4 border-yellow-500'}`}>
          <p>{statusMessage}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : cars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map(car => (
            <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {car.image_url ? (
                <img
                  src={car.image_url}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{car.brand} {car.model}</h2>
                <p className="text-gray-600 mb-2">{car.year} • {car.color}</p>
                <p className="text-lg font-bold text-blue-600 mb-3">{car.price_per_day} SAR/day</p>

                <div className="mb-3 text-sm text-gray-600">
                  <div><strong>Available:</strong> {formatDateString(car.availability_start)} - {formatDateString(car.availability_end)}</div>
                  <div><strong>Location:</strong> {car.location}</div>
                </div>

                <div className="flex flex-wrap justify-between gap-2">
                  <Link to={`/cars/${car.id}`} className="text-blue-500 hover:underline">
                    View Details
                  </Link>

                  <button
                    onClick={() => handleEditAvailability(car)}
                    className="text-green-600 hover:underline"
                    disabled={actionInProgress}
                  >
                    Edit Availability
                  </button>

                  <button
                    onClick={() => handleDeleteCar(car.id)}
                    className="text-red-500 hover:underline"
                    disabled={actionInProgress}
                  >
                    {actionInProgress ? 'Processing...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-3">You don't have any cars listed yet</h2>
          <p className="mb-4">Start earning by adding your first car listing!</p>
          <Link to="/list-car" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-block">       
            List a Car Now
          </Link>
        </div>
      )}

      {/* Edit Availability Modal */}
      {selectedCar && (
        <EditAvailabilityModal
          car={selectedCar}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleAvailabilityUpdated}
        />
      )}
    </div>
  );
};

export default ManageCars;
