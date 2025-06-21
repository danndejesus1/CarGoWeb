import React from 'react';
import { useAdminAuth } from './AdminAuthContext';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

const AdminProtectedRoute = () => {
  const { isAdminLoggedIn, isLoading, adminLogout } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="admin-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return <AdminLogin />;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Cargo Rental Admin Panel</h1>
        <button onClick={adminLogout} className="logout-btn">
          Logout
        </button>
      </div>
      <AdminDashboard />
    </div>
  );
};

export default AdminProtectedRoute;