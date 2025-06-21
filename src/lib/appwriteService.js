// Appwrite service for CarGo app
import { client, account, databases } from './appwrite';
import { ID, Query } from 'appwrite';
import { appwriteConfig } from './config';

// Collection IDs from config
const { databaseId, collections } = appwriteConfig;

// Auth services
export const createAccount = async (email, password, name) => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      name
    );
    
    if (newAccount) {
      // Create a session
      await login(email, password);
      return newAccount;
    }
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    return await account.createEmailSession(email, password);
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    return await account.deleteSession('current');
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Vehicle services
export const getVehicles = async () => {
  try {
    const response = await databases.listDocuments(
      databaseId,
      collections.vehicles
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    throw error;
  }
};

export const getVehicleById = async (id) => {
  try {
    return await databases.getDocument(
      databaseId,
      collections.vehicles,
      id
    );
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    throw error;
  }
};

// Booking services
export const createBooking = async (vehicleId, userId, pickupDate, returnDate) => {
  try {
    return await databases.createDocument(
      databaseId,
      collections.bookings,
      ID.unique(),
      {
        vehicleId,
        userId,
        pickupDate,
        returnDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

export const getUserBookings = async (userId) => {
  try {
    const response = await databases.listDocuments(
      databaseId,
      collections.bookings,
      [
        Query.equal('userId', userId)
      ]
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    throw error;
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    return await databases.updateDocument(
      databaseId,
      collections.bookings,
      bookingId,
      {
        status
      }
    );
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

export const deleteBooking = async (bookingId) => {
  try {
    return await databases.deleteDocument(
      databaseId,
      collections.bookings,
      bookingId
    );
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};

// Contact form service
export const submitContactForm = async (name, email, message) => {
  try {
    return await databases.createDocument(
      databaseId,
      collections.contactForms,
      ID.unique(),
      {
        name,
        email,
        message,
        createdAt: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error("Error submitting contact form:", error);
    throw error;
  }
};