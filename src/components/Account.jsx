import React, { useState, useEffect } from 'react';
import { Calendar, LogOut, Edit2, Save, X, User, Phone, MapPin, Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { account } from '../appwrite/config';
import BookingManager from './User/BookingManager';

const Account = ({ user, onLogout, bookings, getVehicleById, cancelBooking }) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userDetails, setUserDetails] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    addressLine: '',
    city: '',
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user preferences when component mounts
  useEffect(() => {
    loadUserDetails();
  }, [user]);

  const loadUserDetails = async () => {
    try {
      if (user?.prefs) {
        setUserDetails({
          firstName: user.prefs.firstName || '',
          middleName: user.prefs.middleName || '',
          lastName: user.prefs.lastName || '',
          phoneNumber: user.prefs.phoneNumber || '',
          addressLine: user.prefs.addressLine || '',
          city: user.prefs.city || '',
          email: user.email || ''
        });
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update user preferences with new details
      await account.updatePrefs({
        ...user.prefs, // Keep existing preferences (like ID verification data)
        firstName: userDetails.firstName,
        middleName: userDetails.middleName,
        lastName: userDetails.lastName,
        phoneNumber: userDetails.phoneNumber,
        addressLine: userDetails.addressLine,
        city: userDetails.city
      });

      // Update display name if first/last name changed
      const newDisplayName = `${userDetails.firstName} ${userDetails.middleName ? userDetails.middleName + ' ' : ''}${userDetails.lastName}`.trim();
      if (newDisplayName && newDisplayName !== user.name) {
        await account.updateName(newDisplayName);
      }

      setSuccess('Profile updated successfully!');
      setEditMode(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = () => {
    setEditMode(false);
    setError('');
    loadUserDetails(); // Reset to original values
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      setPasswordLoading(false);
      return;
    }

    try {
      // Update password
      await account.updatePassword(passwordData.newPassword, passwordData.currentPassword);
      
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordSection(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(''), 3000);
      
    } catch (error) {
      setPasswordError('Failed to update password: ' + error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordSection(false);
    setPasswordError('');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <section className="py-16 px-4 bg-white min-h-screen">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">My Account</h2>
        <div className="max-w-4xl mx-auto">
          
          {/* User Profile Card */}
          <div className="bg-gray-50 p-8 rounded-lg shadow-md mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800">{user?.name}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>              <div className="flex space-x-2 mt-4 md:mt-0">
                {!editMode ? (
                  <>
                    <button 
                      onClick={() => setEditMode(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 flex items-center space-x-2"
                    >
                      <Edit2 size={16} />
                      <span>Edit Profile</span>
                    </button>
                    <button 
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-300 flex items-center space-x-2"
                    >
                      <Lock size={16} />
                      <span>Change Password</span>
                    </button>
                  </>
                ) : (
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-300 flex items-center space-x-2 disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{loading ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-300 flex items-center space-x-2"
                    >
                      <X size={16} />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
                <button 
                  onClick={onLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300 flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>            {/* Success/Error Messages */}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                {passwordSuccess}
              </div>
            )}

            {/* Password Change Section */}
            {showPasswordSection && (
              <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Lock size={20} className="mr-2" />
                  Change Password
                </h4>
                
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        placeholder="Enter your current password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        placeholder="Enter your new password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        placeholder="Confirm your new password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button 
                      type="submit"
                      disabled={passwordLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300 flex items-center space-x-2 disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={handleCancelPasswordChange}
                      className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition duration-300 flex items-center space-x-2"
                    >
                      <X size={16} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* User Details Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-1" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={userDetails.firstName}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-1" />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={userDetails.lastName}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-1" />
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={userDetails.middleName}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter middle name (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail size={16} className="inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={userDetails.email}
                  disabled={true}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  placeholder="Email cannot be changed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone size={16} className="inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={userDetails.phoneNumber}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-1" />
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={userDetails.city}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter city"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-1" />
                  Address Line
                </label>
                <input
                  type="text"
                  name="addressLine"
                  value={userDetails.addressLine}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Street address, building, unit"
                />
              </div>
            </div>
          </div>          {/* Bookings Section */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <BookingManager 
              user={user}
              onUpdateBookings={(updatedBookings) => {
                // Update parent component bookings if needed
                if (typeof cancelBooking === 'function') {
                  // This allows the parent to know about booking updates
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Account;