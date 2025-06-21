// Appwrite configuration for CarGo app
export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'cargo-db',
  collections: {
    vehicles: import.meta.env.VITE_APPWRITE_VEHICLES_COLLECTION_ID || 'vehicles',
    bookings: import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID || 'bookings', 
    users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users',
    contactForms: import.meta.env.VITE_APPWRITE_CONTACT_FORMS_COLLECTION_ID || 'contact'
  }
};