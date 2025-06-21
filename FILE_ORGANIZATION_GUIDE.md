# CarGo File Organization & Future Vehicle Feature Guide

## 📁 Current File Organization Structure

### Storage Bucket: `cargo-files`
```
cargo-files/
├── id_[userId]_[timestamp].jpg         (User ID documents)
├── id_[userId]_[timestamp].pdf         (User ID documents)
├── vehicle_[vehicleId]_[userId]_[timestamp].jpg    (Vehicle images - for future)
├── doc_[vehicleId]_[userId]_[timestamp].pdf        (Vehicle docs - for future)
```

## 🔧 Current Implementation

### User ID Files:
- **Prefix**: `id_`
- **Format**: `id_[userId]_[timestamp].[extension]`
- **Storage**: Appwrite Storage (`cargo-files` bucket)
- **Metadata**: Stored in user preferences
- **File Types**: JPEG, PNG, PDF
- **Max Size**: 5MB

### User Preferences Structure:
```json
{
  "idFileId": "unique-file-id",
  "idFileName": "id_userId_timestamp.jpg",
  "idOriginalName": "drivers_license.jpg",
  "idFileType": "image/jpeg",
  "idFileSize": 2048576,
  "idVerificationStatus": "pending",
  "idUploadDate": "2025-01-15T10:30:00Z",
  "fileCategory": "user_id"
}
```

## 🚗 Future Vehicle Feature Implementation Guide

### 1. Database Setup (When you implement vehicles)
Create a **Vehicles Collection** in Appwrite Database:
```json
{
  "vehicleId": "unique-id",
  "ownerId": "user-id",
  "make": "Toyota",
  "model": "Vios",
  "year": 2023,
  "licensePlate": "ABC-1234",
  "images": [
    {
      "fileId": "img1-id",
      "fileName": "vehicle_vehicleId_userId_timestamp.jpg",
      "isPrimary": true,
      "uploadDate": "2025-01-15T10:30:00Z"
    }
  ],
  "documents": [
    {
      "fileId": "doc1-id",
      "fileName": "doc_vehicleId_userId_timestamp.pdf",
      "documentType": "registration",
      "uploadDate": "2025-01-15T10:30:00Z"
    }
  ],
  "status": "pending_approval",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### 2. File Upload for Vehicles
Use the existing `fileManager.js` utility:

```javascript
import { uploadFile, FILE_CATEGORIES, validateFile } from '../appwrite/fileManager';

// For vehicle images
const uploadVehicleImage = async (imageFile, vehicleId, userId) => {
  const validation = validateFile(imageFile, FILE_CATEGORIES.VEHICLE_IMAGE);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  return await uploadFile(imageFile, FILE_CATEGORIES.VEHICLE_IMAGE, userId, vehicleId);
};

// For vehicle documents
const uploadVehicleDocument = async (docFile, vehicleId, userId) => {
  const validation = validateFile(docFile, FILE_CATEGORIES.VEHICLE_DOCUMENT);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  return await uploadFile(docFile, FILE_CATEGORIES.VEHICLE_DOCUMENT, userId, vehicleId);
};
```

### 3. Component Structure for Add Vehicle Feature
```jsx
// Future: AddVehicle.jsx component
const AddVehicle = () => {
  const [vehicleData, setVehicleData] = useState({
    make: '', model: '', year: '', licensePlate: ''
  });
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  // Implementation will use the same file management system
};
```

### 4. File Organization Benefits
- ✅ **Easy Filtering**: Use prefixes to find specific file types
- ✅ **User Association**: Each file linked to specific user
- ✅ **Timestamp Tracking**: Know when files were uploaded
- ✅ **Scalable**: Same system works for any file type
- ✅ **Search Friendly**: Organized naming convention

### 5. Admin Panel Considerations (Future)
When you build admin features:
- Filter by file category (`user_id`, `vehicle_image`, `vehicle_document`)
- Search by user ID in filename
- Sort by upload timestamp
- Easy file type identification

### 6. Storage Management
- All files in one bucket (perfect for free plan)
- Organized with prefixes for easy management
- Metadata stored separately for quick queries
- File validation prevents storage abuse

## 🎯 Next Steps for Vehicle Feature
1. Create Vehicles database collection
2. Build AddVehicle component using existing fileManager
3. Implement vehicle image gallery using getFilePreview()
4. Add vehicle document management
5. Create admin approval system

## 💡 Tips
- Always use the `fileManager.js` utility for consistency
- Validate files before upload
- Store file metadata in database/preferences
- Use descriptive file names for organization
- Implement proper error handling for failed uploads