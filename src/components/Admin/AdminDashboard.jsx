import React, { useState, useEffect } from 'react';
import { LogOut, Package, Truck, Users, DollarSign, Plus, Eye, Settings, BarChart3, Car, Edit, Trash2, X, Upload } from 'lucide-react';
import { databases, storage } from '../../appwrite/config';
import { ID } from 'appwrite';
import { uploadFile, getFilePreview } from '../../appwrite/fileManager';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [vehicles, setVehicles] = useState([]);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);  const [vehicleForm, setVehicleForm] = useState({
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

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        'cargo-car-rental',
        'vehicles'
      );
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

    try {
      // Prepare base vehicle data
      const baseVehicleData = {
        make: vehicleForm.make,
        model: vehicleForm.model,
        type: vehicleForm.type,
        gasType: vehicleForm.gasType,
        seatingCapacity: vehicleForm.seatingCapacity,
        pricePerDay: vehicleForm.pricePerDay,
        imageFileId: vehicleForm.imageFileId || '',
        imageFileName: vehicleForm.imageFileName || '',
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
  };
  const handleImageUpload = async (e) => {
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
      const organizedFileName = `vehicle-${vehicleForm.make}-${vehicleForm.model}-${Date.now()}`;
      
      // Upload using your existing file manager with vehicle category
      const result = await uploadFile(file, 'vehicle_image', organizedFileName);
      
      if (result.success) {
        // Get file preview URL using your existing function
        const imageUrl = getFilePreview(result.fileId, 400, 250);
        
        setVehicleForm(prev => ({
          ...prev,
          imageUrl: imageUrl,
          imageFileId: result.fileId, // Store file ID for reference
          imageFileName: organizedFileName
        }));
      } else {
        setError('Failed to upload image: ' + result.error);
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-50 overflow-y-auto">
      <div className="admin-dashboard min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">CarGo Admin</h1>
                  <p className="text-gray-600">Car Rental Management System</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-md"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Admin!</h2>
            <p className="text-gray-600">Here's what's happening with your cargo rental business today.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Cargo</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
                  <p className="text-green-600 text-sm mt-1">+12% from last month</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Active Rentals</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
                  <p className="text-green-600 text-sm mt-1">+3 new today</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Truck className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">156</p>
                  <p className="text-blue-600 text-sm mt-1">+8 new this week</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">$12,450</p>
                  <p className="text-green-600 text-sm mt-1">+18% from last month</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
            {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex space-x-4 mb-6">
              <button 
                onClick={() => setActiveSection('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveSection('vehicles')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === 'vehicles' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Manage Vehicles
              </button>
            </div>

            {activeSection === 'dashboard' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setShowAddVehicleModal(true)}
                    className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Add New Vehicle</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveSection('vehicles')}
                    className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <Car className="h-5 w-5" />
                    <span className="font-medium">Manage Vehicles</span>
                  </button>
                  
                  <button className="flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1">
                    <Eye className="h-5 w-5" />
                    <span className="font-medium">View All Bookings</span>
                  </button>
                  
                  <button className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1">
                    <BarChart3 className="h-5 w-5" />
                    <span className="font-medium">Generate Report</span>
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'vehicles' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Vehicle Management</h3>
                  <button 
                    onClick={() => setShowAddVehicleModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Vehicle</span>
                  </button>
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
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.$id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">                        <div className="relative mb-4">
                          {vehicle.imageFileId ? (
                            <img 
                              src={getFilePreview(vehicle.imageFileId, 300, 200)}
                              alt={`${vehicle.make} ${vehicle.model}`}
                              className="w-full h-32 object-cover rounded-lg"
                              onError={(e) => {
                                // Fallback to imageUrl if file preview fails
                                if (vehicle.imageUrl) {
                                  e.target.src = vehicle.imageUrl;
                                } else {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : vehicle.imageUrl ? (
                            <img 
                              src={vehicle.imageUrl} 
                              alt={`${vehicle.make} ${vehicle.model}`}
                              className="w-full h-32 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          
                          {/* Fallback placeholder */}
                          <div className="w-full h-32 bg-gray-300 rounded-lg flex items-center justify-center" style={{display: (vehicle.imageFileId || vehicle.imageUrl) ? 'none' : 'flex'}}>
                            <Car className="h-8 w-8 text-gray-500" />
                          </div>
                          
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

                    {vehicles.length === 0 && !loading && (
                      <div className="col-span-full text-center py-12">
                        <Car size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 text-lg mb-2">No vehicles added yet</p>
                        <p className="text-gray-500 text-sm">Start by adding your first vehicle to the fleet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Activity & Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Plus className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">New cargo added</p>
                    <p className="text-gray-500 text-sm">Large shipping container - 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">Rental completed</p>
                    <p className="text-gray-500 text-sm">John Doe returned cargo truck - 4 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">New user registered</p>
                    <p className="text-gray-500 text-sm">Sarah Wilson joined - 6 hours ago</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Overview</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Cargo Utilization</span>
                    <span className="font-medium text-gray-900">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Customer Satisfaction</span>
                    <span className="font-medium text-gray-900">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '92%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Revenue Target</span>
                    <span className="font-medium text-gray-900">68%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{width: '68%'}}></div>
                  </div>
                </div>
              </div>
            </div>          </div>
        </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
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
                  </div>
                  {(vehicleForm.imageFileId || vehicleForm.imageUrl) && (
                    <div className="flex-shrink-0">
                      <img 
                        src={vehicleForm.imageFileId ? getFilePreview(vehicleForm.imageFileId, 100, 80) : vehicleForm.imageUrl}
                        alt="Vehicle Preview"
                        className="h-16 w-16 object-cover rounded-md border"
                        onError={(e) => {
                          // Try fallback to imageUrl if file preview fails
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

/*
After you add the missing attributes (imageUrl, description, createdAt, updatedAt) to your database,
replace the vehicleData object with this complete version:

const vehicleData = {
  make: vehicleForm.make,
  model: vehicleForm.model,
  type: vehicleForm.type,
  gasType: vehicleForm.gasType,
  seatingCapacity: vehicleForm.seatingCapacity,
  pricePerDay: vehicleForm.pricePerDay,
  imageUrl: vehicleForm.imageUrl || '',
  imageFileId: vehicleForm.imageFileId || '',
  imageFileName: vehicleForm.imageFileName || '',
  description: vehicleForm.description || '',
  available: vehicleForm.available,
  ...(editingVehicle ? 
    { updatedAt: new Date() } : 
    { createdAt: new Date(), updatedAt: new Date() }
  )
};
*/