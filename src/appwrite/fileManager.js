import { storage, STORAGE_BUCKET_ID } from './config';
import { ID } from 'appwrite';

// File category constants for organization
export const FILE_CATEGORIES = {
  USER_ID: 'user_id',
  VEHICLE_IMAGE: 'vehicle_image',
  VEHICLE_DOCUMENT: 'vehicle_document'
};

// Generate organized file name with category prefix
export const generateFileName = (category, userId, originalFileName, additionalId = null) => {
  const timestamp = Date.now();
  const fileExtension = originalFileName.split('.').pop();
  
  switch (category) {
    case FILE_CATEGORIES.USER_ID:
      return `id_${userId}_${timestamp}.${fileExtension}`;
    case FILE_CATEGORIES.VEHICLE_IMAGE:
      return `vehicle_${additionalId || 'temp'}_${userId}_${timestamp}.${fileExtension}`;
    case FILE_CATEGORIES.VEHICLE_DOCUMENT:
      return `doc_${additionalId || 'temp'}_${userId}_${timestamp}.${fileExtension}`;
    default:
      return `file_${userId}_${timestamp}.${fileExtension}`;
  }
};

// Upload file with proper organization
export const uploadFile = async (file, category, userId, additionalId = null) => {
  try {
    const organizedFileName = generateFileName(category, userId, file.name, additionalId);
    
    // Create a new File object with our organized name
    const organizedFile = new File([file], organizedFileName, {
      type: file.type,
      lastModified: file.lastModified
    });
    
    const fileUpload = await storage.createFile(
      STORAGE_BUCKET_ID,
      ID.unique(),
      organizedFile
    );
    
    return {
      success: true,
      fileId: fileUpload.$id,
      fileName: organizedFileName,
      originalName: file.name,
      fileType: file.type,
      fileSize: file.size,
      category: category
    };
  } catch (error) {
    console.error('File upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get file preview URL
export const getFilePreview = (fileId, width = 400, height = 300) => {
  try {
    return storage.getFilePreview(STORAGE_BUCKET_ID, fileId, width, height);
  } catch (error) {
    console.error('Failed to get file preview:', error);
    return null;
  }
};

// Get file download URL
export const getFileDownload = (fileId) => {
  try {
    return storage.getFileDownload(STORAGE_BUCKET_ID, fileId);
  } catch (error) {
    console.error('Failed to get file download URL:', error);
    return null;
  }
};

// Delete file
export const deleteFile = async (fileId) => {
  try {
    await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete file:', error);
    return { success: false, error: error.message };
  }
};

// Validate file before upload
export const validateFile = (file, category) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  let allowedTypes = [];
  switch (category) {
    case FILE_CATEGORIES.USER_ID:
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      break;
    case FILE_CATEGORIES.VEHICLE_IMAGE:
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      break;
    case FILE_CATEGORIES.VEHICLE_DOCUMENT:
      allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      break;
    default:
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  }
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 5MB'
    };
  }
  
  return { valid: true };
};

// Get all files from bucket
export const getAllFiles = async () => {
  try {
    const files = await storage.listFiles(STORAGE_BUCKET_ID);
    return { success: true, files: files.files };
  } catch (error) {
    console.error('Failed to get files:', error);
    return { success: false, error: error.message };
  }
};

// Filter files by category using user preferences/metadata
export const getFilesByCategory = async (category) => {
  try {
    const allFiles = await getAllFiles();
    if (!allFiles.success) return allFiles;
    
    // Note: Since Appwrite stores files with random IDs, we need to use
    // user preferences or a database to track file categories
    // This is a basic implementation - in practice, you'd query user preferences
    return {
      success: true,
      files: allFiles.files,
      note: 'To properly filter by category, query user preferences or database records'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get files by user ID (requires querying user preferences)
export const getUserFiles = async (userId, category = null) => {
  try {
    // This function would typically query your database or user preferences
    // to find files associated with a specific user and category
    console.log(`Getting files for user: ${userId}, category: ${category}`);
    
    return {
      success: true,
      files: [],
      note: 'This function requires user preferences or database integration to work properly'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};