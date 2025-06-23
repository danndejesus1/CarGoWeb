import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Phone, Mail, Car, Eye, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, X, User, Star } from 'lucide-react';
import { account, databases } from '../../appwrite/config';
import { Query } from 'appwrite';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DATABASE_ID = 'cargo-car-rental';
const BOOKINGS_COLLECTION_ID = 'bookings';
const RATINGS_COLLECTION_ID = 'ratings';

const BookingManager = ({ user, onUpdateBookings }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [vehicleAvailability, setVehicleAvailability] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const detailsRef = useRef(null);

  // Always fetch bookings from DB for this user
  useEffect(() => {
    loadBookings();
    loadUserRatings();
  }, [user]);

  const loadBookings = async () => {
    
    try {
      setLoading(true);
      setError('');
      // Fetch bookings from DB for this user, newest first
      const response = await databases.listDocuments(
        DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        [
          Query.equal('userId', user.$id),
          Query.orderDesc('createdAt')
        ]
      );
      setBookings(response.documents);
      await loadVehicleAvailability(response.documents);
    } catch (error) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const loadUserRatings = async () => {
    try {
      // Fetch all ratings by this user
      const res = await databases.listDocuments(
        DATABASE_ID,
        RATINGS_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );
      // Map bookingId -> rating
      const ratingsMap = {};
      res.documents.forEach(r => {
        ratingsMap[r.bookingId] = r;
      });
      setUserRatings(ratingsMap);
    } catch {}
  };

  const loadVehicleAvailability = async (bookings) => {
    try {
      const availability = {};
      const vehicleIds = [...new Set(bookings.map(booking => booking.vehicleId))];
      for (const vehicleId of vehicleIds) {
        if (vehicleId) {
          try {
            const vehicle = await databases.getDocument(
              DATABASE_ID,
              'vehicles',
              vehicleId
            );
            availability[vehicleId] = vehicle.available;
          } catch {
            availability[vehicleId] = false;
          }
        }
      }
      setVehicleAvailability(availability);
    } catch {}
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
      await databases.updateDocument(
        DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        bookingId,
        { status: 'cancelled', updatedAt: new Date().toISOString() }
      );
      await loadBookings();
      if (onUpdateBookings) onUpdateBookings();
    } catch (error) {
      setError('Failed to cancel booking');
    }
  };

  const handleRemoveBooking = async (bookingId) => {
    if (!confirm('Remove this booking from your history? This cannot be undone.')) {
      return;
    }
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        bookingId
      );
      await loadBookings();
      if (onUpdateBookings) onUpdateBookings();
    } catch (error) {
      setError('Failed to remove booking');
    }
  };

  const handleViewDetails = (booking) => {
    // Map DB fields to modal fields for display
    setSelectedBooking({
      id: booking.$id,
      vehicleName: booking.vehicleMake && booking.vehicleModel
        ? `${booking.vehicleMake} ${booking.vehicleModel}`
        : booking.vehicleName || '',
      vehicleType: booking.vehicleType,
      vehicleId: booking.vehicleId,
      pickupDate: booking.pickupDate,
      returnDate: booking.returnDate,
      pickupLocation: booking.pickupLocation,
      returnLocation: booking.returnLocation,
      status: booking.status,
      totalCost: booking.totalCost,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      specialRequests: booking.specialRequests,
      driverRequired: booking.driverRequired,
      emergencyContact: booking.emergencyContact,
      emergencyPhone: booking.emergencyPhone,
      numberOfDays: booking.numberOfDays,
      pricePerDay: booking.pricePerDay,
      paymentFieldId: booking.paymentFieldId,
      paymentFieldUrl: booking.paymentFieldUrl,
      paymentFileName: booking.paymentFileName,
      userName: booking.userName,
      userEmail: booking.userEmail,
      userId: booking.userId,
      // Add any other fields you want to show
    });
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

  const patchUnsupportedColors = (element) => {
    // Recursively patch all elements with oklch color
    if (!element) return;
    const tree = element.querySelectorAll('*');
    tree.forEach(el => {
      const style = window.getComputedStyle(el);
      // Patch color
      if (style.color && style.color.includes('oklch')) {
        el.style.color = '#222'; // fallback
      }
      // Patch background
      if (style.backgroundColor && style.backgroundColor.includes('oklch')) {
        el.style.backgroundColor = '#fff'; // fallback
      }
      // Patch border color
      if (style.borderColor && style.borderColor.includes('oklch')) {
        el.style.borderColor = '#ccc'; // fallback
      }
    });
  };

  const handleExportPDF = async () => {
    if (!selectedBooking) return;

    // Helper to format numbers without any currency sign or extra characters
    const formatNumber = (num) => {
      if (typeof num === 'number') return num.toLocaleString();
      if (typeof num === 'string') return num.replace(/[^\d.,]/g, '');
      return '-';
    };

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const margin = 40;
    let y = margin;

    // CarGo Logo (optional: replace with your logo URL)
    // const logoUrl = 'https://your-cargo-logo-url.png';
    // try {
    //   const logoResp = await fetch(logoUrl);
    //   const logoBlob = await logoResp.blob();
    //   const logoReader = new FileReader();
    //   const logoBase64 = await new Promise((resolve, reject) => {
    //     logoReader.onloadend = () => resolve(logoReader.result);
    //     logoReader.onerror = reject;
    //     logoReader.readAsDataURL(logoBlob);
    //   });
    //   pdf.addImage(logoBase64, 'PNG', margin, y, 60, 60);
    // } catch {}
    // y += 70;

    // Company Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175); // CarGo blue
    pdf.text('CarGo', margin, y);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    pdf.text('Cargo Car Rental Services', margin, y + 18);
    pdf.text('123 Main St, Metro Manila, Philippines', margin, y + 34);
    pdf.text('Email: support@cargo.com | Phone: +63 912 345 6789', margin, y + 50);
    y += 70;

    // Receipt Title & Info
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Official Booking Receipt', margin, y);
    y += 28;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Receipt #: ${selectedBooking.id}`, margin, y);
    pdf.text(`Status: ${selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}`, margin + 300, y);
    y += 16;
    pdf.text(`Date Issued: ${new Date().toLocaleString()}`, margin, y);
    y += 24;

    // Draw a line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, 555, y);
    y += 16;

    // User Info
    pdf.setFont('helvetica', 'bold');
    pdf.text('Customer Information', margin, y);
    y += 16;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${selectedBooking.userName || '-'}`, margin, y);
    y += 14;
    pdf.text(`Email: ${selectedBooking.userEmail || '-'}`, margin, y);
    y += 14;
    pdf.text(`User ID: ${selectedBooking.userId || '-'}`, margin, y);
    y += 22;

    // Vehicle Info
    pdf.setFont('helvetica', 'bold');
    pdf.text('Vehicle Details', margin, y);
    y += 16;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Vehicle: ${selectedBooking.vehicleName || '-'}`, margin, y);
    y += 14;
    pdf.text(`Type: ${selectedBooking.vehicleType || '-'}`, margin, y);
    y += 14;
    pdf.text(`Vehicle ID: ${selectedBooking.vehicleId || '-'}`, margin, y);
    y += 22;

    // Booking Dates
    pdf.setFont('helvetica', 'bold');
    pdf.text('Booking Schedule', margin, y);
    y += 16;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Pickup: ${selectedBooking.pickupDate ? new Date(selectedBooking.pickupDate).toLocaleString() : '-'}`, margin, y);
    y += 14;
    pdf.text(`Pickup Location: ${selectedBooking.pickupLocation || '-'}`, margin, y);
    y += 14;
    pdf.text(`Return: ${selectedBooking.returnDate ? new Date(selectedBooking.returnDate).toLocaleString() : '-'}`, margin, y);
    y += 14;
    pdf.text(`Return Location: ${selectedBooking.returnLocation || '-'}`, margin, y);
    y += 22;

    // Emergency Contact
    pdf.setFont('helvetica', 'bold');
    pdf.text('Emergency Contact', margin, y);
    y += 16;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${selectedBooking.emergencyContact || '-'}`, margin, y);
    y += 14;
    pdf.text(`Phone: ${selectedBooking.emergencyPhone || '-'}`, margin, y);
    y += 22;

    // Special Requests & Driver
    pdf.setFont('helvetica', 'bold');
    pdf.text('Other Details', margin, y);
    y += 16;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Special Requests: ${selectedBooking.specialRequests || '-'}`, margin, y);
    y += 14;
    pdf.text(`Driver Required: ${selectedBooking.driverRequired ? 'Yes' : 'No'}`, margin, y);
    y += 22;

    // Cost Summary
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cost Summary', margin, y);
    y += 16;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Price per Day: ${formatNumber(selectedBooking.pricePerDay) || '-'}`, margin, y);
    y += 14;
    pdf.text(`Number of Days: ${formatNumber(selectedBooking.numberOfDays) || '-'}`, margin, y);
    y += 14;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(34, 197, 94); // green
    pdf.text(`Total Cost: ${formatNumber(selectedBooking.totalCost) || '-'}`, margin, y);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    y += 22;

    // Payment Info
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment', margin, y);
    y += 16;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Payment File Name: ${selectedBooking.paymentFileName || '-'}`, margin, y);
    y += 14;

    // Payment Image
    if (selectedBooking.paymentFieldId) {
      try {
        const imageUrl = `https://fra.cloud.appwrite.io/v1/storage/buckets/cargo-files/files/${selectedBooking.paymentFieldId}/view?project=685682ba00095008cb7d`;
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        y += 8;
        pdf.text('Payment Proof:', margin, y);
        y += 8;
        pdf.addImage(base64, 'JPEG', margin, y, 120, 120);
        y += 130;
      } catch (e) {
        pdf.text('Payment Proof: [Image could not be loaded]', margin, y);
        y += 16;
      }
    } else {
      pdf.text('Payment Proof: No Image', margin, y);
      y += 16;
    }

    // Timestamps
    pdf.setFont('helvetica', 'bold');
    pdf.text('Timestamps', margin, y);
    y += 16;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Created At: ${selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : '-'}`, margin, y);
    y += 14;
    pdf.text(`Updated At: ${selectedBooking.updatedAt ? new Date(selectedBooking.updatedAt).toLocaleString() : '-'}`, margin, y);
    y += 22;

    // Draw a line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, 555, y);
    y += 16;

    // Footer
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(120, 120, 120);
    pdf.text('Thank you for choosing CarGo. For inquiries, contact support@cargo.com', margin, y + 10);

    pdf.save(`CarGo-Receipt-${selectedBooking.id}.pdf`);
  };

  // Add this function before the return (
  const handleSubmitRating = async ({ bookingId, vehicleId, stars, comment }) => {
    try {
      // Ensure stars is an integer between 1 and 5
      const safeStars = Math.max(1, Math.min(5, parseInt(stars, 10)));
      await databases.createDocument(
        DATABASE_ID,
        RATINGS_COLLECTION_ID,
        'unique()',
        {
          bookingId,
          userId: user.$id,
          vehicleId,
          stars: safeStars,
          comment,
          createdAt: new Date().toISOString()
        }
      );
      // Update booking status to completed
      await databases.updateDocument(
        DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        bookingId,
        { status: 'completed', updatedAt: new Date().toISOString() }
      );
      setShowRatingModal(false);
      setRatingBooking(null);
      await loadBookings();
      await loadUserRatings();
    } catch (e) {
      // Log the error details for debugging
      console.error('Failed to submit rating:', e);
      alert('Failed to submit rating. ' + (e?.message || ''));
    }
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
            <div key={booking.$id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
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
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewDetails(booking)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {/* Remove from History always available */}
                    <button
                      onClick={() => handleRemoveBooking(booking.id)}
                      className="text-gray-400 hover:text-gray-700 p-1"
                      title="Remove from History"
                    >
                      <X size={16} />
                    </button>
                    {booking.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Cancel Booking"
                        >
                          <Trash2 size={16} />
                        </button>
                        {/* Pay Now button, only if not paid */}
                        {!booking.paid && (
                          <button
                            onClick={() => {
                              setPaymentBooking(booking);
                              setShowPaymentModal(true);
                            }}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Pay Now"
                          >
                          
                          </button>
                        )}
                      </>
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
                {/* Rating button for confirmed bookings not yet rated */}
                {booking.status === 'confirmed' && !userRatings[booking.$id] && (
                  <button
                    className="ml-4 flex items-center text-yellow-500 hover:text-yellow-600 text-sm"
                    onClick={() => {
                      setRatingBooking(booking);
                      setShowRatingModal(true);
                    }}
                  >
                    <Star size={18} className="mr-1" />
                    Rate
                  </button>
                )}
                {/* Show stars if already rated (now completed) */}
                {booking.status === 'completed' && userRatings[booking.$id] && (
                  <span className="ml-4 flex items-center text-yellow-500">
                    {[...Array(userRatings[booking.$id].stars)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" stroke="none" />
                    ))}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6" ref={detailsRef}>
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

                {/* User Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <User size={16} className="mr-2" />
                    User Information
                  </h4>
                  <div className="text-sm text-gray-700">
                    <div><span className="font-medium">Name:</span> {selectedBooking.userName}</div>
                    <div><span className="font-medium">Email:</span> {selectedBooking.userEmail}</div>
                    <div><span className="font-medium">User ID:</span> {selectedBooking.userId}</div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Car size={20} className="mr-2" />
                    Vehicle Information
                  </h4>
                  <div className="text-sm text-gray-700">
                    <div><span className="font-medium">Vehicle:</span> {selectedBooking.vehicleName}</div>
                    <div><span className="font-medium">Type:</span> {selectedBooking.vehicleType}</div>
                    <div><span className="font-medium">Vehicle ID:</span> {selectedBooking.vehicleId}</div>
                  </div>
                </div>

                {/* Booking Dates & Times */}
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

                {/* Emergency Contact */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Phone size={16} className="mr-2" />
                    Emergency Contact
                  </h4>
                  <div className="text-sm text-gray-700">
                    <div><span className="font-medium">Name:</span> {selectedBooking.emergencyContact}</div>
                    <div><span className="font-medium">Phone:</span> {selectedBooking.emergencyPhone}</div>
                  </div>
                </div>

                {/* Special Requests & Driver */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Other Details</h4>
                  <div className="text-sm text-gray-700">
                    <div><span className="font-medium">Special Requests:</span> {selectedBooking.specialRequests || '-'}</div>
                    <div><span className="font-medium">Driver Required:</span> {selectedBooking.driverRequired ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Cost Summary</h4>
                  <div className="text-sm text-gray-700">
                    <div><span className="font-medium">Price per Day:</span> ₱{selectedBooking.pricePerDay?.toLocaleString()}</div>
                    <div><span className="font-medium">Number of Days:</span> {selectedBooking.numberOfDays}</div>
                    <div><span className="font-medium">Total Cost:</span> <span className="text-green-600 font-bold">₱{selectedBooking.totalCost?.toLocaleString()}</span></div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Payment</h4>
                  <div className="text-sm text-gray-700">
                    <div>
                      <span className="font-medium">Payment File Name:</span> {selectedBooking.paymentFileName || '-'}
                    </div>
                    <div>
                      <span className="font-medium">Payment Proof:</span>{' '}
                      {selectedBooking.paymentFieldId ? (
                        <a
                          href={`https://fra.cloud.appwrite.io/v1/storage/buckets/cargo-files/files/${selectedBooking.paymentFieldId}/view?project=685682ba00095008cb7d`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          <img
                            src={`https://fra.cloud.appwrite.io/v1/storage/buckets/cargo-files/files/${selectedBooking.paymentFieldId}/view?project=685682ba00095008cb7d`}
                            alt="Payment Proof"
                            className="h-16 w-16 object-cover rounded border inline-block mr-2"
                            style={{ background: '#f3f4f6' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Timestamps</h4>
                  <div className="text-sm text-gray-700">
                    <div><span className="font-medium">Created At:</span> {formatDateTime(selectedBooking.createdAt)}</div>
                    <div><span className="font-medium">Updated At:</span> {formatDateTime(selectedBooking.updatedAt)}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 px-6 pb-6">
              <button
                onClick={handleExportPDF}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
              >
                Export as PDF
              </button>
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
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentBooking && (
        <Payment
          booking={paymentBooking}
          user={user}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentBooking(null);
          }}
          onPaymentSuccess={async (updatedBooking) => {
            // Mark booking as paid in user prefs
            const userData = await account.get();
            const userBookings = userData.prefs?.bookings || [];
            const newBookings = userBookings.map(b =>
              b.id === updatedBooking.id ? { ...b, paid: true } : b
            );
            await account.updatePrefs({
              ...userData.prefs,
              bookings: newBookings
            });
            setBookings(newBookings);
            setShowPaymentModal(false);
            setPaymentBooking(null);
          }}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && ratingBooking && (
        <RatingModal
          booking={ratingBooking}
          onClose={() => {
            setShowRatingModal(false);
            setRatingBooking(null);
          }}
          onSubmit={async (stars, comment) => {
            await handleSubmitRating({
              bookingId: ratingBooking.$id,
              vehicleId: ratingBooking.vehicleId,
              stars,
              comment
            });
          }}
        />
      )}
    </div>
  );
};

// Add this RatingModal component at the bottom of the file
function RatingModal({ booking, onClose, onSubmit }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Rate Your Booking</h3>
        <div className="flex items-center mb-4">
          {[1,2,3,4,5].map(i => (
            <button
              key={i}
              type="button"
              className={`mx-1 ${i <= stars ? 'text-yellow-500' : 'text-gray-300'}`}
              onClick={() => setStars(i)}
              aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
            >
              <Star size={28} fill={i <= stars ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
        <textarea
          className="w-full border rounded p-2 mb-4"
          rows={3}
          placeholder="Leave a comment (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <div className="flex space-x-2">
          <button
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              await onSubmit(stars, comment);
              setSubmitting(false);
            }}
          >
            Submit
          </button>
          <button
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingManager;