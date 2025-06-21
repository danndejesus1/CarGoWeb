# Complete Appwrite Collection Attributes Guide

## Database: `cargo-car-rental`
## Collection: `bookings`

---

## STEP-BY-STEP ATTRIBUTE CREATION

### 1. User Information Attributes

#### `userId`
- **Type:** String
- **Size:** 50
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Appwrite User ID who made the booking

#### `userName` 
- **Type:** String
- **Size:** 100
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Full name of the user

#### `userEmail`
- **Type:** String
- **Size:** 100
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Email address of the user

---

### 2. Vehicle Information Attributes

#### `vehicleId`
- **Type:** String
- **Size:** 50
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Unique identifier for the vehicle

#### `vehicleMake`
- **Type:** String
- **Size:** 50
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Vehicle manufacturer (Toyota, Honda, etc.)

#### `vehicleModel`
- **Type:** String
- **Size:** 50
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Vehicle model (Vios, CRV, etc.)

#### `vehicleType`
- **Type:** String
- **Size:** 30
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Vehicle category (Sedan, SUV, Hatchback)

#### `pricePerDay`
- **Type:** Integer
- **Min:** 0
- **Max:** 999999
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Daily rental rate in Philippine Pesos

---

### 3. Booking Date & Time Attributes

#### `pickupDateTime`
- **Type:** DateTime
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Complete pickup date and time in ISO format

#### `returnDateTime`
- **Type:** DateTime
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Complete return date and time in ISO format

---

### 4. Location Attributes

#### `pickupLocation`
- **Type:** String
- **Size:** 200
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Full pickup address

#### `returnLocation`
- **Type:** String
- **Size:** 200
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Full return address

---

### 5. Service Options Attributes

#### `driverRequired`
- **Type:** Boolean
- **Required:** Yes
- **Default:** false
- **Array:** No
- **Description:** Whether driver service is included

#### `specialRequests`
- **Type:** String
- **Size:** 500
- **Required:** No
- **Default:** (none)
- **Array:** No
- **Description:** Special requirements or notes

---

### 6. Emergency Contact Attributes

#### `emergencyContact`
- **Type:** String
- **Size:** 100
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Emergency contact person's full name

#### `emergencyPhone`
- **Type:** String
- **Size:** 20
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Emergency contact phone number

---

### 7. Pricing Attributes

#### `numberOfDays`
- **Type:** Integer
- **Min:** 1
- **Max:** 365
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Duration of rental in days

#### `totalCost`
- **Type:** Integer
- **Min:** 0
- **Max:** 9999999
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Total booking cost in Philippine Pesos

---

### 8. Status & Metadata Attributes

#### `status`
- **Type:** String
- **Size:** 20
- **Required:** Yes
- **Default:** "pending"
- **Array:** No
- **Description:** Booking status (pending, confirmed, cancelled, completed)

#### `createdAt`
- **Type:** DateTime
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Booking creation timestamp

#### `updatedAt`
- **Type:** DateTime
- **Required:** Yes
- **Default:** (none)
- **Array:** No
- **Description:** Last update timestamp

---

## INDEXES TO CREATE

### Primary Indexes:
1. **userId** (Ascending) - For user-specific queries
2. **status** (Ascending) - For status filtering
3. **pickupDateTime** (Ascending) - For date-based queries
4. **createdAt** (Descending) - For chronological ordering

### Secondary Indexes:
5. **vehicleId** (Ascending) - For vehicle-specific queries
6. **totalCost** (Ascending) - For cost-based sorting

---

## PERMISSIONS SETUP

### Document Security:
- **Create Documents:** Users
- **Read Documents:** Users (own documents only)
- **Update Documents:** Users (own documents only) 
- **Delete Documents:** Admins only

### Collection Security:
- **Read Collection:** Users
- **Create Collection:** Admins only
- **Update Collection:** Admins only
- **Delete Collection:** Admins only

---

## VALIDATION RULES (to implement in your code)

### Date Validation:
- `pickupDateTime` must be in the future (after current time)
- `returnDateTime` must be after `pickupDateTime`
- Format: ISO 8601 DateTime (automatically handled by Appwrite)

### Time Validation:
- Pickup and return times automatically included in DateTime
- Business hours validation can be applied (e.g., 6 AM - 10 PM)

### Phone Validation:
- `emergencyPhone` should match phone number patterns
- Support international formats

### Cost Validation:
- `pricePerDay` > 0
- `totalCost` = (`pricePerDay` × `numberOfDays`) + driver cost
- Driver cost = 1000 × `numberOfDays` (if `driverRequired` = true)

### Status Validation:
- Must be one of: "pending", "confirmed", "cancelled", "completed"
- State transitions: pending → confirmed/cancelled, confirmed → completed

---

## QUICK COPY-PASTE ATTRIBUTE LIST

For quick reference when creating in Appwrite Console:

```
userId - String(50) - Required
userName - String(100) - Required  
userEmail - String(100) - Required
vehicleId - String(50) - Required
vehicleMake - String(50) - Required
vehicleModel - String(50) - Required
vehicleType - String(30) - Required
pricePerDay - Integer - Required
pickupDateTime - DateTime - Required
returnDateTime - DateTime - Required
pickupLocation - String(200) - Required
returnLocation - String(200) - Required
driverRequired - Boolean - Required - Default: false
specialRequests - String(500) - Optional
emergencyContact - String(100) - Required
emergencyPhone - String(20) - Required
numberOfDays - Integer(1-365) - Required
totalCost - Integer - Required
status - String(20) - Required - Default: "pending"
createdAt - DateTime - Required
updatedAt - DateTime - Required
```