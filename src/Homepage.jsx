import React, { useState, useEffect } from 'react';
import { Calendar, Car, Users, Fuel, Search, User, LogOut, X } from 'lucide-react';
import { account, databases } from './appwrite/config';
import { getFilePreview } from './appwrite/fileManager';
import Login from './components/Login';
import Register from './components/Register';
import Account from './components/Account';
import BookingModal from './components/User/BookingModal';
import VehicleFilters from './components/VehicleFilters';
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
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [contactMessage, setContactMessage] = useState('');
  const [activeSection, setActiveSection] = useState('home');

  // Function to get direct file URL (same as admin dashboard)
  const getDirectFileUrl = (fileId) => {
    if (!fileId) return null;
    return `https://fra.cloud.appwrite.io/v1/storage/buckets/cargo-files/files/${fileId}/view?project=685682ba00095008cb7d`;
  };

  // Vehicle Image Component for consistent loading
  const VehicleImage = ({ vehicle, className = "w-full h-48 object-cover" }) => {
    const [showPlaceholder, setShowPlaceholder] = useState(false);
    
    const getImageSrc = () => {
      if (vehicle.imageFileId) {
        return getDirectFileUrl(vehicle.imageFileId);
      }
      if (vehicle.imageUrl) {
        return vehicle.imageUrl;
      }
      return 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=400&h=250&fit=crop';
    };

    const imageSrc = getImageSrc();

    if (showPlaceholder && !vehicle.imageUrl) {
      return (
        <div className={`bg-gray-300 flex items-center justify-center ${className}`}>
          <Car className="h-8 w-8 text-gray-500" />
        </div>
      );
    }

    return (
      <img 
        src={imageSrc}
        alt={`${vehicle.make} ${vehicle.model}`}
        className={className}
        onLoad={() => {
          console.log(`✅ Homepage image loaded: ${vehicle.make} ${vehicle.model}`);
        }}
        onError={(e) => {
          console.error(`❌ Homepage image failed: ${vehicle.make} ${vehicle.model}`);
          console.error(`Failed URL: ${e.target.src}`);
          console.error(`FileID: ${vehicle.imageFileId}`);
          
          // Try fallback to generic imageUrl if it's different
          if (vehicle.imageUrl && e.target.src !== vehicle.imageUrl) {
            e.target.src = vehicle.imageUrl;
          } else {
            setShowPlaceholder(true);
          }
        }}
      />
    );
  };

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
  ];  // Initialize data
  useEffect(() => {
    loadVehiclesFromDatabase();
    
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
  // Load vehicles from database
  const loadVehiclesFromDatabase = async () => {
    try {
      const response = await databases.listDocuments(
        'cargo-car-rental',
        'vehicles'
      );
      
      console.log('Homepage loaded vehicles:', response.documents);
      
      // Transform database documents to match expected format
      const dbVehicles = response.documents.map(doc => ({
        id: doc.$id,
        make: doc.make,
        model: doc.model,
        type: doc.type,
        gasType: doc.gasType,
        seatingCapacity: doc.seatingCapacity,
        pricePerDay: doc.pricePerDay,
        imageFileId: doc.imageFileId, // Keep the file ID for direct access
        imageUrl: doc.imageUrl || 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=400&h=250&fit=crop', // Fallback URL
        available: doc.available !== false // Handle both true/false and undefined
      }));
      
      setVehicles(dbVehicles);
      
      // Apply initial filter to show only available vehicles
      const availableVehicles = dbVehicles.filter(vehicle => vehicle.available);
      setFilteredVehicles(availableVehicles);
    } catch (error) {
      console.error('Error loading vehicles from database:', error);
      // Fallback to mock data if database fails
      setVehicles(mockVehicles);
      setFilteredVehicles(mockVehicles);
    }
  };
  // Handle booking
  const handleBookVehicle = (vehicle) => {
    if (!isLoggedIn) {
      showLoginModal();
      return;
    }
    setSelectedVehicle(vehicle);
    setShowBookingModal(true);
  };

  // Handle booking completion
  const handleBookingComplete = (bookingResponse) => {
    console.log('Booking completed:', bookingResponse);
    
    // Add to local bookings state
    const newBooking = {
      id: bookingResponse.$id,
      vehicleId: selectedVehicle.id,
      pickupDate: bookingResponse.pickupDate,
      returnDate: bookingResponse.returnDate,
      status: 'pending',
      totalCost: bookingResponse.totalCost,
      createdAt: bookingResponse.createdAt
    };
    
    setBookings(prev => [newBooking, ...prev]);
    
    // Show success message
    alert('Booking confirmed! You can view your booking in the Account section.');
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
            Book Vehicles
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

  // New informational section for homepage
  const HomeServicesSection = () => (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Our Services</h2>

        {/* Services overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="rounded-full bg-blue-100 p-4 mx-auto w-20 h-20 flex items-center justify-center mb-4">
              <Car className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Premium Vehicles</h3>
            <p className="text-gray-600">
              Choose from our wide range of well-maintained vehicles, from compact sedans to spacious SUVs.
              All our cars are regularly serviced and sanitized for your safety and comfort.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="rounded-full bg-blue-100 p-4 mx-auto w-20 h-20 flex items-center justify-center mb-4">
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Flexible Booking</h3>
            <p className="text-gray-600">
              Book online in minutes with our easy-to-use platform. Enjoy flexible pickup and return options,
              with the ability to modify or cancel your reservation as needed.
            </p>
          </div>
          
          <div
            className="bg-white rounded-lg shadow-md p-6 text-center cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveSection('contact')}
            tabIndex={0}
            role="button"
            aria-label="Contact Us"
            onKeyPress={e => {
              if (e.key === 'Enter' || e.key === ' ') setActiveSection('contact');
            }}
          >
            <div className="rounded-full bg-blue-100 p-4 mx-auto w-20 h-20 flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Contact Us</h3>
            <p className="text-gray-600">
              Our customer service team is available around the clock to assist with any inquiries or issues.
              Roadside assistance is included with every rental for your peace of mind.
            </p>
          </div>
        </div>
        
        {/* Vehicle categories */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Our Fleet</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 bg-blue-100 flex items-center justify-center">
              <Car className="h-16 w-16 text-blue-600" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sedans</h3>
              <p className="text-gray-600 mb-4">
                Comfortable and fuel-efficient cars perfect for city driving and small families.
              </p>
              <div className="text-sm text-gray-700">
                <div className="flex justify-between mb-1">
                  <span>Passengers:</span>
                  <span>4-5 people</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Luggage:</span>
                  <span>2-3 bags</span>
                </div>
                <div className="flex justify-between">
                  <span>Starting at:</span>
                  <span className="font-semibold">₱1,500/day</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 bg-green-100 flex items-center justify-center">
              <Car className="h-16 w-16 text-green-600" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">SUVs</h3>
              <p className="text-gray-600 mb-4">
                Spacious vehicles with higher seating position and ample storage for adventures.
              </p>
              <div className="text-sm text-gray-700">
                <div className="flex justify-between mb-1">
                  <span>Passengers:</span>
                  <span>5-7 people</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Luggage:</span>
                  <span>3-5 bags</span>
                </div>
                <div className="flex justify-between">
                  <span>Starting at:</span>
                  <span className="font-semibold">₱2,500/day</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 bg-yellow-100 flex items-center justify-center">
              <Car className="h-16 w-16 text-yellow-600" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Premium</h3>
              <p className="text-gray-600 mb-4">
                Luxury vehicles featuring top-tier comfort, performance, and the latest technology.
              </p>
              <div className="text-sm text-gray-700">
                <div className="flex justify-between mb-1">
                  <span>Passengers:</span>
                  <span>4-5 people</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Luggage:</span>
                  <span>2-4 bags</span>
                </div>
                <div className="flex justify-between">
                  <span>Starting at:</span>
                  <span className="font-semibold">₱3,000/day</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <button 
            onClick={() => setActiveSection('vehicles')}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-md hover:bg-blue-700 transition duration-300"
          >
            Browse Our Fleet
          </button>
        </div>
      </div>
    </section>
  );

  // Vehicle filters - now replaced with VehicleFilters component
  const VehicleFiltersSection = () => (
    <VehicleFilters 
      vehicles={vehicles}
      onFilteredVehiclesChange={setFilteredVehicles} // Direct state setter, no useCallback needed
    />
  );

  // Vehicle card component
  const VehicleCard = ({ vehicle }) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-xl ${
      !vehicle.available ? 'opacity-75' : ''
    }`}>
      <div className="relative">
        <VehicleImage vehicle={vehicle} className="w-full h-48 object-cover" />
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          {vehicle.type}
        </div>
        {!vehicle.available && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Unavailable
          </div>
        )}
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
            disabled={!vehicle.available}
            className={`px-5 py-2 rounded-md transition duration-300 font-semibold ${
              vehicle.available 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {vehicle.available ? 'Book Now' : 'Unavailable'}
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
        
        {/* Only show filters when in the vehicles tab */}
        {activeSection === 'vehicles' && <VehicleFiltersSection />}
        
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
    <Account 
      user={user}
      onLogout={handleLogout}
      bookings={bookings}
      getVehicleById={getVehicleById}
      cancelBooking={cancelBooking}
    />
  );
  // Booking modal
  const BookingModalComponent = () => (
    <BookingModal
      isOpen={showBookingModal}
      onClose={() => setShowBookingModal(false)}
      selectedVehicle={selectedVehicle}
      user={user}
      onBookingComplete={handleBookingComplete}
    />
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
          <HomeServicesSection />
        </>
      )}
      
      {activeSection === 'vehicles' && <VehiclesSection />}
      {activeSection === 'contact' && <ContactSection />}
      {activeSection === 'account' && isLoggedIn && <AccountSection />}
      <Footer />
      <BookingModalComponent />
      
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