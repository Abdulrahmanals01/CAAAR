import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/dataFormatter';

const InsuranceModal = ({ isOpen, onClose, onConfirm, carPrice, days }) => {
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [insuranceAmount, setInsuranceAmount] = useState(0);
  const [platformFeeAmount, setPlatformFeeAmount] = useState(0);

  const PLATFORM_FEE_PERCENTAGE = 5;
  const FULL_INSURANCE_PERCENTAGE = 35;
  const THIRD_PARTY_INSURANCE_PERCENTAGE = 15;

  useEffect(() => {
    if (carPrice && days) {
      // Base price calculation (car price * days)
      const base = carPrice * days;
      setBasePrice(base);
      
      let insurance = 0;
      if (selectedInsurance === 'full') {
        insurance = (base * FULL_INSURANCE_PERCENTAGE) / 100;
      } else if (selectedInsurance === 'third-party') {
        insurance = (base * THIRD_PARTY_INSURANCE_PERCENTAGE) / 100;
      }
      setInsuranceAmount(insurance);
      
      // Platform fee is always 5% of base price
      const platformFee = (base * PLATFORM_FEE_PERCENTAGE) / 100;
      setPlatformFeeAmount(platformFee);
      
      // Total is base price + insurance + platform fee
      setTotalPrice(base + insurance + platformFee);
    }
  }, [carPrice, days, selectedInsurance]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Select Insurance Option</h2>
        
        <p className="text-gray-600 mb-2">
          Please select an insurance option for your booking:
        </p>
        <p className="text-sm text-red-600 mb-6">
          * Insurance selection is mandatory to proceed with booking
        </p>
        
        <div className="space-y-4 mb-6">
          <div 
            className={`border rounded-lg p-4 cursor-pointer hover:border-blue-500 ${selectedInsurance === 'full' ? 'border-blue-500 bg-blue-50' : ''}`}
            onClick={() => setSelectedInsurance('full')}
          >
            <div className="flex items-start">
              <div className={`mt-1 w-4 h-4 rounded-full border ${selectedInsurance === 'full' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                {selectedInsurance === 'full' && (
                  <span className="block w-2 h-2 mx-auto mt-px rounded-full bg-white"></span>
                )}
              </div>
              <div className="ml-3">
                <h3 className="text-md font-medium">Full Coverage Insurance</h3>
                <p className="text-sm text-gray-500">Full coverage for all damages and liabilities</p>
                <div className="mt-1 text-sm text-blue-600">
                  Adds {FULL_INSURANCE_PERCENTAGE}% insurance fee + {PLATFORM_FEE_PERCENTAGE}% Sayarati platform fee
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className={`border rounded-lg p-4 cursor-pointer hover:border-blue-500 ${selectedInsurance === 'third-party' ? 'border-blue-500 bg-blue-50' : ''}`}
            onClick={() => setSelectedInsurance('third-party')}
          >
            <div className="flex items-start">
              <div className={`mt-1 w-4 h-4 rounded-full border ${selectedInsurance === 'third-party' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                {selectedInsurance === 'third-party' && (
                  <span className="block w-2 h-2 mx-auto mt-px rounded-full bg-white"></span>
                )}
              </div>
              <div className="ml-3">
                <h3 className="text-md font-medium">Third Party Insurance</h3>
                <p className="text-sm text-gray-500">Covers damages to other vehicles and property</p>
                <div className="mt-1 text-sm text-blue-600">
                  Adds {THIRD_PARTY_INSURANCE_PERCENTAGE}% insurance fee + {PLATFORM_FEE_PERCENTAGE}% Sayarati platform fee
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">Price Details</h3>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Base Price:</span>
            <span>{formatCurrency(basePrice)} SAR</span>
          </div>
          {selectedInsurance && (
            <>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Insurance Fee:</span>
                <span>{formatCurrency(insuranceAmount)} SAR</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Platform Fee:</span>
                <span>{formatCurrency(platformFeeAmount)} SAR</span>
              </div>
            </>
          )}
          <div className="border-t border-gray-300 my-2"></div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total Price:</span>
            <span>{formatCurrency(totalPrice)} SAR</span>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({
              insuranceType: selectedInsurance,
              insuranceAmount,
              platformFeeAmount,
              totalPrice
            })}
            disabled={!selectedInsurance}
            className={`px-4 py-2 border border-transparent rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${!selectedInsurance ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsuranceModal;