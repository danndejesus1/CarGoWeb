import React, { useState, useEffect } from 'react';
import { LogOut, Package, Truck, Users, DollarSign, Plus, Eye, Settings, BarChart3, Car, Edit, Trash2, X, Upload, ChevronDown } from 'lucide-react';
import { databases, storage } from '../../appwrite/config';
import { ID, Query } from 'appwrite';
import { uploadFile, getFilePreview } from '../../appwrite/fileManager';
import AdminBookings from './AdminBookings';
import AdminManageUsers from './AdminManageUsers';
import FeedBackandRatings from './FeedBackandRatings';
import GenerateReport from './GenerateReport';
import AdminAnalytics from './AdminAnalytics';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [vehicles, setVehicles] = useState([]);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  // Add bookings state
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  // Simple function to get direct file URL
  const getDirectFileUrl = (fileId) => {
    if (!fileId) return null;
    return `https://fra.cloud.appwrite.io/v1/storage/buckets/cargo-files/files/${fileId}/view?project=685682ba00095008cb7d`;
  };

  // VehicleImage component
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
        <div className="w-full h-32 bg-gray-300 rounded-lg flex items-center justify-center">
          <Car className="h-8 w-8 text-gray-500" />
          <div className="ml-2 text-sm text-gray-600">
            {vehicle.imageFileId ? 'Image Failed' : 'No Image'}
          </div>
        </div>
      );
    }

    return (
      <img
        src={imageSrc}
        alt={`${vehicle.make} ${vehicle.model}`}
        className="w-full h-32 object-cover rounded-lg"
        onLoad={() => {
          console.log(`✅ Image loaded: ${vehicle.make} ${vehicle.model}`);
          console.log(`Source: ${imageSrc}`);
        }}
        onError={(e) => {
          console.error(`❌ Image failed: ${vehicle.make} ${vehicle.model}`);
          console.error(`Failed URL: ${e.target.src}`);
          console.error(`FileID: ${vehicle.imageFileId}`);
          console.error(`ImageURL: ${vehicle.imageUrl}`);
          setShowPlaceholder(true);
        }}
      />
    );
  };

