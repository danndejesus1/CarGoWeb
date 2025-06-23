import React, { useState } from 'react';
import { account, storage, STORAGE_BUCKET_ID, databases } from '../appwrite/config';
import { uploadFile, validateFile, FILE_CATEGORIES } from '../appwrite/fileManager';
import { testStorageConnection } from '../appwrite/storageDebug';
import { UserPlus, Eye, EyeOff, X } from 'lucide-react';
import { ID } from 'appwrite';

const DB_ID = 'cargo-car-rental'; // Your database ID
const USERS_COLLECTION_ID = 'users'; // Your users collection ID

const Register = ({ onRegister, switchToLogin, onClose }) => {  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    addressLine: '',
    city: '',
    password: '',
    confirmPassword: ''
  });
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Use the file manager validation
      const validation = validateFile(file, FILE_CATEGORIES.USER_ID);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      
      setIdFile(file);
      setError('');
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setIdPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setIdPreview(null);
      }
    }
  };
  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (!idFile) {
      setError('Please upload your ID for verification');
      return false;
    }
    return true;
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Step 1: Check for existing session and logout if necessary
      try {
        const currentUser = await account.get();
        if (currentUser) {
          console.log('Existing session found, logging out...');
          await account.deleteSessions();
        }
      } catch (error) {
        // No existing session, continue
        console.log('No existing session found, proceeding...');
      }      // Step 2: Create user account
      const fullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();
      const user = await account.create(
        ID.unique(),
        formData.email,
        formData.password,
        fullName
      );

      // Step 3: Upload ID file to storage using file manager
      let uploadResult = null;
      let profilePicUrl = '';
      if (idFile) {
        // Test storage connection first
        console.log('Testing storage connection...');
        const storageTest = await testStorageConnection();
        if (!storageTest.success) {
          setError(`Storage connection failed: ${storageTest.error.message}`);
          setLoading(false);
          return;
        }
        
        console.log('Attempting to upload file to bucket:', STORAGE_BUCKET_ID);
        uploadResult = await uploadFile(idFile, FILE_CATEGORIES.USER_ID, user.$id);
        
        if (!uploadResult.success) {
          console.error('File upload failed:', uploadResult.error);
          setError(`File upload failed: ${uploadResult.error}`);
          setLoading(false);
          return;
        }
        
        console.log('File uploaded successfully:', uploadResult);
        
        if (uploadResult.fileId) {
          // Store only the fileId in the profilePicUrl field
          profilePicUrl = uploadResult.fileId;
        }
      }

      // --- Add user to database collection ---
      try {
        await databases.createDocument(
          DB_ID,
          USERS_COLLECTION_ID,
          user.$id,
          {
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            emailAdd: formData.email,
            phoneNumber: formData.phoneNumber,
            addressLine: formData.addressLine,
            city: formData.city,
            status: true,
            profilePicUrl // This is just the fileId
          }
        );
      } catch (dbErr) {
        setError('Failed to create user in DB: ' + (dbErr.message || dbErr));
        console.error('Failed to create user in DB:', dbErr);
        alert('Failed to create user in DB: ' + (dbErr.message || dbErr));
      }
      // --- End add user to database ---

      // Step 3: Login the user with new credentials
      await account.createEmailPasswordSession(formData.email, formData.password);// Step 4: Get user data and add ID file reference
      const userData = await account.get();
        // Store file information in user preferences
      if (uploadResult && uploadResult.success) {
        try {
          await account.updatePrefs({
            // Personal Information
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            phoneNumber: formData.phoneNumber,
            addressLine: formData.addressLine,
            city: formData.city,
            // ID Verification Information
            idFileId: uploadResult.fileId,
            idFileName: uploadResult.fileName,
            idOriginalName: uploadResult.originalName,
            idFileType: uploadResult.fileType,
            idFileSize: uploadResult.fileSize,
            idVerificationStatus: 'pending',
            idUploadDate: new Date().toISOString(),
            fileCategory: uploadResult.category
          });
          console.log('User preferences updated with personal info and ID file info');
        } catch (prefsError) {
          console.error('Failed to save user data:', prefsError);
        }
      }

      onRegister(userData);
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
          <p className="text-gray-600">Join CarGo today</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Middle name (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line *
            </label>
            <input
              type="text"
              name="addressLine"
              value={formData.addressLine}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Street address, building, unit"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your city"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                placeholder="Confirm your password"
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
            </div>          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Verification *
            </label>
            <div className="mt-1">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload a clear photo of your government ID (Driver's License, Passport, etc.). Accepted formats: JPEG, PNG, PDF (Max 5MB)
              </p>
                {idPreview && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <img 
                    src={idPreview} 
                    alt="ID Preview" 
                    className="w-full max-w-[200px] h-24 object-cover rounded-md border border-gray-300"
                  />
                </div>
              )}
              
              {idFile && !idPreview && (
                <div className="mt-3 p-2 bg-gray-50 rounded-md border border-gray-300">
                  <p className="text-sm text-gray-600">
                    📄 {idFile.name} ({(idFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={switchToLogin}
              className="text-blue\-600 hover:text-blue-800 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;