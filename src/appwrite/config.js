import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Your API Endpoint
    .setProject('685682ba00095008cb7d'); // Your project ID

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Single storage bucket for all files
export const STORAGE_BUCKET_ID = 'cargo-files'; // IMPORTANT: Create this exact bucket in Appwrite Console
// Alternative: If you have an existing bucket, replace 'cargo-files' with your bucket ID

export default client;