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

  return (
    <div className="space-y-10">
      {/* Total Bookings */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Total Bookings</h3>
          <div className="space-x-2">
            <button onClick={() => setBookingFilter('weekly')} className={`px-3 py-1 rounded ${bookingFilter === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Weekly</button>
            <button onClick={() => setBookingFilter('monthly')} className={`px-3 py-1 rounded ${bookingFilter === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Monthly</button>
            <button onClick={() => setBookingFilter('yearly')} className={`px-3 py-1 rounded ${bookingFilter === 'yearly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Yearly</button>
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
      </div>

      {/* Active Users */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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
      </div>

      {/* Available Vehicles */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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
      </div>

      {/* Revenue Earned */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Revenue Earned</h3>
          <div className="space-x-2">
            <button onClick={() => setRevenueFilter('quarter')} className={`px-3 py-1 rounded ${revenueFilter === 'quarter' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Quarter</button>
            <button onClick={() => setRevenueFilter('annual')} className={`px-3 py-1 rounded ${revenueFilter === 'annual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Annual</button>
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
      </div>

      {/* Booking Trends by Vehicle Type */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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
              Object.keys(bookingTrendsData[0])
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
      </div>
    </div>
  );
};

export default AdminAnalytics;
