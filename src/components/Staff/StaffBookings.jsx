import React, { useState } from 'react';
import AdminBookings from '../Admin/AdminBookings';
import GenerateReport from '../Admin/GenerateReport';
import FeedBackandRatings from '../Admin/FeedBackandRatings';
import AdminManageUsers from '../Admin/AdminManageUsers';

const NAV_ITEMS = [
  { key: 'bookings', label: 'Manage Bookings' },
  { key: 'reports', label: 'Generate Reports' },
  { key: 'feedback', label: 'Feedback & Ratings' },
  { key: 'users', label: 'Manage Users' },
];

const StaffBookings = () => {
  const [activeSection, setActiveSection] = useState('bookings');

  const handleLogout = () => {
    localStorage.removeItem('staffSession');
    localStorage.removeItem('staffUser');
    window.location.reload();
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'bookings':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Bookings</h2>
            <AdminBookings />
          </div>
        );
      case 'reports':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Generate Reports</h2>
            <GenerateReport generatedBy="Staff" />
          </div>
        );
      case 'feedback':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Feedback & Ratings</h2>
            <FeedBackandRatings />
          </div>
        );
      case 'users':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Users</h2>
            <AdminManageUsers />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-800 text-white flex flex-col py-6 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">CarGo Staff</h1>
          <span className="text-xs font-medium bg-blue-900 px-2 py-1 rounded">Staff Dashboard</span>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {NAV_ITEMS.map(item => (
              <li key={item.key}>
                <button
                  className={`w-full text-left px-3 py-2 rounded transition ${
                    activeSection === item.key
                      ? 'bg-white text-blue-800 font-semibold'
                      : 'hover:bg-blue-700'
                  }`}
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-8 bg-white text-blue-800 px-3 py-2 rounded hover:bg-blue-100 font-medium transition"
        >
          Logout
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        {renderSection()}
      </main>
    </div>
  );
};

export default StaffBookings;
