

export const CAR_TYPE_OPTIONS = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck' },
  { value: 'sports', label: 'Sports' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'compact', label: 'Compact' },
  { value: 'convertible', label: 'Convertible' },
];

export const FEATURE_OPTIONS = [
  { value: 'airConditioning', label: 'Air Conditioning' },
  { value: 'bluetooth', label: 'Bluetooth' },
  { value: 'gps', label: 'GPS/Navigation System' },
  { value: 'usbPort', label: 'USB Port' },
  { value: 'heatedSeats', label: 'Heated Seats' },
  { value: 'sunroof', label: 'Sunroof' },
  { value: 'petFriendly', label: 'Pet Friendly' },
  { value: 'childSeat', label: 'Child Seat' },
];

export const COLOR_OPTIONS = [
  { value: 'black', label: 'Black' },
  { value: 'white', label: 'White' },
  { value: 'silver', label: 'Silver' },
  { value: 'gray', label: 'Gray' },
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'brown', label: 'Brown' },
  { value: 'gold', label: 'Gold' },
  { value: 'beige', label: 'Beige' },
  { value: 'orange', label: 'Orange' },
  { value: 'purple', label: 'Purple' },
];

export const YEAR_OPTIONS = (() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear + 1; year >= 2000; year--) {
    years.push({ value: year, label: year.toString() });
  }
  return years;
})();

export const featureArrayToObject = (featureArray = []) => {
  const featureObject = {};
  FEATURE_OPTIONS.forEach(feature => {
    featureObject[feature.value] = featureArray.includes(feature.value);
  });
  return featureObject;
};

export const featureObjectToArray = (featureObject = {}) => {
  return Object.entries(featureObject)
    .filter(([_, isSelected]) => isSelected)
    .map(([featureName, _]) => featureName);
};
