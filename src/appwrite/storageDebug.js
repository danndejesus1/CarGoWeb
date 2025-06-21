// Debug script to test storage connection
import { storage, STORAGE_BUCKET_ID } from './config';

export const testStorageConnection = async () => {
  try {
    console.log('Testing storage connection...');
    console.log('Bucket ID:', STORAGE_BUCKET_ID);
    
    // Try to list files in the bucket
    const files = await storage.listFiles(STORAGE_BUCKET_ID);
    console.log('Storage connection successful!');
    console.log('Files in bucket:', files);
    return { success: true, files };
  } catch (error) {
    console.error('Storage connection failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type
    });
    
    // Common error solutions
    if (error.message.includes('not found')) {
      console.error('SOLUTION: Bucket does not exist. Create a bucket named:', STORAGE_BUCKET_ID);
    } else if (error.message.includes('permission')) {
      console.error('SOLUTION: Check bucket permissions in Appwrite Console');
    }
    
    return { success: false, error };
  }
};

// Call this function to test
// testStorageConnection();