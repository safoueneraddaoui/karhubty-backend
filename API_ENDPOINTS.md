# 🚀 Karhubty API - Complete Endpoints Documentation

## API Base URL
```
http://localhost:8080/api
```

## 📚 Swagger Documentation
```
http://localhost:8080/api/docs
```

---

## 1️⃣ **Authentication Endpoints** (`/api/auth`)

### Register Admin (Initial Setup)
```
POST /api/auth/register/admin
Content-Type: application/json

{
  "email": "admin@admin.com",
  "password": "Admin123",
  "firstName": "Admin",
  "lastName": "User"
}
```
**Response:** `{ success: true, user: { userId, email, role } }`

### Register User (Customer)
```
POST /api/auth/register/user
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Test123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0612345678",
  "city": "Casablanca",
  "address": "123 Main Street"
}
```

### Register Agent
```
POST /api/auth/register/agent
Content-Type: application/json

{
  "email": "agent@example.com",
  "password": "Agent123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "0687654321",
  "agencyName": "Premium Cars",
  "agencyAddress": "456 Business St",
  "city": "Fez"
}
```

### Login (User/Agent/Admin)
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@admin.com",
  "password": "Admin123"
}
```
**Response:** `{ success: true, user: { id, email, token, role } }`

---

## 2️⃣ **User Endpoints** (`/api/users`)

### Get Current User Profile
```
GET /api/users/profile
Authorization: Bearer {{token}}
```

### Get User By ID
```
GET /api/users/1
Authorization: Bearer {{token}}
```

### Update User Profile
```
PUT /api/users/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "0611111111",
  "city": "Marrakech",
  "address": "New Address"
}
```

### Change Password
```
PUT /api/users/1/password
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "currentPassword": "Test123!",
  "newPassword": "NewPassword123!"
}
```

### Get User Rentals
```
GET /api/users/1/rentals
Authorization: Bearer {{token}}
```

### Get User Reviews
```
GET /api/users/1/reviews
Authorization: Bearer {{token}}
```

### Admin: Get All Users
```
GET /api/users
Authorization: Bearer {{adminToken}}
```

### Admin: Activate User
```
PUT /api/users/1/activate
Authorization: Bearer {{adminToken}}
```

### Admin: Deactivate User
```
PUT /api/users/1/deactivate
Authorization: Bearer {{adminToken}}
```

### Admin: Delete User
```
DELETE /api/users/1
Authorization: Bearer {{adminToken}}
```

---

## 3️⃣ **Car Endpoints** (`/api/cars`)

### Get All Cars (Public)
```
GET /api/cars?category=SUV&minPrice=100&maxPrice=500&transmission=Automatic&fuelType=Petrol
```

### Get Featured Cars
```
GET /api/cars/featured
```

### Search Cars
```
GET /api/cars/search?q=toyota
```

### Get Cars by Category
```
GET /api/cars/category/SUV
```

### Get Car By ID
```
GET /api/cars/1
```

### Check Car Availability
```
POST /api/cars/1/check-availability
Content-Type: application/json

{
  "startDate": "2025-12-25",
  "endDate": "2025-12-28"
}
```

### Get Agent's Cars
```
GET /api/cars/agent/1
Authorization: Bearer {{token}}
```

### Agent: Create Car
```
POST /api/cars
Authorization: Bearer {{agentToken}}
Content-Type: multipart/form-data

form-data:
  brand: Toyota
  model: Camry
  year: 2023
  color: Black
  licensePlate: ABC-1234
  fuelType: Diesel
  transmission: Automatic
  seats: 5
  pricePerDay: 100
  guaranteePrice: 500
  category: Sedan
  features: [Air Conditioning, Power Windows]
  images: [file1.jpg, file2.jpg]
```

### Agent: Update Car
```
PUT /api/cars/1
Authorization: Bearer {{agentToken}}
Content-Type: application/json

{
  "brand": "Toyota",
  "model": "Camry",
  "year": 2024,
  "pricePerDay": 120
}
```

### Agent: Set Car Availability
```
PUT /api/cars/1/availability
Authorization: Bearer {{agentToken}}
Content-Type: application/json

