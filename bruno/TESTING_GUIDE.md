# Testing Car Creation and Update with Bruno

## Prerequisites
- Backend running on http://localhost:8080
- Agent account: `agent@agent.com` / `Agent123!`

## Test Flow

### Step 1: Login as Agent
1. Open Bruno
2. Go to: **1. Auth → 5. Login Agent**
3. Click **Send**
4. Expected: Status 200, token stored in `{{token}}` variable
5. Check console for: ✅ Login successful!

### Step 2: Create a Car (JSON)
1. Go to: **3. Cars → 6. Create Car (Agent)**
2. Click **Send**
3. Expected: Status 201 or 200
4. Response should contain `carId`
5. Car ID will be stored in `{{createdCarId}}` variable

**Test Data:**
```json
{
  "brand": "Toyota",
  "model": "Camry",
  "year": 2023,
  "color": "Black",
  "licensePlate": "ABC-123-AGENT",
  "fuelType": "Petrol",
  "transmission": "Automatic",
  "seats": 5,
  "pricePerDay": 150,
  "guaranteePrice": 500,
  "category": "Sedan"
}
```

**What we're testing:**
- ✅ Required fields validation
- ✅ Type conversion (year, seats, prices are sent as numbers)
- ✅ Enum validation (fuelType, transmission, category)
- ✅ Number constraints (year 1900-2030, seats 2-9, prices >= 0)
- ✅ String fields validation

### Step 3: Update the Created Car
1. Go to: **3. Cars → 8. Update Car (Agent)**
2. Click **Send**
3. Expected: Status 200
4. Changes: Model changed to Honda, year to 2024, price to 175

**What we're testing:**
- ✅ Partial update (only some fields)
- ✅ Ownership verification (can only update own cars)
- ✅ Same validations as create

### Step 4: Get My Cars (Agent)
1. Go to: **3. Cars → 7. Get My Cars (Agent)**
2. Click **Send**
3. Expected: Status 200, array with your created cars
4. Verify the updated car is in the list

## Troubleshooting

### 400 Bad Request on Create
Check the console in Bruno or the backend terminal for:
- Missing required fields
- Invalid data types
- Constraint violations

### 401 Unauthorized
- Token expired or missing
- Run Login Agent again (Step 1)

### 403 Forbidden  
- Trying to update someone else's car
- Only your own cars can be updated

### 409 Conflict
- License plate already exists
- Use a unique license plate

## Validation Rules Summary

| Field | Type | Rules |
|-------|------|-------|
| brand | string | Required |
| model | string | Required |
| year | number | 1900-2030 |
| color | string | Required |
| licensePlate | string | Required, Unique |
| fuelType | string | Petrol \| Diesel \| Electric \| Hybrid |
| transmission | string | Automatic \| Manual |
| seats | number | 2-9 |
| pricePerDay | number | >= 0 |
| guaranteePrice | number | >= 0 |
| category | string | Sedan \| SUV \| Sports \| Luxury \| Electric \| Compact |

## Expected Success Responses

### Create Car (201)
```json
{
  "carId": 1,
  "brand": "Toyota",
  "model": "Camry",
  "year": 2023,
  "color": "Black",
  "licensePlate": "ABC-123-AGENT",
  "fuelType": "Petrol",
  "transmission": "Automatic",
  "seats": 5,
  "pricePerDay": 150,
  "guaranteePrice": 500,
  "category": "Sedan",
  "images": [],
  "isAvailable": true,
  "agentId": 1,
  "dateAdded": "2024-12-21T...",
  "averageRating": 0,
  "updatedAt": "2024-12-21T..."
}
```

### Update Car (200)
```json
{
  "carId": 1,
  "brand": "Honda",
  "model": "Civic",
  "year": 2024,
  "color": "Silver",
  "licensePlate": "ABC-123-AGENT",
  "fuelType": "Hybrid",
  "transmission": "Automatic",
  "seats": 5,
  "pricePerDay": 175,
  "guaranteePrice": 750,
  "category": "Sedan",
  "images": [],
  "isAvailable": true,
  "agentId": 1,
  "dateAdded": "2024-12-21T...",
  "averageRating": 0,
  "updatedAt": "2024-12-21T..."
}
```

---

**Run these tests in order and check the Console in Bruno for detailed logs!**
