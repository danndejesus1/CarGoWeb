import React from 'react';
import { LogOut, Package, Truck, Users, DollarSign, Plus, Eye, Settings, BarChart3 } from 'lucide-react';

const AdminDashboard = () => {
  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminUser');
    window.location.reload();
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
                  <p className="text-gray-600">Cargo Rental Management System</p>
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
          
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1">
                <Plus className="h-5 w-5" />
                <span className="font-medium">Add New Cargo</span>
              </button>
              
              <button className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1">
                <Eye className="h-5 w-5" />
                <span className="font-medium">View All Rentals</span>
              </button>
              
              <button className="flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1">
                <Settings className="h-5 w-5" />
                <span className="font-medium">Manage Users</span>
              </button>
              
              <button className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1">
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Generate Report</span>
              </button>
            </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;