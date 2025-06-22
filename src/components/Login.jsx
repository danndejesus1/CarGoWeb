import React, { useState } from 'react';
import { account } from '../appwrite/config';
import { LogIn, Eye, EyeOff, X } from 'lucide-react';
import AdminDashboard from './Admin/AdminDashboard';
import StaffBookings from './Staff/StaffBookings'; // Import StaffBookings

const Login = ({ onLogin, switchToRegister, onClose, onAdminLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false); // Track staff login

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Admin login
    if (formData.email === 'admin@cargo.com' && formData.password === 'admin123') {
      try {
        localStorage.setItem('adminSession', 'true');
        localStorage.setItem('adminUser', JSON.stringify({
          email: 'admin@cargo.com',
          name: 'Admin',
          role: 'admin'
        }));
        setIsAdminLoggedIn(true);
        setLoading(false);
        return;
      } catch (error) {
        setError('Admin login failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Staff login
    if (formData.email === 'staff@cargo.com' && formData.password === 'staff123') {
      try {
        localStorage.setItem('staffSession', 'true');
        localStorage.setItem('staffUser', JSON.stringify({
          email: 'staff@cargo.com',
          name: 'Staff',
          role: 'staff'
        }));
        setIsStaffLoggedIn(true);
        setLoading(false);
        return;
      } catch (error) {
        setError('Staff login failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const session = await account.createEmailPasswordSession(formData.email, formData.password);
      const user = await account.get();
      onLogin(user);
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If admin is logged in, show the Admin Dashboard
  if (isAdminLoggedIn) {
    return <AdminDashboard />;
  }

  // If staff is logged in, show the Staff Bookings
  if (isStaffLoggedIn) {
    return <StaffBookings />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your CarGo account</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={switchToRegister}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;