// Database connection test utility
import { databases } from '../appwrite/config';
import { ID } from 'appwrite';

export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Try to create a simple test document
    const testDoc = {
      testField: 'test value',
      createdAt: new Date().toISOString()
    };
    
    const response = await databases.createDocument(
      'cargo-car-rental', // Database ID
      'bookings',         // Collection ID
      ID.unique(),        // Document ID
      testDoc             // Data
    );
    
    console.log('✅ Database connection successful!', response);
    
    // Clean up - delete the test document
    await databases.deleteDocument('cargo-car-rental', 'bookings', response.$id);
    console.log('✅ Test cleanup completed');
    
    return { success: true, message: 'Database connection working' };
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return { 
      success: false, 
      message: error.message,
      code: error.code,
      type: error.type
    };
  }
};

// Call this function in your browser console to test:
// testDatabaseConnection().then(console.log);