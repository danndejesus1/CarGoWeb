# CarGo Database Schema

This document outlines the database structure for the CarGo car rental application using Appwrite.

## Database Configuration

**Database ID:** `cargo-car-rental`

## Collections

### 1. Vehicles Collection

**Collection ID:** `vehicles`

#### Attributes:

| Attribute Name | Type | Size | Required | Default | Array | Description |
|----------------|------|------|----------|---------|-------|-------------|
| `make` | String | 100 | Yes | - | No | Vehicle manufacturer (e.g., Toyota, Honda) |
| `model` | String | 100 | Yes | - | No | Vehicle model (e.g., Vios, CRV) |
| `type` | String | 50 | Yes | - | No | Vehicle type (Sedan, SUV, Hatchback, Pickup, Van, Coupe) |
| `gasType` | String | 50 | Yes | - | No | Fuel type (Petrol, Diesel, Hybrid, Electric) |
| `seatingCapacity` | Integer | - | Yes | - | No | Number of seats (2-15) |
| `pricePerDay` | Integer | - | Yes | - | No | Daily rental price in PHP |
| `imageUrl` | String | 500 | No | - | No | URL of vehicle image (fallback) |
| `imageFileId` | String | 100 | No | - | No | Appwrite file ID for organized storage |
| `imageFileName` | String | 200 | No | - | No | Organized filename for the image |
| `description` | String | 1000 | No | - | No | Additional vehicle details |
| `available` | Boolean | - | No | true | No | Whether vehicle is available for booking |
| `createdAt` | DateTime | - | Yes | - | No | Record creation timestamp |
| `updatedAt` | DateTime | - | Yes | - | No | Record last update timestamp |

#### Indexes:
- `type` (for filtering by vehicle type)
- `available` (for filtering available vehicles)
- `make` (for filtering by manufacturer)
- `pricePerDay` (for price range filtering)

#### Permissions:
- **Read:** Any (public access for browsing vehicles)
- **Create:** Admin users only
- **Update:** Admin users only
- **Delete:** Admin users only

### 2. Bookings Collection

**Collection ID:** `bookings`

#### Attributes:

| Attribute Name | Type | Size | Required | Default | Array | Description |
|----------------|------|------|----------|---------|-------|-------------|
| `userId` | String | 100 | Yes | - | No | ID of the user making the booking |
| `userName` | String | 100 | Yes | - | No | Name of the user |
| `userEmail` | String | 200 | Yes | - | No | Email of the user |
| `vehicleId` | String | 100 | Yes | - | No | ID of the booked vehicle |
| `vehicleMake` | String | 100 | Yes | - | No | Vehicle make (for quick reference) |
| `vehicleModel` | String | 100 | Yes | - | No | Vehicle model (for quick reference) |
| `vehicleType` | String | 50 | Yes | - | No | Vehicle type (for quick reference) |
| `pricePerDay` | Integer | - | Yes | - | No | Daily rate at time of booking |
| `pickupDate` | DateTime | - | Yes | - | No | Pickup date and time |
| `returnDate` | DateTime | - | Yes | - | No | Return date and time |
| `pickupLocation` | String | 500 | Yes | - | No | Pickup address |
| `returnLocation` | String | 500 | Yes | - | No | Return address |
| `driverRequired` | Boolean | - | No | false | No | Whether driver service is requested |
| `specialRequests` | String | 1000 | No | - | No | Additional requests or notes |
| `emergencyContact` | String | 200 | Yes | - | No | Emergency contact name |
| `emergencyPhone` | String | 50 | Yes | - | No | Emergency contact phone |
| `numberOfDays` | Integer | - | Yes | - | No | Duration of rental in days |
| `totalCost` | Integer | - | Yes | - | No | Total booking cost |
| `status` | String | 50 | Yes | pending | No | Booking status (pending, confirmed, cancelled, completed) |
| `createdAt` | DateTime | - | Yes | - | No | Booking creation timestamp |
| `updatedAt` | DateTime | - | Yes | - | No | Booking last update timestamp |

