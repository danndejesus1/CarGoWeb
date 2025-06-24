import React, { useEffect, useState } from 'react';
import { databases } from '../../appwrite/config';
import { CheckCircle, XCircle, Loader2, User as UserIcon, ChevronDown } from 'lucide-react';

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

const DB_ID = 'cargo-car-rental';
const COLLECTION_ID = 'users';

const AdminManageUsers = () => {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState(null);
  const [error, setError] = useState('');

  // New: search/filter/sort state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('firstName');
  const [sortDir, setSortDir] = useState('asc');

  // Modal state
  const [modal, setModal] = useState({
    open: false,
    user: null,
    enable: null, // true = enable, false = disable
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await databases.listDocuments(DB_ID, COLLECTION_ID);
      setUserList(res.documents);
    } catch (e) {
      setError('Failed to load users');
    }
    setLoading(false);
  };

  const handleToggleStatus = async (user) => {
    setActionUserId(user.$id);
    setError('');
    try {
      await databases.updateDocument(DB_ID, COLLECTION_ID, user.$id, {
        status: !(user.status === true || user.status === 1)
      });
      await fetchUsers();
    } catch (e) {
      setError('Failed to update user status');
    }
    setActionUserId(null);
  };

  // Handler to open modal
  const handleToggleStatusModal = (user) => {
    setModal({
      open: true,
      user,
      enable: !(user.status === true || user.status === 1),
    });
  };

  // Modal confirm action
  const handleModalConfirm = async () => {
    if (!modal.user) return;
    setActionUserId(modal.user.$id);
    setError('');
    try {
      await databases.updateDocument(DB_ID, COLLECTION_ID, modal.user.$id, {
        status: modal.enable,
      });
      await fetchUsers();
    } catch (e) {
      setError('Failed to update user status');
    }
    setActionUserId(null);
    setModal({ open: false, user: null, enable: null });
  };

  // Modal cancel action
  const handleModalCancel = () => {
    setModal({ open: false, user: null, enable: null });
  };

  // New: filtered and sorted users
  const filteredUsers = userList
    .filter(user => {
      // Status filter
      if (statusFilter === 'enabled' && !(user.status === true || user.status === 1)) return false;
      if (statusFilter === 'disabled' && (user.status === true || user.status === 1)) return false;
      // Search filter (by name or email)
      const searchLower = search.trim().toLowerCase();
      if (!searchLower) return true;
      const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ').toLowerCase();
      return (
        fullName.includes(searchLower) ||
        (user.emailAdd && user.emailAdd.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (sortBy === 'status') {
        valA = a.status === true || a.status === 1 ? 1 : 0;
        valB = b.status === true || b.status === 1 ? 1 : 0;
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Manage Users</h2>
      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-4 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            style={{ minWidth: 200 }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
            <label className="mr-2 text-sm text-gray-600">Sort by</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm bg-transparent outline-none"
            >
              <option value="firstName">First Name</option>
              <option value="lastName">Last Name</option>
              <option value="emailAdd">Email</option>
              <option value="status">Status</option>
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
        </div>
        <button
          onClick={fetchUsers}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <UserIcon className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : (
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b text-left">Profile</th>
              <th className="px-4 py-2 border-b text-left">Name</th>
              <th className="px-4 py-2 border-b text-left">Email</th>
              <th className="px-4 py-2 border-b text-left">Status</th>
              <th className="px-4 py-2 border-b text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.$id} className="border-b">
                <td className="px-4 py-2">
                  {user.profilePicUrl ? (
                    <img
                      src={user.profilePicUrl}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <UserIcon size={20} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  {[user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ')}
                </td>
                <td className="px-4 py-2">{user.emailAdd}</td>
                <td className="px-4 py-2">
                  {user.status === true || user.status === 1 ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle size={16} className="mr-1" /> Enabled
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600">
                      <XCircle size={16} className="mr-1" /> Disabled
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    className={`px-3 py-1 rounded text-white ${user.status === true || user.status === 1 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} transition`}
                    onClick={() => handleToggleStatusModal(user)}
                    disabled={actionUserId === user.$id}
                  >
                    {actionUserId === user.$id ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : user.status === true || user.status === 1 ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal for confirmation */}
      <ConfirmModal
        open={modal.open}
        title={
          modal.enable === true
            ? 'Enable User'
            : modal.enable === false
            ? 'Disable User'
            : ''
        }
        message={
          modal.enable === true
            ? 'Are you sure you want to ENABLE this user?'
            : modal.enable === false
            ? 'Are you sure you want to DISABLE this user?'
            : ''
        }
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        loading={actionUserId === (modal.user && modal.user.$id)}
      />
    </div>
  );
};

export default AdminManageUsers;
