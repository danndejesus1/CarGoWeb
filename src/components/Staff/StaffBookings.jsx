import React from 'react';
import AdminBookings from '../Admin/AdminBookings';

const StaffBookings = () => {
  const handleLogout = () => {
    localStorage.removeItem('staffSession');
    localStorage.removeItem('staffUser');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Dashboard Header */}
      <header className="bg-blue-700 text-white py-4 shadow">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">CarGo Staff Dashboard</h1>
            <span className="text-sm font-medium bg-blue-800 px-3 py-1 rounded">Staff</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-700 px-3 py-1 rounded hover:bg-blue-100 font-medium transition"
          >
            Logout
          </button>
        </div>
      </header>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Manage Bookings</h2>
          <AdminBookings />
        </div>
      </main>
    </div>
  );
};

export default StaffBookings;