#### Indexes:
- `userId` (for user-specific queries)
- `vehicleId` (for vehicle-specific queries)
- `status` (for filtering by booking status)
- `pickupDate` (for date range queries)
- `createdAt` (for sorting by booking date)

#### Permissions:
- **Read:** Users can read their own bookings, Admin can read all
- **Create:** Authenticated users only
- **Update:** Users can update their own bookings, Admin can update all
- **Delete:** Users can delete their own bookings, Admin can delete all

## Setup Instructions

### 1. Create Database
1. Go to your Appwrite Console
2. Navigate to Databases
3. Create a new database with ID: `cargo-car-rental`

### 2. Create Collections

#### Create Vehicles Collection:
1. In the database, create a new collection with ID: `vehicles`
2. Add all attributes as specified in the table above
3. Set up the indexes for better query performance
4. Configure permissions (public read, admin write)

#### Create Bookings Collection:
1. Create a new collection with ID: `bookings`
2. Add all attributes as specified in the table above
3. Set up the indexes for efficient queries
4. Configure permissions (user-specific read/write, admin full access)

### 3. Configure Permissions

For **Vehicles Collection:**
```
Read: role:any
Create: role:admin
Update: role:admin
Delete: role:admin
```

For **Bookings Collection:**
```
Read: role:user([USER_ID])
Create: role:user([USER_ID])
Update: role:user([USER_ID])
Delete: role:user([USER_ID])
```

### 4. Sample Data

You can add some sample vehicles using the admin dashboard, or manually add them in the Appwrite console:

```json
{
  "make": "Toyota",
  "model": "Vios",
  "type": "Sedan",
  "gasType": "Petrol",
  "seatingCapacity": 5,
  "pricePerDay": 1500,
  "imageUrl": "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=400&h=250&fit=crop",
  "imageFileId": "67890abc-def1-2345-6789-abcdef123456",
  "imageFileName": "vehicle-Toyota-Vios-1641234567890",
  "description": "Reliable and fuel-efficient sedan perfect for city driving",
  "available": true,
  "createdAt": "2025-01-11T00:00:00.000Z",
  "updatedAt": "2025-01-11T00:00:00.000Z"
}
```

## Image Management Integration

### File Organization System

Vehicle images are managed using the same system as your ID verification:

1. **Upload Process:**
   - Admin uploads vehicle image through dashboard
   - File stored in your existing bucket with organized naming
   - `imageFileId` stores the Appwrite file ID
   - `imageFileName` stores the organized name (e.g., `vehicle-Toyota-Vios-1641234567890`)
   - `imageUrl` keeps external URL as fallback

2. **Display Process:**
   - Primary: Use `getFilePreview(imageFileId, width, height)` for organized files
   - Fallback: Use `imageUrl` for external images or if file preview fails

3. **Categories:**
   - ID documents: `user_id`
   - Vehicle images: `vehicle_image`

### Updated File Categories

Your `uploadFile` function now handles these categories:
- `user_id` - User identification documents
- `vehicle_image` - Vehicle photos for rental listings

## Important Notes

1. **Vehicle IDs in Bookings:** The `vehicleId` in bookings should reference the `$id` of vehicles from the vehicles collection.

2. **User Authentication:** Ensure users are properly authenticated before they can create bookings.

3. **Admin Role:** Create an admin role in Appwrite Auth settings for managing vehicles.

4. **Date Handling:** All dates are stored as DateTime in ISO format for consistency.

5. **Price Storage:** Prices are stored as integers (in centavos/pesos) to avoid floating-point precision issues.

6. **Image URLs:** Vehicle images should be hosted externally or uploaded to Appwrite Storage.

## API Usage Examples

### Load Vehicles:
```javascript
const vehicles = await databases.listDocuments(
  'cargo-car-rental',
  'vehicles',
  [Query.equal('available', true)]
);
```

### Create Booking:
```javascript
const booking = await databases.createDocument(
  'cargo-car-rental',
  'bookings',
  ID.unique(),
  bookingData,
  [Permission.read(Role.user(userId))]
);
```

### Load User Bookings:
```javascript
const bookings = await databases.listDocuments(
  'cargo-car-rental',
  'bookings',
  [Query.equal('userId', userId)]
);
```