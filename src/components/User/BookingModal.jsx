import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Phone, Mail, Car, X, Check, AlertTriangle } from 'lucide-react';
import { account, databases } from '../../appwrite/config';
import { ID, Permission, Role, Query } from 'appwrite';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Initialize dayjs plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const BookingModal = ({ 
  isOpen, 
  onClose, 
  selectedVehicle, 
  user,
  onBookingComplete 
}) => {
  const [bookingData, setBookingData] = useState({
    pickupDate: '',
    returnDate: '',
    pickupTime: '09:00',
    returnTime: '18:00',
    pickupLocation: '',
    returnLocation: '',
    driverRequired: false,
    specialRequests: '',
    emergencyContact: '',
    emergencyPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [numberOfDays, setNumberOfDays] = useState(0);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [conflictingBookings, setConflictingBookings] = useState([]);
  const [disabledDates, setDisabledDates] = useState([]);
  const [loadingDisabledDates, setLoadingDisabledDates] = useState(false);

  // Load disabled dates when component mounts or vehicle changes
  useEffect(() => {
    if (selectedVehicle && isOpen) {
      loadDisabledDates();
    }
  }, [selectedVehicle, isOpen]);

  // Calculate total cost when dates change
  useEffect(() => {
    if (bookingData.pickupDate && bookingData.returnDate) {
      const pickup = new Date(bookingData.pickupDate);
      const returnDate = new Date(bookingData.returnDate);
      const diffTime = Math.abs(returnDate - pickup);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        setNumberOfDays(diffDays);
        const baseCost = diffDays * selectedVehicle?.pricePerDay || 0;
        const driverCost = bookingData.driverRequired ? diffDays * 1000 : 0; // ₱1000/day for driver
        setTotalCost(baseCost + driverCost);
      }
    }
  }, [bookingData.pickupDate, bookingData.returnDate, bookingData.driverRequired, selectedVehicle]);

  // Check availability when dates change
  useEffect(() => {
    if (bookingData.pickupDate && bookingData.returnDate && selectedVehicle) {
      checkVehicleAvailability();
    }
  }, [bookingData.pickupDate, bookingData.returnDate, selectedVehicle]);

  const loadDisabledDates = async () => {
    if (!selectedVehicle) return;

    setLoadingDisabledDates(true);
    try {
      // Get all existing bookings for this vehicle
      const existingBookings = await databases.listDocuments(
        'cargo-car-rental',
        'bookings',
        [
          Query.equal('vehicleId', selectedVehicle.id),
          Query.notEqual('status', 'cancelled') // Exclude cancelled bookings
        ]
      );

      console.log('Existing bookings for vehicle:', selectedVehicle.id, existingBookings.documents);

      // Generate array of disabled date strings
      const disabled = [];
      existingBookings.documents.forEach(booking => {
        console.log('Processing booking:', booking);
        console.log('Raw pickup date:', booking.pickupDate);
        console.log('Raw return date:', booking.returnDate);
        
        // Parse DateTime strings from Appwrite (format: MM/DD/YYYY HH:mm:ss.SSS AM/PM)
        // Convert to a format dayjs can understand
        const startDate = dayjs(new Date(booking.pickupDate)).startOf('day');
        const endDate = dayjs(new Date(booking.returnDate)).startOf('day');
        
        console.log('Parsed booking dates:', {
          pickup: startDate.format('YYYY-MM-DD'),
          return: endDate.format('YYYY-MM-DD'),
          pickupValid: startDate.isValid(),
          returnValid: endDate.isValid()
        });
        
        // Only proceed if dates are valid
        if (startDate.isValid() && endDate.isValid()) {
          // Add all dates from pickup to return (inclusive)
          let currentDate = startDate;
          while (currentDate.isSameOrBefore(endDate, 'day')) {
            const dateString = currentDate.format('YYYY-MM-DD');
            disabled.push(dateString);
            console.log('Disabling date:', dateString);
            currentDate = currentDate.add(1, 'day');
          }
        } else {
          console.warn('Invalid dates in booking:', booking);
        }
      });

      const uniqueDisabled = [...new Set(disabled)];
      console.log('Final disabled dates array:', uniqueDisabled);
      setDisabledDates(uniqueDisabled);
    } catch (error) {
      console.error('Error loading disabled dates:', error);
    } finally {
      setLoadingDisabledDates(false);
    }
  };

  const isDateDisabled = (date) => {
    const dateString = dayjs(date).format('YYYY-MM-DD');
    return disabledDates.includes(dateString);
  };

  const handleDateChange = (name, value) => {
    setBookingData(prev => ({
      ...prev,
      [name]: value ? dayjs(value).format('YYYY-MM-DD') : ''
    }));
    
    // Clear error when valid date is selected
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setBookingData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const checkVehicleAvailability = async () => {
    if (!bookingData.pickupDate || !bookingData.returnDate || !selectedVehicle) {
      return;
    }

    setCheckingAvailability(true);
    setAvailabilityStatus(null);
    setConflictingBookings([]);

    try {
      const requestedPickup = new Date(`${bookingData.pickupDate}T${bookingData.pickupTime}`);
      const requestedReturn = new Date(`${bookingData.returnDate}T${bookingData.returnTime}`);

      // Query existing bookings for this vehicle
      const existingBookings = await databases.listDocuments(
        'cargo-car-rental',
        'bookings',
        [
          Query.equal('vehicleId', selectedVehicle.id),
          Query.notEqual('status', 'cancelled') // Exclude cancelled bookings
        ]
      );

      // Check for date conflicts
      const conflicts = existingBookings.documents.filter(booking => {
        const existingPickup = new Date(booking.pickupDate);
        const existingReturn = new Date(booking.returnDate);

        // Check if dates overlap
        return (
          (requestedPickup >= existingPickup && requestedPickup < existingReturn) ||
          (requestedReturn > existingPickup && requestedReturn <= existingReturn) ||
          (requestedPickup <= existingPickup && requestedReturn >= existingReturn)
        );
      });

      if (conflicts.length > 0) {
        setAvailabilityStatus('unavailable');
        setConflictingBookings(conflicts);
        setError('Vehicle is not available for the selected dates. Please choose different dates.');
      } else {
        setAvailabilityStatus('available');
        setError('');
      }

    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityStatus('error');
      setError('Unable to check availability. Please try again.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const validateBooking = () => {
    if (!bookingData.pickupDate || !bookingData.returnDate) {
      setError('Please select pickup and return dates');
      return false;
    }

    if (new Date(bookingData.pickupDate) >= new Date(bookingData.returnDate)) {
      setError('Return date must be after pickup date');
      return false;
    }

    // Check if any selected dates are disabled
    if (disabledDates.includes(bookingData.pickupDate)) {
      setError(`Pickup date ${bookingData.pickupDate} is not available. Please select a different date.`);
      return false;
    }

    if (disabledDates.includes(bookingData.returnDate)) {
      setError(`Return date ${bookingData.returnDate} is not available. Please select a different date.`);
      return false;
    }

    // Check if any dates in the range are disabled
    const startDate = dayjs(bookingData.pickupDate);
    const endDate = dayjs(bookingData.returnDate);
    let currentDate = startDate;
    
    while (currentDate.isSameOrBefore(endDate, 'day')) {
      const dateString = currentDate.format('YYYY-MM-DD');
      if (disabledDates.includes(dateString)) {
        setError(`Your booking period includes unavailable date ${dateString}. Please select different dates.`);
        return false;
      }
      currentDate = currentDate.add(1, 'day');
    }

    if (availabilityStatus === 'unavailable') {
      setError('Vehicle is not available for the selected dates');
      return false;
    }

    if (!bookingData.pickupLocation || !bookingData.returnLocation) {
      setError('Please specify pickup and return locations');
      return false;
    }

    if (!bookingData.emergencyContact || !bookingData.emergencyPhone) {
      setError('Emergency contact information is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBooking()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {      // Create booking document for database (only use existing attributes)
      const bookingDoc = {
        userId: user.$id,
        userName: user.name,
        userEmail: user.email,
        vehicleId: selectedVehicle.id,
        vehicleMake: selectedVehicle.make,
        vehicleModel: selectedVehicle.model,
        vehicleType: selectedVehicle.type,
        pricePerDay: selectedVehicle.pricePerDay,
        // Booking details
        pickupDate: new Date(`${bookingData.pickupDate}T${bookingData.pickupTime}`).toISOString(),
        returnDate: new Date(`${bookingData.returnDate}T${bookingData.returnTime}`).toISOString(),
        pickupLocation: bookingData.pickupLocation,
        returnLocation: bookingData.returnLocation,
        // Additional services
        driverRequired: bookingData.driverRequired,
        specialRequests: bookingData.specialRequests || '', // Handle empty string
        // Emergency contact
        emergencyContact: bookingData.emergencyContact,
        emergencyPhone: bookingData.emergencyPhone,
        // Pricing
        numberOfDays: numberOfDays,
        totalCost: totalCost,
        // Status - should be pending when booking
        status: 'pending',
        // Required timestamps (DateTime format for Appwrite)
        createdAt: new Date(),
        updatedAt: new Date()
      };// Save to Appwrite database FIRST
      console.log('Saving to database...');
      console.log('Database ID:', 'cargo-car-rental');
      console.log('Collection ID:', 'bookings');
      console.log('Booking data:', bookingDoc);
        const dbResponse = await databases.createDocument(
        'cargo-car-rental', // Your database ID
        'bookings', // Your collection ID
        ID.unique(),
        bookingDoc,
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id))
        ]
      );
      
      console.log('Database save successful:', dbResponse);

      // Also save to user preferences for quick access
      const userPrefs = user.prefs || {};
      const userBookings = userPrefs.bookings || [];
      
      // Add new booking with database ID
      userBookings.push({
        id: dbResponse.$id, // Use database document ID
        vehicleId: selectedVehicle.id,
        vehicleName: `${selectedVehicle.make} ${selectedVehicle.model}`,
        pickupDate: bookingDoc.pickupDate,
        returnDate: bookingDoc.returnDate,
        pickupLocation: bookingData.pickupLocation,
        returnLocation: bookingData.returnLocation,
        driverRequired: bookingData.driverRequired,
        emergencyContact: bookingData.emergencyContact,
        emergencyPhone: bookingData.emergencyPhone,
        specialRequests: bookingData.specialRequests,
        status: 'pending',
        totalCost: totalCost,
        numberOfDays: numberOfDays,
        createdAt: new Date().toISOString()
      });

      await account.updatePrefs({
        ...userPrefs,
        bookings: userBookings
      });

      // Call the completion callback with the database response
      onBookingComplete(dbResponse);
        // Close modal
      onClose();    } catch (error) {
      console.error('Booking error:', error);
      console.error('Full error details:', {
        message: error.message,
        code: error.code,
        type: error.type
      });
      
      if (error.message.includes('rate limit')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (error.message.includes('not found') || error.code === 404) {
        setError('Database or collection not found. Please check your setup.');
      } else {
        setError('Failed to create booking: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatConflictDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Book Vehicle</h3>
              <p className="text-gray-600">{selectedVehicle?.make} {selectedVehicle?.model}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                <Car size={20} className="mr-2" />
                Vehicle Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">{selectedVehicle?.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Fuel:</span>
                  <span className="ml-2 font-medium">{selectedVehicle?.gasType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Seats:</span>
                  <span className="ml-2 font-medium">{selectedVehicle?.seatingCapacity}</span>
                </div>
                <div>
                  <span className="text-gray-600">Rate:</span>
                  <span className="ml-2 font-medium">₱{selectedVehicle?.pricePerDay?.toLocaleString()}/day</span>
                </div>
              </div>
            </div>

            {/* Date and Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Pickup Date *
                  {loadingDisabledDates && (
                    <span className="text-xs text-gray-500 ml-2">(Loading availability...)</span>
                  )}
                </label>
                <DatePicker
                  selected={bookingData.pickupDate ? new Date(bookingData.pickupDate) : null}
                  onChange={(date) => handleDateChange('pickupDate', date)}
                  minDate={new Date()}
                  disabled={loadingDisabledDates}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select pickup date"
                  excludeDates={disabledDates.map(date => new Date(date))}
                  filterDate={date => !isDateDisabled(date)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Return Date *
                </label>
                <DatePicker
                  selected={bookingData.returnDate ? new Date(bookingData.returnDate) : null}
                  onChange={(date) => handleDateChange('returnDate', date)}
                  minDate={bookingData.pickupDate ? dayjs(bookingData.pickupDate).add(1, 'day').toDate() : dayjs().add(1, 'day').toDate()}
                  disabled={loadingDisabledDates || !bookingData.pickupDate}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select return date"
                  excludeDates={disabledDates.map(date => new Date(date))}
                  filterDate={date => !isDateDisabled(date)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={16} className="inline mr-1" />
                  Pickup Time
                </label>
                <input
                  type="time"
                  name="pickupTime"
                  value={bookingData.pickupTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={16} className="inline mr-1" />
                  Return Time
                </label>
                <input
                  type="time"
                  name="returnTime"
                  value={bookingData.returnTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Availability Status */}
            {(checkingAvailability || availabilityStatus) && (
              <div className={`p-4 rounded-lg border ${
                availabilityStatus === 'available' ? 'bg-green-50 border-green-200' :
                availabilityStatus === 'unavailable' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                {checkingAvailability ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Checking availability...</span>
                  </div>
                ) : availabilityStatus === 'available' ? (
                  <div className="flex items-center space-x-2">
                    <Check size={16} className="text-green-600" />
                    <span className="text-sm text-green-800 font-medium">Vehicle is available for selected dates</span>
                  </div>
                ) : availabilityStatus === 'unavailable' ? (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle size={16} className="text-red-600" />
                      <span className="text-sm text-red-800 font-medium">Vehicle is not available</span>
                    </div>
                    {conflictingBookings.length > 0 && (
                      <div className="text-xs text-red-700">
                        <p className="mb-1">Conflicting bookings:</p>
                        {conflictingBookings.map((booking, index) => (
                          <p key={index}>
                            • {formatConflictDate(booking.pickupDate)} to {formatConflictDate(booking.returnDate)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle size={16} className="text-yellow-600" />
                    <span className="text-sm text-yellow-800">Unable to check availability</span>
                  </div>
                )}
              </div>
            )}

            {/* Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-1" />
                  Pickup Location *
                </label>
                <input
                  type="text"
                  name="pickupLocation"
                  value={bookingData.pickupLocation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter pickup address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-1" />
                  Return Location *
                </label>
                <input
                  type="text"
                  name="returnLocation"
                  value={bookingData.returnLocation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter return address"
                  required
                />
              </div>
            </div>

            {/* Additional Services */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Additional Services</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="driverRequired"
                  name="driverRequired"
                  checked={bookingData.driverRequired}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="driverRequired" className="text-sm text-gray-700">
                  Include Driver (+₱1,000/day)
                </label>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-1" />
                  Emergency Contact Name *
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={bookingData.emergencyContact}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone size={16} className="inline mr-1" />
                  Emergency Contact Phone *
                </label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={bookingData.emergencyPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number"
                  required
                />
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests
              </label>
              <textarea
                name="specialRequests"
                value={bookingData.specialRequests}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Any special requirements or notes..."
              />
            </div>

            {/* Cost Summary */}
            {numberOfDays > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{numberOfDays} day{numberOfDays > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vehicle Rate:</span>
                    <span>₱{selectedVehicle?.pricePerDay?.toLocaleString()} × {numberOfDays} days</span>
                  </div>
                  {bookingData.driverRequired && (
                    <div className="flex justify-between">
                      <span>Driver Service:</span>
                      <span>₱1,000 × {numberOfDays} days</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Cost:</span>
                    <span className="text-green-600">₱{totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition duration-300"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={
                  loading || 
                  numberOfDays === 0 || 
                  availabilityStatus === 'unavailable' || 
                  checkingAvailability
                }
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Check size={16} />
                    <span>
                      {availabilityStatus === 'unavailable' ? 'Not Available' : 
                       checkingAvailability ? 'Checking...' :
                       `Confirm Booking (₱${totalCost.toLocaleString()})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;