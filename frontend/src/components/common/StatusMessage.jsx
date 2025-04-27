import React from 'react';

const StatusMessage = ({ status, reason, until }) => {
  if (status === 'banned') {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Account Banned</h2>
          <p className="text-gray-700 mb-4">Your account has been banned from using Sayarati.</p>
          {reason && (
            <p className="text-gray-600 mb-4">
              <strong>Reason:</strong> {reason}
            </p>
          )}
          <p className="text-gray-600">Please contact support if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  if (status === 'frozen') {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Account Frozen</h2>
          <p className="text-gray-700 mb-4">Your account has been temporarily frozen.</p>
          {reason && (
            <p className="text-gray-600 mb-4">
              <strong>Reason:</strong> {reason}
            </p>
          )}
          {until && (
            <p className="text-gray-600 mb-4">
              <strong>Until:</strong> {new Date(until).toLocaleString()}
            </p>
          )}
          <p className="text-gray-600">Your account will be automatically unfrozen after this period.</p>
        </div>
      </div>
    );
  }

  return null;
};

export default StatusMessage;