const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    type: 'Sedan',
    gasType: 'Petrol',
    seatingCapacity: 5,
    pricePerDay: '',
    imageUrl: '',
    imageFileId: '', // Store file ID for organization
    imageFileName: '', // Store organized filename
    description: '',
    available: true
  });

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminUser');
    window.location.reload();
  };

  // Load vehicles from database
  useEffect(() => {
    loadVehicles();
  }, []);
  // Load vehicles from database
  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        'cargo-car-rental',
        'vehicles'
      );
      console.log('Loaded vehicles:', response.documents);
      setVehicles(response.documents);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVehicleForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               name === 'seatingCapacity' || name === 'pricePerDay' ? 
               (value === '' ? '' : Number(value)) : value
    }));
  };
  const resetForm = () => {
    setVehicleForm({
      make: '',
      model: '',
      type: 'Sedan',
      gasType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: '',
      imageUrl: '',
      imageFileId: '',
      imageFileName: '',
      description: '',
      available: true
    });
    setEditingVehicle(null);
  };  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {      // Prepare base vehicle data with all fields
      const baseVehicleData = {
        make: vehicleForm.make,
        model: vehicleForm.model,
        type: vehicleForm.type,
        gasType: vehicleForm.gasType,
        seatingCapacity: vehicleForm.seatingCapacity,
        pricePerDay: vehicleForm.pricePerDay,
        imageFileId: vehicleForm.imageFileId || '',
        imageFileName: vehicleForm.imageFileName || '',
        imageUrl: vehicleForm.imageUrl || '', // Now included since attribute exists
        description: vehicleForm.description || '', // Include description too
        available: vehicleForm.available
      };

      let vehicleData;

      if (editingVehicle) {
        // Update existing vehicle - only set updatedAt
        vehicleData = {
          ...baseVehicleData,
          updatedAt: new Date().toISOString() 
        };
        
        await databases.updateDocument(
          'cargo-car-rental',
          'vehicles',
          editingVehicle.$id,
          vehicleData
        );
      } else {
        // Add new vehicle - set both createdAt and updatedAt
        const currentTime = new Date().toISOString();
        vehicleData = {
          ...baseVehicleData,
          createdAt: currentTime,
          updatedAt: currentTime
        };
          await databases.createDocument(
          'cargo-car-rental',
          'vehicles',
          ID.unique(),
          vehicleData
        );
        
        console.log('Saved vehicle data:', vehicleData);
      }

      await loadVehicles();
      setShowAddVehicleModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      setError('Failed to save vehicle: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      make: vehicle.make,
      model: vehicle.model,
      type: vehicle.type,
      gasType: vehicle.gasType,
      seatingCapacity: vehicle.seatingCapacity,
      pricePerDay: vehicle.pricePerDay,
      imageUrl: vehicle.imageUrl || '',
      imageFileId: vehicle.imageFileId || '',
      imageFileName: vehicle.imageFileName || '',
      description: vehicle.description || '',
      available: vehicle.available !== false
    });
    setShowAddVehicleModal(true);
  };const handleDeleteVehicle = async (vehicleId) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      setLoading(true);
      await databases.deleteDocument(
        'cargo-car-rental',
        'vehicles',
        vehicleId
      );
      await loadVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      setError('Failed to delete vehicle: ' + error.message);
    } finally {
      setLoading(false);
    }
  };  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError('');

      // Create organized filename for vehicle image
      const organizedFileName = `vehicle-${vehicleForm.make || 'unknown'}-${vehicleForm.model || 'model'}-${Date.now()}`;
      
      console.log('Uploading with filename:', organizedFileName);
      
      // Upload using your existing file manager with vehicle category
      const result = await uploadFile(file, 'vehicle_image', organizedFileName);
      
      if (result.success) {
        // Get file preview URL using your existing function
        const imageUrl = getFilePreview(result.fileId, 400, 250);
        
        console.log('Upload successful!');
        console.log('File ID:', result.fileId);
        console.log('Preview URL:', imageUrl);
        console.log('Organized filename:', organizedFileName);
        
        setVehicleForm(prev => ({
          ...prev,
          imageUrl: imageUrl,
          imageFileId: result.fileId, // Store file ID for reference
          imageFileName: organizedFileName
        }));
      } else {
        console.error('Upload failed:', result.error);
        setError('Failed to upload image: ' + result.error);
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

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

  // Vehicle search/filter/sort state
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleAvailability, setVehicleAvailability] = useState('all');
  const [vehicleSortBy, setVehicleSortBy] = useState('make');
  const [vehicleSortDir, setVehicleSortDir] = useState('asc');

  // Filtered and sorted vehicles
  const filteredVehicles = vehicles
    .filter(vehicle => {
      // Availability filter
      if (vehicleAvailability === 'available' && !vehicle.available) return false;
      if (vehicleAvailability === 'unavailable' && vehicle.available) return false;
      // Search filter (make, model, type)
      const searchLower = vehicleSearch.trim().toLowerCase();
      if (!searchLower) return true;
      return (
        (vehicle.make && vehicle.make.toLowerCase().includes(searchLower)) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(searchLower)) ||
        (vehicle.type && vehicle.type.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      let valA = a[vehicleSortBy] || '';
      let valB = b[vehicleSortBy] || '';
      if (vehicleSortBy === 'pricePerDay') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (vehicleSortBy === 'available') {
        valA = a.available ? 1 : 0;
        valB = b.available ? 1 : 0;
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }
      if (valA < valB) return vehicleSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return vehicleSortDir === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-50 overflow-y-auto">
      <div className="admin-dashboard min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col py-8 px-4 min-h-screen">
          <div className="flex items-center mb-10">
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">CarGo Admin</h1>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>
          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                activeSection === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveSection('vehicles')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                activeSection === 'vehicles'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Car className="h-5 w-5 mr-3" />
              Manage Vehicles
            </button>
            <button
              onClick={() => setActiveSection('bookings')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                activeSection === 'bookings'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Eye className="h-5 w-5 mr-3" />
              View All Bookings
            </button>
            <button
              onClick={() => setActiveSection('users')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                activeSection === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Users className="h-5 w-5 mr-3" />
              Manage Users
            </button>
            <button
              onClick={() => setActiveSection('feedback')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                activeSection === 'feedback'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Feedback and Ratings
            </button>
            <button
              onClick={() => setActiveSection('report')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                activeSection === 'report'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Generate Report
            </button>
          </nav>
          <div className="mt-auto pt-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-md"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Admin!</h2>
              <p className="text-gray-600">Here's what's happening with your cargo rental business today.</p>
            </div>
          </div>

          {/* Stats Cards and Analytics */}
          <div>
            {activeSection === 'dashboard' && (
              <>
                <AdminAnalytics />
              </>
            )}

            {activeSection === 'vehicles' && (
              <div>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-4">
                  <h3 className="text-xl font-bold text-gray-900">Vehicle Management</h3>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search by make, model, or type"
                      value={vehicleSearch}
                      onChange={e => setVehicleSearch(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                      style={{ minWidth: 200 }}
                    />
                    <select
                      value={vehicleAvailability}
                      onChange={e => setVehicleAvailability(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All</option>
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                    <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
                      <label className="mr-2 text-sm text-gray-600">Sort by</label>
                      <select
                        value={vehicleSortBy}
                        onChange={e => setVehicleSortBy(e.target.value)}
                        className="text-sm bg-transparent outline-none"
                      >
                        <option value="make">Make</option>
                        <option value="model">Model</option>
                        <option value="type">Type</option>
                        <option value="pricePerDay">Price</option>
                        <option value="available">Availability</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setVehicleSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                        title="Toggle sort direction"
                      >
                        <ChevronDown
                          size={18}
                          className={vehicleSortDir === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'}
                        />
                      </button>
                    </div>
                    <button
                      onClick={() => setShowAddVehicleModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Vehicle</span>
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading vehicles...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVehicles.map((vehicle) => (
                      <div key={vehicle.$id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="relative mb-4">
                          <VehicleImage vehicle={vehicle} />
                          
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                            vehicle.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {vehicle.available ? 'Available' : 'Unavailable'}
                          </div>
                        </div>
                        
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">
                          {vehicle.make} {vehicle.model}
                        </h4>
                        
                        <div className="space-y-1 text-sm text-gray-600 mb-4">
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="font-medium">{vehicle.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fuel:</span>
                            <span className="font-medium">{vehicle.gasType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Seats:</span>
                            <span className="font-medium">{vehicle.seatingCapacity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Price:</span>
                            <span className="font-medium text-green-600">₱{vehicle.pricePerDay?.toLocaleString()}/day</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditVehicle(vehicle)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm flex items-center justify-center space-x-1 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteVehicle(vehicle.$id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm flex items-center justify-center space-x-1 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredVehicles.length === 0 && !loading && (
                      <div className="col-span-full text-center py-12">
                        <Car size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 text-lg mb-2">No vehicles found</p>
                        <p className="text-gray-500 text-sm">Try adjusting your filters or add a new vehicle</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Bookings table removed from here */}
              </div>
            )}

            {activeSection === 'bookings' && (
              <AdminBookings />
            )}

            {activeSection === 'users' && (
              <AdminManageUsers />
            )}
            {activeSection === 'feedback' && (
              <FeedBackandRatings />
            )}
            {activeSection === 'report' && (
              <GenerateReport />
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h3>
                <button 
                  onClick={() => {
                    setShowAddVehicleModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddVehicle} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                    <input
                      type="text"
                      name="make"
                      value={vehicleForm.make}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Toyota, Honda"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                    <input
                      type="text"
                      name="model"
                      value={vehicleForm.model}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Vios, CRV"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
                    <select
                      name="type"
                      value={vehicleForm.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Pickup">Pickup</option>
                      <option value="Van">Van</option>
                      <option value="Coupe">Coupe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gas Type *</label>
                    <select
                      name="gasType"
                      value={vehicleForm.gasType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity *</label>
                    <input
                      type="number"
                      name="seatingCapacity"
                      value={vehicleForm.seatingCapacity}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      min="2"
                      max="15"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per Day (₱) *</label>
                    <input
                      type="number"
                      name="pricePerDay"
                      value={vehicleForm.pricePerDay}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="100"
                      required
                    />
                  </div>
                </div>                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={vehicleForm.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>                <div className="flex items-center space-x-4">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Vehicle Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:bg-blue-600 file:text-white
                        hover:file:bg-blue-700 transition-all duration-200
                        disabled:opacity-50
                      "
                    />
                    {uploadingImage && (
                      <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
                    )}
                    {vehicleForm.imageFileName && (
                      <p className="text-xs text-gray-500 mt-1">
                        Organized as: {vehicleForm.imageFileName}
                      </p>
                    )}
                  </div>                  {(vehicleForm.imageFileId || vehicleForm.imageUrl) && (
                    <div className="flex-shrink-0">
                      <img 
                        src={vehicleForm.imageFileId ? 
                          storage.getFileView('cargo-files', vehicleForm.imageFileId).href : 
                          vehicleForm.imageUrl
                        }
                        alt="Vehicle Preview"
                        className="h-16 w-16 object-cover rounded-md border"
                        onError={(e) => {
                          // Try fallback to imageUrl if file view fails
                          if (vehicleForm.imageFileId && vehicleForm.imageUrl && e.target.src !== vehicleForm.imageUrl) {
                            e.target.src = vehicleForm.imageUrl;
                          } else {
                            e.target.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={vehicleForm.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Additional details about the vehicle..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    name="available"
                    checked={vehicleForm.available}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="available" className="ml-2 text-sm text-gray-700">
                    Available for booking
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddVehicleModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition duration-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {editingVehicle ? 'Updating...' : 'Adding...'}
                      </div>
                    ) : (
                      editingVehicle ? 'Update Vehicle' : 'Add Vehicle'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
                   