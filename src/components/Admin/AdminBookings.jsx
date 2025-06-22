import React, { useEffect, useState } from 'react';
import { databases, storage } from '../../appwrite/config';
import { Query } from 'appwrite';
import { Eye, Car, CheckCircle } from 'lucide-react';

// Helper for formatting date/time
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// VehicleImage component copied and adapted from AdminDashboard
const getDirectFileUrl = (fileId) => {
  if (!fileId) return null;
  return `https://fra.cloud.appwrite.io/v1/storage/buckets/cargo-files/files/${fileId}/view?project=685682ba00095008cb7d`;
};

const VehicleImage = ({ vehicle }) => {
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  const getImageSrc = () => {
    if (vehicle.imageFileId) {
      return getDirectFileUrl(vehicle.imageFileId);
    }
    if (vehicle.imageUrl) {
      return vehicle.imageUrl;
    }
    return null;
  };

  const imageSrc = getImageSrc();

  if (showPlaceholder || !imageSrc) {
    return (
      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
        <Car className="h-6 w-6 text-gray-400" />
        <span className="ml-1 text-xs text-gray-500">
          {vehicle.imageFileId ? 'Image Failed' : 'No Image'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={`${vehicle.vehicleMake || ''} ${vehicle.vehicleModel || ''}`}
      className="w-16 h-16 object-cover rounded border"
      onError={e => {
        setShowPlaceholder(true);
      }}
    />
  );
};

// PaymentImage component: Appwrite fileId > placeholder
const PaymentImage = ({ paymentFieldId }) => {
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  if (!paymentFieldId) {
    return (
      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
        <Car className="h-5 w-5 text-gray-400" />
        <span className="ml-1 text-xs text-gray-500">No Image</span>
      </div>
    );
  }

  const imageSrc = `https://fra.cloud.appwrite.io/v1/storage/buckets/cargo-files/files/${paymentFieldId}/view?project=685682ba00095008cb7d`;
  const linkUrl = imageSrc;

  if (showPlaceholder) {
    return (
      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
        <Car className="h-5 w-5 text-gray-400" />
        <span className="ml-1 text-xs text-gray-500">No Image</span>
      </div>
    );
  }

  return (
    <a href={linkUrl} target="_blank" rel="noopener noreferrer">
      <img
        src={imageSrc}
        alt="Payment"
        className="h-12 w-12 object-cover rounded border hover:shadow-lg transition"
        style={{ background: '#f3f4f6' }}
        onError={() => setShowPlaceholder(true)}
      />
    </a>
  );
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadBookings = async () => {
    setLoadingBookings(true);
    setError('');
    try {
      const response = await databases.listDocuments(
        'cargo-car-rental',
        'bookings',
        [Query.orderDesc('createdAt')]
      );
      setBookings(response.documents);
    } catch (error) {
      setError('Failed to load bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Confirm booking handler
  const handleConfirmBooking = async (bookingId) => {
    setUpdatingId(bookingId);
    setError('');
    try {
      await databases.updateDocument(
        'cargo-car-rental',
        'bookings',
        bookingId,
        { status: 'confirmed', updatedAt: new Date().toISOString() }
      );
      // Refresh bookings
      await loadBookings();
    } catch (err) {
      setError('Failed to confirm booking: ' + (err.message || err));
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">All Bookings</h3>
        <button
          onClick={loadBookings}
          className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      {loadingBookings ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading bookings...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b text-left">Booking ID</th>
                <th className="px-4 py-2 border-b text-left">User</th>
                <th className="px-4 py-2 border-b text-left">Vehicle</th>
                <th className="px-4 py-2 border-b text-left">Pickup</th>
                <th className="px-4 py-2 border-b text-left">Return</th>
                <th className="px-4 py-2 border-b text-left">Status</th>
                <th className="px-4 py-2 border-b text-left">Total Cost</th>
                <th className="px-4 py-2 border-b text-left">Created</th>
                <th className="px-4 py-2 border-b text-left">Payment Image</th>
                <th className="px-4 py-2 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const paymentFieldId = booking.paymentFieldId;
                  return (
                    <tr key={booking.$id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b">{booking.$id}</td>
                      <td className="px-4 py-2 border-b">
                        <div className="font-medium">{booking.userName || booking.userId}</div>
                        <div className="text-xs text-gray-500">{booking.userEmail}</div>
                      </td>
                      <td className="px-4 py-2 border-b">
                        <div>{booking.vehicleMake} {booking.vehicleModel}</div>
                        <div className="text-xs text-gray-500">{booking.vehicleType}</div>
                      </td>
                      <td className="px-4 py-2 border-b">{formatDateTime(booking.pickupDate)}</td>
                      <td className="px-4 py-2 border-b">{formatDateTime(booking.returnDate)}</td>
                      <td className="px-4 py-2 border-b capitalize">{booking.status}</td>
                      <td className="px-4 py-2 border-b text-green-700 font-semibold">
                        ₱{booking.totalCost?.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 border-b">{formatDateTime(booking.createdAt)}</td>
                      <td className="px-4 py-2 border-b">
                        <PaymentImage paymentFieldId={paymentFieldId} />
                      </td>
                      <td className="px-4 py-2 border-b">
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleConfirmBooking(booking.$id)}
                            disabled={updatingId === booking.$id}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center space-x-1 disabled:opacity-50"
                          >
                            {updatingId === booking.$id ? (
                              <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></span>
                            ) : (
                              <CheckCircle size={16} className="mr-1" />
                            )}
                            <span>Confirm Booking</span>
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <span className="text-green-700 font-semibold flex items-center">
                            <CheckCircle size={16} className="mr-1" /> Confirmed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