{
  "isAvailable": true
}
```

### Agent: Delete Car
```
DELETE /api/cars/1
Authorization: Bearer {{agentToken}}
```

---

## 4️⃣ **Rental Endpoints** (`/api/rentals`)

### Calculate Rental Price
```
POST /api/rentals/calculate-price
Content-Type: application/json

{
  "carId": 1,
  "startDate": "2025-12-25",
  "endDate": "2025-12-28"
}
```

### User: Create Rental
```
POST /api/rentals
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "carId": 1,
  "startDate": "2025-12-25",
  "endDate": "2025-12-28"
}
```

### Check Rental Overlap
```
POST /api/rentals/check-overlap/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "startDate": "2025-12-25",
  "endDate": "2025-12-28"
}
```

### Get User Rentals
```
GET /api/rentals/user/1
Authorization: Bearer {{token}}
```

### Get Agent Rentals
```
GET /api/rentals/agent/1
Authorization: Bearer {{agentToken}}
```

### Get Rental Statistics
```
GET /api/rentals/stats
Authorization: Bearer {{token}}
```

### Get Rental By ID
```
GET /api/rentals/1
Authorization: Bearer {{token}}
```

### Agent: Approve Rental
```
PUT /api/rentals/1/approve
Authorization: Bearer {{agentToken}}
```

### Agent: Reject Rental
```
PUT /api/rentals/1/reject
Authorization: Bearer {{agentToken}}
```

### User: Cancel Rental
```
PUT /api/rentals/1/cancel
Authorization: Bearer {{userToken}}
```

### Complete Rental
```
PUT /api/rentals/1/complete
Authorization: Bearer {{token}}
```

### Admin: Get All Rentals
```
GET /api/rentals
Authorization: Bearer {{adminToken}}
```

---

## 5️⃣ **Agent Endpoints** (`/api/agents`)

### Get Current Agent Profile
```
GET /api/agents/profile
Authorization: Bearer {{agentToken}}
```

### Get Agent By ID
```
GET /api/agents/1
Authorization: Bearer {{token}}
```

### Agent: Update Profile
```
PUT /api/agents/1
Authorization: Bearer {{agentToken}}
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "0699999999",
  "agencyName": "Updated Agency",
  "agencyAddress": "New Address"
}
```

### Agent: Get Revenue
```
GET /api/agents/1/revenue
Authorization: Bearer {{agentToken}}
```

**Response:** `{ totalEarnings, completedRentals, pendingRentals, approvedRentals, revenue: [] }`

### Agent: Get Dashboard
```
GET /api/agents/1/dashboard
Authorization: Bearer {{agentToken}}
```

**Response:** `{ agentInfo, statistics: { totalCars, totalRentals, completedRentals, totalEarnings, pendingApprovals } }`

### Agent: Upload Approval Documents
```
PUT /api/agents/1/upload-approval
Authorization: Bearer {{agentToken}}
Content-Type: multipart/form-data

form-data:
  document: [PDF/Image file]
