import React, { useState, useEffect } from 'react';
import { account } from './appwrite/config';
import HomePage from './Homepage';
import Login from './components/Login';
import Register from './components/Register';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await account.get();
      setUser(userData);
    } catch (error) {
      // User not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setShowAuth(false);
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setShowAuth(false);
  };

  const handleLogout = async () => {
    try {
      await account.deleteSessions();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const showLoginModal = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const showRegisterModal = () => {
    setAuthMode('register');
    setShowAuth(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <HomePage 
        user={user} 
        onLogout={handleLogout} 
        onShowLogin={showLoginModal}
        onShowRegister={showRegisterModal}
      />
      
      {showAuth && (
        <div className="fixed inset-0 z-50">
          {authMode === 'login' ? (
            <Login 
              onLogin={handleLogin} 
              switchToRegister={() => setAuthMode('register')}
              onClose={() => setShowAuth(false)}
            />
          ) : (
            <Register 
              onRegister={handleRegister} 
              switchToLogin={() => setAuthMode('login')}
              onClose={() => setShowAuth(false)}
            />
          )}
        </div>
      )}
    </>
  );
};

export default App;