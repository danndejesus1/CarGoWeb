import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Mail, Car, Eye, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { account, databases } from '../../appwrite/config';

const BookingManager = ({ user, onUpdateBookings }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [vehicleAvailability, setVehicleAvailability] = useState({});

  // Load user bookings
  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      // Load from user preferences (quick access)
      const userData = await account.get();
      const userBookings = userData.prefs?.bookings || [];
      
      // Sort by creation date (newest first)
      const sortedBookings = userBookings.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setBookings(sortedBookings);
      
      // Load availability status for each vehicle
      await loadVehicleAvailability(sortedBookings);
      
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleAvailability = async (bookings) => {
    try {
      const availability = {};
      
      // Get unique vehicle IDs from bookings
      const vehicleIds = [...new Set(bookings.map(booking => booking.vehicleId))];
      
      // Fetch availability for each vehicle
      for (const vehicleId of vehicleIds) {
        if (vehicleId) {
          try {
            const vehicle = await databases.getDocument(
              process.env.REACT_APP_DATABASE_ID,
              process.env.REACT_APP_VEHICLES_COLLECTION_ID,
              vehicleId
            );
            availability[vehicleId] = vehicle.available;
          } catch (error) {
            console.error(`Error loading availability for vehicle ${vehicleId}:`, error);
            availability[vehicleId] = false;
          }
        }
      }
      
      setVehicleAvailability(availability);
    } catch (error) {
      console.error('Error loading vehicle availability:', error);
    }
  };

  const getAvailabilityStatus = (vehicleId, bookingStatus) => {
    if (bookingStatus === 'cancelled' || bookingStatus === 'completed') {
      return null; // Don't show availability for past bookings
    }
    
    const isAvailable = vehicleAvailability[vehicleId];
    
    if (isAvailable === undefined) {
      return { text: 'Checking...', color: 'bg-gray-100 text-gray-600' };
    }
    
    return isAvailable 
      ? { text: 'Available', color: 'bg-green-100 text-green-800' }
      : { text: 'Unavailable', color: 'bg-red-100 text-red-800' };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} />;
      case 'pending':
        return <AlertCircle size={16} />;
      case 'cancelled':
        return <XCircle size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      // Update booking status in user preferences
      const userData = await account.get();
      const userBookings = userData.prefs?.bookings || [];
      const updatedBookings = userBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled', updatedAt: new Date().toISOString() }
          : booking
      );

      await account.updatePrefs({
        ...userData.prefs,
        bookings: updatedBookings
      });

      // Update local state
      setBookings(updatedBookings);
      
      // Reload availability after cancellation
      await loadVehicleAvailability(updatedBookings);

      // Notify parent component
      if (onUpdateBookings) {
        onUpdateBookings(updatedBookings);
      }

    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('Failed to cancel booking');
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };
  const formatDate = (dateString) => {
    // Handle both DateTime and date string formats
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">My Bookings</h3>
        <button 
          onClick={loadBookings}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Car size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg mb-2">No bookings yet</p>
          <p className="text-gray-500 text-sm">Start by booking a vehicle from our fleet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    {booking.vehicleName}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-2" />
                      <span>Pickup: {formatDateTime(booking.pickupDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-2" />
                      <span>Return: {formatDateTime(booking.returnDate)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full border flex items-center space-x-1 ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    <span className="capitalize">{booking.status}</span>
                  </span>
                  
                  {getAvailabilityStatus(booking.vehicleId, booking.status) && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAvailabilityStatus(booking.vehicleId, booking.status).color}`}>
                      {getAvailabilityStatus(booking.vehicleId, booking.status).text}
                    </span>
                  )}
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewDetails(booking)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    
                    {booking.status === 'pending' && (
                      <button 
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Cancel Booking"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  Booked on {formatDate(booking.createdAt)}
                </span>
                <span className="text-lg font-bold text-green-600">
                  ₱{booking.totalCost?.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Booking Details</h3>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Booking Status */}
                <div className="flex items-center space-x-3">
                  <span className={`px-4 py-2 rounded-full border flex items-center space-x-2 ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusIcon(selectedBooking.status)}
                    <span className="capitalize font-medium">{selectedBooking.status}</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    Booking ID: {selectedBooking.id}
                  </span>
                </div>

                {/* Vehicle Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Car size={20} className="mr-2" />
                    Vehicle Information
                  </h4>
                  <p className="text-lg font-medium">{selectedBooking.vehicleName}</p>
                </div>                {/* Booking Dates & Times */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                      <Calendar size={16} className="mr-2" />
                      Pickup
                    </h5>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(selectedBooking.pickupDate)}
                    </p>
                    {selectedBooking.pickupLocation && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <MapPin size={12} className="mr-1" />
                        {selectedBooking.pickupLocation}
                      </p>
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                      <Calendar size={16} className="mr-2" />
                      Return
                    </h5>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(selectedBooking.returnDate)}
                    </p>
                    {selectedBooking.returnLocation && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <MapPin size={12} className="mr-1" />
                        {selectedBooking.returnLocation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Cost Summary</h4>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Cost:</span>
                    <span className="text-green-600">₱{selectedBooking.totalCost?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-300"
                  >
                    Close
                  </button>
                  
                  {selectedBooking.status === 'pending' && (
                    <button 
                      onClick={() => {
                        handleCancelBooking(selectedBooking.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-300"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManager;