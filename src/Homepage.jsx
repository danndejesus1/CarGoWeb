import React, { useState, useEffect } from 'react';
import { Calendar, Car, Users, Fuel, Search, User, LogOut, X } from 'lucide-react';
import { account } from './appwrite/config';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

const HomePage = () => {
  // State management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filters, setFilters] = useState({
    make: '',
    type: '',
    gasType: '',
    seatingCapacity: '',
    pickupDate: '',
    returnDate: ''
  });
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [contactMessage, setContactMessage] = useState('');
  const [activeSection, setActiveSection] = useState('home');

  // Mock data - in real app, this would come from API
  const mockVehicles = [
    {
      id: '1',
      make: 'Toyota',
      model: 'Vios',
      type: 'Sedan',
      gasType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 1500,
      imageUrl: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=400&h=250&fit=crop'
    },
    {
      id: '2',
      make: 'Honda',
      model: 'CRV',
      type: 'SUV',
      gasType: 'Diesel',
      seatingCapacity: 7,
      pricePerDay: 2500,
      imageUrl: 'https://images.unsplash.com/photo-1549317336-206569e8475c?w=400&h=250&fit=crop'
    },
    {
      id: '3',
      make: 'Toyota',
      model: 'Fortuner',
      type: 'SUV',
      gasType: 'Diesel',
      seatingCapacity: 7,
      pricePerDay: 3000,
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop'
    },
    {
      id: '4',
      make: 'Honda',
      model: 'City',
      type: 'Sedan',
      gasType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 1800,
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=250&fit=crop'
    }
  ];

  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com'
  };

  const mockBookings = [
    {
      id: '1',
      vehicleId: '1',
      pickupDate: '2025-07-01',
      returnDate: '2025-07-05',
      status: 'confirmed'
    },
    {
      id: '2',
      vehicleId: '2',
      pickupDate: '2025-07-15',
      returnDate: '2025-07-20',
      status: 'pending'
    }
  ];
  // Initialize data
  useEffect(() => {
    setVehicles(mockVehicles);
    setFilteredVehicles(mockVehicles);
    
    // Check real authentication status
    const checkAuth = async () => {
      try {
        const userData = await account.get();
        setIsLoggedIn(true);
        setUser(userData);
        setBookings(mockBookings);
      } catch (error) {
        // User not logged in
        setIsLoggedIn(false);
        setUser(null);
        setBookings([]);
      }
    };
    
    checkAuth();
  }, []);

  // Filter vehicles
  const applyFilters = () => {
    let filtered = vehicles;

    if (filters.make) {
      filtered = filtered.filter(v => v.make === filters.make);
    }
    if (filters.type) {
      filtered = filtered.filter(v => v.type === filters.type);
    }
    if (filters.gasType) {
      filtered = filtered.filter(v => v.gasType === filters.gasType);
    }
    if (filters.seatingCapacity) {
      filtered = filtered.filter(v => v.seatingCapacity === parseInt(filters.seatingCapacity));
    }

    setFilteredVehicles(filtered);
  };  // Handle booking
  const handleBookVehicle = (vehicle) => {
    if (!isLoggedIn) {
      showLoginModal();
      return;
    }
    setSelectedVehicle(vehicle);
    setShowBookingModal(true);
  };

  // Handle contact form
  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setContactMessage('Thank you for your message! We will get back to you soon.');
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactMessage(''), 5000);
    }, 500);
  };  // Handle logout
  const handleLogout = async () => {
    try {
      await account.deleteSessions();
      setIsLoggedIn(false);
      setUser(null);
      setBookings([]);
      setActiveSection('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle showing register modal (logout first if needed)
  const showRegisterModal = async () => {
    if (isLoggedIn) {
      await handleLogout();
    }
    setAuthMode('register');
    setShowAuth(true);
  };

  // Handle showing login modal (logout first if needed)
  const showLoginModal = async () => {
    if (isLoggedIn) {
      await handleLogout();
    }
    setAuthMode('login');
    setShowAuth(true);
  };

  // Handle login success
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setShowAuth(false);
    setBookings(mockBookings);
  };

  // Handle register success
  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setShowAuth(false);
    setBookings(mockBookings);
  };

  // Cancel booking
  const cancelBooking = (bookingId) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    }
  };

  // Get vehicle by ID
  const getVehicleById = (id) => {
    return vehicles.find(v => v.id === id);
  };

  // Navigation component
  const Navigation = () => (
    <header className="bg-white shadow-md p-4 sticky top-0 z-50">
      <nav className="container mx-auto flex justify-between items-center">
        <button 
          onClick={() => setActiveSection('home')}
          className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
        >
          CarGo
        </button>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setActiveSection('home')}
            className={`px-3 py-2 rounded-md transition-colors ${activeSection === 'home' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          >
            Home
          </button>
          <button 
            onClick={() => setActiveSection('vehicles')}
            className={`px-3 py-2 rounded-md transition-colors ${activeSection === 'vehicles' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          >
            Vehicles
          </button>
          <button 
            onClick={() => setActiveSection('contact')}
            className={`px-3 py-2 rounded-md transition-colors ${activeSection === 'contact' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          >
            Contact
          </button>
          {isLoggedIn && (
            <button 
              onClick={() => setActiveSection('account')}
              className={`px-3 py-2 rounded-md transition-colors ${activeSection === 'account' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Account
            </button>
          )}
          {isLoggedIn ? (
            <button 
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300 flex items-center space-x-2"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>          ) : (
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  setAuthMode('login');
                  setShowAuth(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 flex items-center space-x-2"
              >
                <User size={16} />
                <span>Login</span>
              </button>
              <button 
                onClick={() => {
                  setAuthMode('register');
                  setShowAuth(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );

  // Hero section
  const HeroSection = () => (
    <section className="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-20 px-4 text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Your Journey Starts Here</h1>
      <p className="text-xl md:text-2xl mb-8">Rent a car with ease and explore the world.</p>
      <button 
        onClick={() => setActiveSection('vehicles')}
        className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition duration-300"
      >
        Browse Vehicles
      </button>
    </section>
  );

  // Vehicle filters
  const VehicleFilters = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
        <Search className="mr-2" size={20} />
        Filter Vehicles
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
          <select 
            value={filters.make}
            onChange={(e) => setFilters({...filters, make: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Makes</option>
            <option value="Toyota">Toyota</option>
            <option value="Honda">Honda</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Car Type</label>
          <select 
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gas Type</label>
          <select 
            value={filters.gasType}
            onChange={(e) => setFilters({...filters, gasType: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Gas Types</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
          <select 
            value={filters.seatingCapacity}
            onChange={(e) => setFilters({...filters, seatingCapacity: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Any Capacity</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="7">7</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
          <input 
            type="date"
            value={filters.pickupDate}
            onChange={(e) => setFilters({...filters, pickupDate: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
          <input 
            type="date"
            value={filters.returnDate}
            onChange={(e) => setFilters({...filters, returnDate: e.target.value})}
            min={filters.pickupDate || new Date().toISOString().split('T')[0]}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="mt-6 text-right">
        <button 
          onClick={applyFilters}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300 flex items-center space-x-2 ml-auto"
        >
          <Search size={16} />
          <span>Apply Filter</span>
        </button>
      </div>
    </div>
  );

  // Vehicle card component
  const VehicleCard = ({ vehicle }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-xl">
      <div className="relative">
        <img 
          src={vehicle.imageUrl} 
          alt={`${vehicle.make} ${vehicle.model}`} 
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          {vehicle.type}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{vehicle.make} {vehicle.model}</h3>
        <div className="flex items-center space-x-4 text-gray-600 text-sm mb-4">
          <div className="flex items-center">
            <Car size={16} className="mr-1" />
            <span>{vehicle.type}</span>
          </div>
          <div className="flex items-center">
            <Fuel size={16} className="mr-1" />
            <span>{vehicle.gasType}</span>
          </div>
          <div className="flex items-center">
            <Users size={16} className="mr-1" />
            <span>{vehicle.seatingCapacity} seats</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-600">₱{vehicle.pricePerDay.toLocaleString()}/day</span>
          <button 
            onClick={() => handleBookVehicle(vehicle)}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition duration-300 font-semibold"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );

  // Vehicles section
  const VehiclesSection = () => (
    <section className="py-16 px-4 bg-gray-50 min-h-screen">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Our Featured Vehicles</h2>
        <VehicleFilters />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Car size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No vehicles found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  // Contact section
  const ContactSection = () => (
    <section className="py-16 px-4 bg-white min-h-screen">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Get In Touch</h2>
        <div className="max-w-md mx-auto bg-gray-50 p-8 rounded-lg shadow-md">
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text"
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea 
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-32"
                required
              ></textarea>
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 font-semibold"
            >
              Send Message
            </button>
          </form>
          {contactMessage && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-center">
              {contactMessage}
            </div>
          )}
        </div>
      </div>
    </section>
  );

  // Account section
  const AccountSection = () => (
    <section className="py-16 px-4 bg-white min-h-screen">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">My Account</h2>
        <div className="max-w-4xl mx-auto">
          {/* User profile */}
          <div className="bg-gray-50 p-8 rounded-lg shadow-md mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{user?.name}</h3>
                <p className="text-gray-600">{user?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="mt-4 md:mt-0 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300 flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Bookings */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">My Bookings</h3>
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-gray-600 text-center py-8">You have no bookings yet.</p>
              ) : (
                bookings.map(booking => {
                  const vehicle = getVehicleById(booking.vehicleId);
                  return (
                    <div key={booking.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <div className="flex flex-col md:flex-row justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold">{vehicle?.make} {vehicle?.model}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-1" />
                              <span>Pickup: {booking.pickupDate}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-1" />
                              <span>Return: {booking.returnDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 md:mt-0">
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          {booking.status === 'pending' && (
                            <button 
                              onClick={() => cancelBooking(booking.id)}
                              className="text-sm text-red-600 hover:text-red-800 px-2 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Booking modal
  const BookingModal = () => (
    showBookingModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Book {selectedVehicle?.make} {selectedVehicle?.model}</h3>
            <button 
              onClick={() => setShowBookingModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
              <input 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
              <input 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-md">
              <p className="text-lg font-semibold text-blue-800">
                ₱{selectedVehicle?.pricePerDay.toLocaleString()}/day
              </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowBookingModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-300"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert('Booking confirmed! (This is a demo)');
                  setShowBookingModal(false);
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Footer
  const Footer = () => (
    <footer className="bg-gray-800 text-white py-8 px-4">
      <div className="container mx-auto text-center">
        <p>&copy; 2025 CarGo Application. All rights reserved.</p>
        <div className="mt-4 space-x-4">
          <button className="text-gray-400 hover:text-white transition-colors">Privacy Policy</button>
          <button className="text-gray-400 hover:text-white transition-colors">Terms of Service</button>
        </div>
      </div>
    </footer>
  );
  // Main render
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navigation />
      
      {activeSection === 'home' && (
        <>
          <HeroSection />
          <VehiclesSection />
        </>
      )}
      
      {activeSection === 'vehicles' && <VehiclesSection />}
      {activeSection === 'contact' && <ContactSection />}
      {activeSection === 'account' && isLoggedIn && <AccountSection />}
      
      <Footer />
      <BookingModal />
      
      {/* Authentication Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50">
          {authMode === 'login' ? (
            <Login 
              onLogin={handleLoginSuccess} 
              switchToRegister={() => setAuthMode('register')}
              onClose={() => setShowAuth(false)}
            />
          ) : (
            <Register 
              onRegister={handleRegisterSuccess} 
              switchToLogin={() => setAuthMode('login')}
              onClose={() => setShowAuth(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
