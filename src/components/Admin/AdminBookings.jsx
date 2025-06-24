import React, { useEffect, useState } from 'react';
import { databases, storage } from '../../appwrite/config';
import { Query } from 'appwrite';
import { Eye, Car, CheckCircle, XCircle, ChevronDown } from 'lucide-react'; // Add XCircle for cancel icon

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

// Simple Modal component
const ConfirmModal = ({ open, title, message, onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
        <h4 className="font-bold text-lg mb-2">{title}</h4>
        <p className="mb-4 text-gray-700">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full inline-block"></span>
            ) : (
              'Yes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null); // Track cancelling

  // New: search and filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Modal state
  const [modal, setModal] = useState({
    open: false,
    action: null, // 'confirm' | 'cancel'
    bookingId: null,
  });

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

  // Confirm booking handler (opens modal)
  const handleConfirmBooking = (bookingId) => {
    setModal({
      open: true,
      action: 'confirm',
      bookingId,
    });
  };

  // Cancel booking handler (opens modal)
  const handleCancelBooking = (bookingId) => {
    setModal({
      open: true,
      action: 'cancel',
      bookingId,
    });
  };

  // Modal confirm action
  const handleModalConfirm = async () => {
    if (!modal.bookingId) return;
    if (modal.action === 'confirm') {
      setUpdatingId(modal.bookingId);
      setError('');
      try {
        await databases.updateDocument(
          'cargo-car-rental',
          'bookings',
          modal.bookingId,
          { status: 'confirmed', updatedAt: new Date().toISOString() }
        );
        // Refresh bookings
        await loadBookings();
      } catch (err) {
        setError('Failed to confirm booking: ' + (err.message || err));
      } finally {
        setUpdatingId(null);
        setModal({ open: false, action: null, bookingId: null });
      }
    } else if (modal.action === 'cancel') {
      setCancellingId(modal.bookingId);
      setError('');
      try {
        await databases.updateDocument(
          'cargo-car-rental',
          'bookings',
          modal.bookingId,
          { status: 'cancelled', updatedAt: new Date().toISOString() }
        );
        await loadBookings();
      } catch (err) {
        setError('Failed to cancel booking: ' + (err.message || err));
      } finally {
        setCancellingId(null);
        setModal({ open: false, action: null, bookingId: null });
      }
    }
  };

  // Modal cancel action
  const handleModalCancel = () => {
    setModal({ open: false, action: null, bookingId: null });
  };

  // New: filtered and sorted bookings
  const filteredBookings = bookings
    .filter((booking) => {
      // Status filter
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
      // Search filter (by user, vehicle, booking id)
      const searchLower = search.trim().toLowerCase();
      if (!searchLower) return true;
      return (
        (booking.userName && booking.userName.toLowerCase().includes(searchLower)) ||
        (booking.userEmail && booking.userEmail.toLowerCase().includes(searchLower)) ||
        (booking.vehicleMake && booking.vehicleMake.toLowerCase().includes(searchLower)) ||
        (booking.vehicleModel && booking.vehicleModel.toLowerCase().includes(searchLower)) ||
        (booking.$id && booking.$id.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'totalCost') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortBy === 'createdAt' || sortBy === 'pickupDate' || sortBy === 'returnDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = valA || '';
        valB = valB || '';
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">All Bookings</h3>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          {/* Search input */}
          <input
            type="text"
            placeholder="Search by user, vehicle, or ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            style={{ minWidth: 220 }}
          />
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          {/* Sort by */}
          <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
            <label className="mr-2 text-sm text-gray-600">Sort by</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm bg-transparent outline-none"
            >
              <option value="createdAt">Created</option>
              <option value="pickupDate">Pickup</option>
              <option value="returnDate">Return</option>
              <option value="totalCost">Total Cost</option>
              <option value="userName">User Name</option>
              <option value="vehicleMake">Vehicle</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
              className="ml-1 text-gray-500 hover:text-gray-700"
              title="Toggle sort direction"
            >
              <ChevronDown
                size={18}
                className={sortDir === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'}
              />
            </button>
          </div>
          <button
            onClick={loadBookings}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
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
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
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
                          <div className="flex flex-row gap-2">
                            <button
                              onClick={() => handleConfirmBooking(booking.$id)}
                              disabled={updatingId === booking.$id || cancellingId === booking.$id}
                              className="p-1 rounded hover:bg-green-100 text-green-700 disabled:opacity-50"
                              title="Confirm Booking"
                            >
                              {updatingId === booking.$id ? (
                                <span className="animate-spin h-4 w-4 border-b-2 border-green-700 rounded-full"></span>
                              ) : (
                                <CheckCircle size={20} />
                              )}
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.$id)}
                              disabled={cancellingId === booking.$id || updatingId === booking.$id}
                              className="p-1 rounded hover:bg-red-100 text-red-700 disabled:opacity-50"
                              title="Cancel Booking"
                            >
                              {cancellingId === booking.$id ? (
                                <span className="animate-spin h-4 w-4 border-b-2 border-red-700 rounded-full"></span>
                              ) : (
                                <XCircle size={20} />
                              )}
                            </button>
                          </div>
                        )}
                        {booking.status === 'confirmed' && (
                          <span className="text-green-700 font-semibold flex items-center">
                            <CheckCircle size={16} className="mr-1" /> Confirmed
                          </span>
                        )}
                        {booking.status === 'cancelled' && (
                          <span className="text-red-700 font-semibold flex items-center">
                            <XCircle size={16} className="mr-1" /> Cancelled
                          </span>
                        )}
                        {booking.status === 'completed' && (
                          <span className="text-blue-700 font-semibold flex items-center">
                            <CheckCircle size={16} className="mr-1" /> Completed
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
      {/* Modal for confirmation */}
      <ConfirmModal
        open={modal.open}
        title={
          modal.action === 'confirm'
            ? 'Confirm Booking'
            : modal.action === 'cancel'
            ? 'Cancel Booking'
            : ''
        }
        message={
          modal.action === 'confirm'
            ? 'Are you sure you want to CONFIRM this booking?'
            : modal.action === 'cancel'
            ? 'Are you sure you want to CANCEL this booking?'
            : ''
        }
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        loading={modal.action === 'confirm' ? updatingId === modal.bookingId : cancellingId === modal.bookingId}
      />
    </div>
  );
};

export default AdminBookings;
