import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { databases } from '../../appwrite/config';
import { Query } from 'appwrite';

const COLORS = ['#22c55e', '#ef4444']; // Green for available, red for unavailable

const AdminAnalytics = () => {
  // Filters
  const [bookingFilter, setBookingFilter] = useState('weekly');
  const [vehicleLocation, setVehicleLocation] = useState('all');
  const [revenueFilter, setRevenueFilter] = useState('quarter');

  // Data states (stubbed, replace with real data)
  const [bookingsData, setBookingsData] = useState([]);
  const [activeUsersData, setActiveUsersData] = useState([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [availableVehiclesByStatus, setAvailableVehiclesByStatus] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [bookingTrendsData, setBookingTrendsData] = useState([]);

  useEffect(() => {
    // Fetch bookings from Appwrite using the same method as AdminBookings.jsx
    const fetchBookings = async () => {
      try {
        const response = await databases.listDocuments(
          'cargo-car-rental',
          'bookings',
          [Query.orderDesc('createdAt')]
        );
        const bookings = response.documents;

        // Group bookings by period (weekly: by day of week)
        if (bookingFilter === 'weekly') {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
          bookings.forEach(b => {
            const d = new Date(b.createdAt);
            const day = days[d.getDay()];
            counts[day]++;
          });
          setBookingsData(days.map(day => ({ period: day, bookings: counts[day] })));
        } else if (bookingFilter === 'monthly') {
          const today = new Date();
          const daysArr = [];
          const counts = {};
          for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const label = `${d.getMonth() + 1}/${d.getDate()}`;
            daysArr.push(label);
            counts[label] = 0;
          }
          bookings.forEach(b => {
            const d = new Date(b.createdAt);
            const label = `${d.getMonth() + 1}/${d.getDate()}`;
            if (counts[label] !== undefined) counts[label]++;
          });
          setBookingsData(daysArr.map(label => ({ period: label, bookings: counts[label] })));
        } else if (bookingFilter === 'yearly') {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const counts = {};
          months.forEach(m => counts[m] = 0);
          bookings.forEach(b => {
            const d = new Date(b.createdAt);
            const m = months[d.getMonth()];
            counts[m]++;
          });
          setBookingsData(months.map(m => ({ period: m, bookings: counts[m] })));
        }
      } catch (err) {
        setBookingsData([]);
      }
    };
    fetchBookings();
  }, [bookingFilter]);

  useEffect(() => {
    // Fetch bookings from Appwrite using the same method as AdminBookings.jsx
    const fetchBookings = async () => {
      try {
        const response = await databases.listDocuments(
          'cargo-car-rental',
          'users'
        );
        const users = response.documents;

        // For active users count, count users with status enabled (true or 1)
        const activeCount = users.filter(
          user => user.status === true || user.status === 1
        ).length;
        setActiveUsersCount(activeCount);

        // For active users chart, group by week for the last 4 weeks
        const now = new Date();
        const weeks = [0, 1, 2, 3].map(i => {
          const start = new Date(now);
          start.setDate(now.getDate() - now.getDay() - i * 7);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setDate(start.getDate() + 7);
          return { start, end };
        }).reverse();

        const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const weekCounts = [0, 0, 0, 0];

        users.forEach(user => {
          const created = new Date(user.$createdAt || user.createdAt);
          weeks.forEach((w, idx) => {
            if (created >= w.start && created < w.end) {
              weekCounts[idx]++;
            }
          });
        });

        setActiveUsersData(weekLabels.map((label, idx) => ({
          date: label,
          users: weekCounts[idx]
        })));
      } catch (err) {
        setActiveUsersCount(0);
        setActiveUsersData([]);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    // Active users data
    setActiveUsersData([
      { date: 'Week 1', users: 120 },
      { date: 'Week 2', users: 135 },
      { date: 'Week 3', users: 150 },
      { date: 'Week 4', users: 156 },
    ]);
    setActiveUsersCount(156);
    // Vehicles by location (donut)
    setAvailableVehiclesByStatus([
      { name: 'Makati', value: 12 },
      { name: 'Taguig', value: 8 },
      { name: 'Quezon City', value: 15 },
      { name: 'Pasig', value: 7 },
      { name: 'Manila', value: 10 },
    ]);
    // Revenue data
    setRevenueData([
      { period: 'Q1', revenue: 32000 },
      { period: 'Q2', revenue: 41000 },
      { period: 'Q3', revenue: 38000 },
      { period: 'Q4', revenue: 47000 },
    ]);
    // Booking trends by vehicle type (stacked bar)
    setBookingTrendsData([
      { month: 'Jan', Sedan: 10, SUV: 8, Van: 5, Pickup: 3 },
      { month: 'Feb', Sedan: 12, SUV: 10, Van: 7, Pickup: 4 },
      { month: 'Mar', Sedan: 15, SUV: 12, Van: 8, Pickup: 6 },
      { month: 'Apr', Sedan: 13, SUV: 11, Van: 6, Pickup: 5 },
    ]);
  }, [bookingFilter, vehicleLocation, revenueFilter]);

  // Fetch vehicles and count available/unavailable
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await databases.listDocuments(
          'cargo-car-rental',
          'vehicles'
        );
        const vehicles = response.documents || [];
        const availableCount = vehicles.filter(v => v.available === true).length;
        const unavailableCount = vehicles.length - availableCount;
        setAvailableVehiclesByStatus([
          { name: 'Available', value: availableCount },
          { name: 'Unavailable', value: unavailableCount }
        ]);
      } catch (err) {
        setAvailableVehiclesByStatus([]);
      }
    };
    fetchVehicles();
  }, []);

  // Revenue analytics: sum totalCost of confirmed/completed bookings
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const response = await databases.listDocuments(
          'cargo-car-rental',
          'bookings',
          [Query.orderDesc('createdAt')]
        );
        const bookings = response.documents || [];
        // Filter only confirmed and completed
        const filtered = bookings.filter(
          b => b.status === 'confirmed' || b.status === 'completed'
        );
        // Group by quarter or annual
        if (revenueFilter === 'quarter') {
          // Group by Q1-Q4 of current year
          const quarters = [0, 0, 0, 0];
          filtered.forEach(b => {
            const d = new Date(b.createdAt || b.$createdAt);
            const q = Math.floor(d.getMonth() / 3); // 0-3
            quarters[q] += Number(b.totalCost) || 0;
          });
          setRevenueData([
            { period: 'Q1', revenue: quarters[0] },
            { period: 'Q2', revenue: quarters[1] },
            { period: 'Q3', revenue: quarters[2] },
            { period: 'Q4', revenue: quarters[3] },
          ]);
        } else if (revenueFilter === 'annual') {
          // Group by year
          const yearMap = {};
          filtered.forEach(b => {
            const d = new Date(b.createdAt || b.$createdAt);
            const year = d.getFullYear();
            yearMap[year] = (yearMap[year] || 0) + (Number(b.totalCost) || 0);
          });
          const years = Object.keys(yearMap).sort();
          setRevenueData(
            years.map(y => ({ period: y, revenue: yearMap[y] }))
          );
        }
      } catch (err) {
        setRevenueData([]);
      }
    };
    fetchRevenue();
  }, [revenueFilter]);

  // Booking trends by vehicle type (from bookings)
  useEffect(() => {
    const fetchBookingTrends = async () => {
      try {
        const response = await databases.listDocuments(
          'cargo-car-rental',
          'bookings',
          [Query.orderDesc('createdAt')]
        );
        const bookings = response.documents || [];
        // Only include confirmed/completed bookings for trends
        const filtered = bookings.filter(
          b => b.status === 'confirmed' || b.status === 'completed'
        );
        // Group by month and vehicle type for the current year
        const now = new Date();
        const year = now.getFullYear();
        // Get last 4 months (including current)
        const monthsArr = [];
        for (let i = 3; i >= 0; i--) {
          const d = new Date(year, now.getMonth() - i, 1);
          monthsArr.push({ label: d.toLocaleString('en-US', { month: 'short' }), month: d.getMonth(), year: d.getFullYear() });
        }
        // Collect all vehicle types present
        const vehicleTypesSet = new Set();
        filtered.forEach(b => {
          if (b.vehicleType) vehicleTypesSet.add(b.vehicleType);
        });
        const vehicleTypes = Array.from(vehicleTypesSet);

        // Build trends data
        const trends = monthsArr.map(({ label, month, year }) => {
          const entry = { month: label };
          vehicleTypes.forEach(type => { entry[type] = 0; });
          filtered.forEach(b => {
            const d = new Date(b.createdAt || b.$createdAt);
            if (d.getFullYear() === year && d.getMonth() === month && b.vehicleType) {
              entry[b.vehicleType] = (entry[b.vehicleType] || 0) + 1;
            }
          });
          return entry;
        });
        setBookingTrendsData(trends);
      } catch (err) {
        setBookingTrendsData([]);
      }
    };
    fetchBookingTrends();
  }, [bookingFilter, vehicleLocation, revenueFilter]);

  // Calculate new users this week
  const [newUsersThisWeek, setNewUsersThisWeek] = useState(0);

  // Calculate total bookings
  const [totalBookings, setTotalBookings] = useState(0);

  // Calculate active rentals (confirmed bookings)
  const [activeRentals, setActiveRentals] = useState(0);

  useEffect(() => {
    const fetchNewUsersThisWeek = async () => {
      try {
        const response = await databases.listDocuments(
          'cargo-car-rental',
          'users'
        );
        const users = response.documents;
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const count = users.filter(user => {
          const created = new Date(user.$createdAt || user.createdAt);
          return created >= startOfWeek && created <= now;
        }).length;
        setNewUsersThisWeek(count);
      } catch (err) {
        setNewUsersThisWeek(0);
      }
    };
    fetchNewUsersThisWeek();
  }, []);

  useEffect(() => {
    const fetchTotalBookingsAndActiveRentals = async () => {
      try {
        const response = await databases.listDocuments(
          'cargo-car-rental',
          'bookings'
        );
        const bookings = response.documents || [];
        setTotalBookings(response.total || bookings.length || 0);
        // Count bookings with status 'confirmed'
        setActiveRentals(bookings.filter(b => b.status === 'confirmed').length);
      } catch (err) {
        setTotalBookings(0);
        setActiveRentals(0);
      }
    };
    fetchTotalBookingsAndActiveRentals();
  }, []);

  const summary = [
    {
      label: 'TOTAL BOOKINGS',
      value: totalBookings,
      change: '+12% from last month',
      icon: (
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="7" width="18" height="10" rx="2" />
            <path d="M16 3v4M8 3v4" />
          </svg>
        </span>
      ),
      color: 'text-blue-600'
    },
    {
      label: 'ACTIVE RENTALS',
      value: activeRentals,
      change: '+3 new today',
      icon: (
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="6" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </span>
      ),
      color: 'text-green-600'
    },
    {
      label: 'TOTAL USERS',
      value: activeUsersCount, // Use actual user count
      change: `+${newUsersThisWeek} new this week`,
      icon: (
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100">
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M6 20v-2a4 4 0 014-4h0a4 4 0 014 4v2" />
          </svg>
        </span>
      ),
      color: 'text-purple-600'
    },
    {
      label: 'MONTHLY REVENUE',
      value: '$12,450',
      change: '+18% from last month',
      icon: (
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l3 3" />
          </svg>
        </span>
      ),
      color: 'text-yellow-600'
    }
  ];

  // Dynamic descriptions for each chart/card, now with data interpretation
  const getDescription = (key) => {
    switch (key) {
      case 'TOTAL BOOKINGS': {
        let trend = summary[0]?.change || '';
        return `There are currently ${totalBookings} bookings in the system. ${trend} This indicates ${totalBookings > 0 ? 'a healthy demand for rentals.' : 'no bookings yet.'}`;
      }
      case 'ACTIVE RENTALS': {
        let trend = summary[1]?.change || '';
        return `There are ${activeRentals} active rentals at the moment. ${trend} ${activeRentals > 0 ? 'This means several vehicles are currently in use.' : 'No vehicles are actively rented right now.'}`;
      }
      case 'TOTAL USERS': {
        let trend = summary[2]?.change || '';
        return `There are ${activeUsersCount} registered users. ${trend} ${newUsersThisWeek > 0 ? 'User growth is ongoing, showing continued interest in the platform.' : 'No new users joined this week.'}`;
      }
      case 'MONTHLY REVENUE': {
        const last = revenueData?.[revenueData.length - 1]?.revenue || 0;
        const prev = revenueData?.[revenueData.length - 2]?.revenue || 0;
        let diff = last - prev;
        let percent = prev ? ((diff / prev) * 100).toFixed(1) : 0;
        let trend = diff > 0 ? `an increase of ${percent}%` : diff < 0 ? `a decrease of ${Math.abs(percent)}%` : 'no change';
        return `The latest revenue is ₱${last.toLocaleString()}. Compared to the previous period, this is ${trend}. This reflects ${diff > 0 ? 'growing' : diff < 0 ? 'declining' : 'stable'} earnings.`;
      }
      case 'Total Bookings Chart': {
        if (!bookingsData.length) return 'No booking data available for the selected period.';
        const max = bookingsData.reduce((a, b) => a.bookings > b.bookings ? a : b, bookingsData[0]);
        const min = bookingsData.reduce((a, b) => a.bookings < b.bookings ? a : b, bookingsData[0]);
        return `Bookings peaked on ${max.period} (${max.bookings} bookings) and were lowest on ${min.period} (${min.bookings} bookings) for the selected period (${bookingFilter}).`;
      }
      case 'Active Users Chart': {
        if (!activeUsersData.length) return 'No active user data available.';
        const max = activeUsersData.reduce((a, b) => a.users > b.users ? a : b, activeUsersData[0]);
        const min = activeUsersData.reduce((a, b) => a.users < b.users ? a : b, activeUsersData[0]);
        return `User signups peaked in ${max.date} (${max.users} users) and were lowest in ${min.date} (${min.users} users) over the last four weeks.`;
      }
      case 'Available Vehicles': {
        if (!availableVehiclesByStatus.length) return 'No vehicle data available.';
        const available = availableVehiclesByStatus.find(v => v.name === 'Available')?.value || 0;
        const unavailable = availableVehiclesByStatus.find(v => v.name === 'Unavailable')?.value || 0;
        const total = available + unavailable;
        const percent = total ? Math.round((available / total) * 100) : 0;
        return `${available} out of ${total} vehicles (${percent}%) are currently available for booking.`;
      }
      case 'Revenue Earned': {
        if (!revenueData.length) return 'No revenue data available.';
        const last = revenueData[revenueData.length - 1];
        const prev = revenueData[revenueData.length - 2];
        let diff = last && prev ? last.revenue - prev.revenue : 0;
        let percent = prev && prev.revenue ? ((diff / prev.revenue) * 100).toFixed(1) : 0;
        let trend = diff > 0 ? `an increase of ${percent}%` : diff < 0 ? `a decrease of ${Math.abs(percent)}%` : 'no change';
        return `Revenue for ${last?.period || ''} is ₱${last?.revenue?.toLocaleString() || 0}. Compared to the previous period, this is ${trend}.`;
      }
      case 'Booking Trends by Vehicle Type': {
        if (!bookingTrendsData.length) return 'No booking trends data available.';
        // Find most popular vehicle type in the latest month
        const last = bookingTrendsData[bookingTrendsData.length - 1];
        const types = Object.entries(last).filter(([k]) => k !== 'month');
        if (!types.length) return 'No vehicle type data for the latest month.';
        const [topType, topCount] = types.reduce((a, b) => (a[1] > b[1] ? a : b));
        return `In ${last.month}, the most booked vehicle type was ${topType} (${topCount} bookings). This helps identify customer preferences.`;
      }
      default:
        return '';
    }
  };

  // Track which description is open
  const [openDescKey, setOpenDescKey] = useState(null);

  return (
    <div className="space-y-10">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {summary.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow p-5 flex items-center gap-4 border border-gray-100 cursor-pointer hover:bg-blue-50 transition"
            onClick={() =>
              setOpenDescKey(openDescKey === item.label ? null : item.label)
            }
            title="Click for more info"
          >
            <div>{item.icon}</div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase">{item.label}</div>
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-green-500 mt-1">{item.change}</div>
              {openDescKey === item.label && (
                <div className="mt-2 text-xs text-gray-700 bg-blue-50 rounded p-2">{getDescription(item.label)}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total Bookings */}
      <div
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 cursor-pointer hover:bg-blue-50 transition"
        onClick={() =>
          setOpenDescKey(openDescKey === 'Total Bookings Chart' ? null : 'Total Bookings Chart')
        }
        title="Click for more info"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Total Bookings</h3>
          <div className="space-x-2">
            <button onClick={e => { e.stopPropagation(); setBookingFilter('weekly'); }} className={`px-3 py-1 rounded ${bookingFilter === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Weekly</button>
            <button onClick={e => { e.stopPropagation(); setBookingFilter('monthly'); }} className={`px-3 py-1 rounded ${bookingFilter === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Monthly</button>
            <button onClick={e => { e.stopPropagation(); setBookingFilter('yearly'); }} className={`px-3 py-1 rounded ${bookingFilter === 'yearly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Yearly</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bookingsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bookingsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {openDescKey === 'Total Bookings Chart' && (
          <div className="mt-4 text-sm text-gray-700 bg-blue-50 rounded p-3">{getDescription('Total Bookings Chart')}</div>
        )}
      </div>

      {/* Active Users */}
      <div
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 cursor-pointer hover:bg-blue-50 transition"
        onClick={() =>
          setOpenDescKey(openDescKey === 'Active Users Chart' ? null : 'Active Users Chart')
        }
        title="Click for more info"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Active Users</h3>
          <span className="text-2xl font-bold text-blue-600">{activeUsersCount}</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={activeUsersData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        {openDescKey === 'Active Users Chart' && (
          <div className="mt-4 text-sm text-gray-700 bg-blue-50 rounded p-3">{getDescription('Active Users Chart')}</div>
        )}
      </div>

      {/* Available Vehicles */}
      <div
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 cursor-pointer hover:bg-blue-50 transition"
        onClick={() =>
          setOpenDescKey(openDescKey === 'Available Vehicles' ? null : 'Available Vehicles')
        }
        title="Click for more info"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Available Vehicles</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={availableVehiclesByStatus}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              label
            >
              {availableVehiclesByStatus.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        {openDescKey === 'Available Vehicles' && (
          <div className="mt-4 text-sm text-gray-700 bg-blue-50 rounded p-3">{getDescription('Available Vehicles')}</div>
        )}
      </div>

      {/* Revenue Earned */}
      <div
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 cursor-pointer hover:bg-blue-50 transition"
        onClick={() =>
          setOpenDescKey(openDescKey === 'Revenue Earned' ? null : 'Revenue Earned')
        }
        title="Click for more info"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Revenue Earned</h3>
          <div className="space-x-2">
            <button onClick={e => { e.stopPropagation(); setRevenueFilter('quarter'); }} className={`px-3 py-1 rounded ${revenueFilter === 'quarter' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Quarter</button>
            <button onClick={e => { e.stopPropagation(); setRevenueFilter('annual'); }} className={`px-3 py-1 rounded ${revenueFilter === 'annual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Annual</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip formatter={value => `₱${Number(value).toLocaleString()}`} />
            <Bar dataKey="revenue" fill="#f59e42" />
          </BarChart>
        </ResponsiveContainer>
        {openDescKey === 'Revenue Earned' && (
          <div className="mt-4 text-sm text-gray-700 bg-blue-50 rounded p-3">{getDescription('Revenue Earned')}</div>
        )}
      </div>

      {/* Booking Trends by Vehicle Type */}
      <div
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 cursor-pointer hover:bg-blue-50 transition"
        onClick={() =>
          setOpenDescKey(openDescKey === 'Booking Trends by Vehicle Type' ? null : 'Booking Trends by Vehicle Type')
        }
        title="Click for more info"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Trends by Vehicle Type</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={bookingTrendsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {/* Dynamically render bars for each vehicle type */}
            {bookingTrendsData.length > 0 &&
              Object.keys(bookingTrendsData[0] || {})
                .filter(key => key !== 'month')
                .map((type, idx) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    stackId="a"
                    fill={['#2563eb', '#22c55e', '#f59e42', '#a855f7', '#f43f5e', '#0ea5e9'][idx % 6]}
                  />
                ))}
          </BarChart>
        </ResponsiveContainer>
        {openDescKey === 'Booking Trends by Vehicle Type' && (
          <div className="mt-4 text-sm text-gray-700 bg-blue-50 rounded p-3">{getDescription('Booking Trends by Vehicle Type')}</div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