```

---

## 6️⃣ **Admin Endpoints** (`/api/admin`)

### Get Pending Agent Requests
```
GET /api/admin/agents/pending
Authorization: Bearer {{adminToken}}
```

### Get All Agents
```
GET /api/admin/agents?status=approved&city=Casablanca
Authorization: Bearer {{adminToken}}
```

### Admin: Approve Agent
```
PUT /api/admin/agents/1/approve
Authorization: Bearer {{adminToken}}
```

### Admin: Reject Agent
```
PUT /api/admin/agents/1/reject
Authorization: Bearer {{adminToken}}
```

### Admin: Suspend Agent
```
PUT /api/admin/agents/1/suspend
Authorization: Bearer {{adminToken}}
```

### Admin: Activate Agent
```
PUT /api/admin/agents/1/activate
Authorization: Bearer {{adminToken}}
```

### Get Platform Statistics
```
GET /api/admin/stats
Authorization: Bearer {{adminToken}}
```

**Response:** `{ totalUsers, totalAgents, totalRentals, totalRevenue, pendingAgents, completedRentals }`

### Get Revenue Statistics
```
GET /api/admin/revenue
Authorization: Bearer {{adminToken}}
```

**Response:** `{ totalRevenue, byAgent: [{ agentId, agencyName, totalEarnings, completedRentals }] }`

---

## 7️⃣ **Review Endpoints** (`/api/reviews`)

### User: Create Review
```
POST /api/reviews
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "carId": 1,
  "rentalId": 1,
  "rating": 5,
  "comment": "Excellent car!"
}
```

### Get Car Reviews (Public)
```
GET /api/reviews/car/1
```

### Get Car Average Rating (Public)
```
GET /api/reviews/car/1/rating
```

### Get User Reviews
```
GET /api/reviews/user/1
Authorization: Bearer {{token}}
```

### Get Review By ID
```
GET /api/reviews/1
```

### User: Update Review
```
PUT /api/reviews/1
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated comment"
}
```

### User: Delete Review
```
DELETE /api/reviews/1
Authorization: Bearer {{userToken}}
```

### Admin: Get All Reviews
```
GET /api/reviews
Authorization: Bearer {{adminToken}}
```

### Admin: Get Pending Reviews
```
GET /api/reviews/admin/pending
Authorization: Bearer {{adminToken}}
```

### Admin: Approve Review
```
PUT /api/reviews/1/approve
Authorization: Bearer {{adminToken}}
```

---

## 🔐 **Authentication & Authorization**

### Roles
- `user` - Regular customer
- `agent` - Car rental agent (needs approval)
- `superadmin` - Administrator

### Token Usage
All protected endpoints require:
```
Authorization: Bearer {{token}}
```

### Getting Token
1. Register/Login to get token
2. Store in Bruno environment: `token`, `adminToken`, `agentToken`
3. Use in subsequent requests

---

## 📝 **Example Workflow**

### 1. Register Admin
```bash
POST /api/auth/register/admin
→ Get admin user created
```

### 2. Login as Admin
```bash
POST /api/auth/login (admin credentials)
→ Get adminToken
```

### 3. Register Agent
```bash
POST /api/auth/register/agent
→ Agent is pending approval
```

### 4. Approve Agent (as Admin)
```bash
PUT /api/admin/agents/1/approve
→ Agent status: approved
```

### 5. Agent: Create Car
```bash
POST /api/cars (with agentToken)
→ Car is listed
```

### 6. User: Browse & Rent Car
```bash
GET /api/cars
POST /api/rentals (create booking)
→ Rental is pending
```

### 7. Agent: Approve Rental
```bash
PUT /api/rentals/1/approve
→ Rental is approved
```

### 8. User: Complete & Review
```bash
PUT /api/rentals/1/complete
POST /api/reviews (create review)
→ Rental done, review posted
```

---

## 🧪 **Testing with Bruno**

1. **Open Bruno Collection** in VS Code
2. **Register Admin** → Get admin account
3. **Login Admin** → Save adminToken
4. **Register Agent** → Create test agent
5. **Approve Agent** (as admin) → Agent can now manage cars
6. **Create Car** (as agent) → Add test car
7. **Register User** → Create customer account
8. **Create Rental** (as user) → Book a car
9. **Approve Rental** (as agent) → Confirm booking
10. **Complete Rental** → Finish rental
11. **Create Review** → Rate the car

---

## 📦 **Response Formats**

### Success Response
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

---

## 🔗 **Important Notes**

- All timestamps are in ISO 8601 format
- Prices are in decimal format with 2 decimal places
- Dates for rentals are in YYYY-MM-DD format
- File uploads support: Images (jpg, png, gif), Documents (pdf, doc, docx)
- Max file size: 10MB
- Car images: max 5 files per car
- Password minimum length: 6 characters
- Email validation required for registration

---

**Last Updated:** December 20, 2025  
**Version:** 1.0.0
