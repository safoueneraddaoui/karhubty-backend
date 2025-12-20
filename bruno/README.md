# 🚀 Bruno API Testing Collection

This folder contains a complete Bruno collection for testing all Karhubty API endpoints.

## 📦 Setup Instructions

### 1. **Install Bruno Extension** (if not already installed)
   - Open VS Code
   - Go to Extensions (Cmd+Shift+X on Mac)
   - Search for "Bruno"
   - Install by Ananta Raha

### 2. **Open Bruno Collection**
   - Open the `/bruno` folder as a workspace
   - Or use Command: `Bruno: Open Collection`

### 3. **Set Environment**
   - In Bruno interface, look for "Local" in the environment dropdown
   - Select it as your active environment
   - Variables will auto-populate from stored tokens

## 🧪 How to Test

### Step 1: Register & Login
1. Click `1. Auth` → `1. Register User` → Click "Send"
2. Or login with: `1. Auth` → `3. Login User` → Click "Send"
3. ✅ Token will automatically save to environment variables

### Step 2: Access Protected Endpoints
1. Any request that needs auth will automatically use the stored token
2. Examples: `Get Current Profile`, `Create Rental`, `Update Profile`

### Step 3: Test All Endpoints
- **2. Users** - User profile operations
- **3. Cars** - Car listing and search
- **4. Rentals** - Rental management

## 📋 Available Collections

### 1. Auth Endpoints
- ✅ Register User
- ✅ Register Agent
- ✅ Login User

### 2. User Endpoints
- ✅ Get Current Profile
- ✅ Get User By ID
- ✅ Update Profile
- ✅ Change Password

### 3. Cars Endpoints
- ✅ Get All Cars (with filters)
- ✅ Get Featured Cars
- ✅ Search Cars
- ✅ Get Car By ID
- ✅ Check Availability

### 4. Rental Endpoints
- ✅ Calculate Price
- ✅ Create Rental
- ✅ Get User Rentals
- ✅ Get Rental Stats
- ✅ Get Rental By ID

### 5. Agent Endpoints
- ✅ Get Agent Profile
- ✅ Get Agent By ID
- ✅ Update Agent Profile
- ✅ Get Agent Revenue
- ✅ Get Agent Dashboard
- ✅ Upload Approval Documents

### 6. Admin Endpoints
- ✅ Get Pending Agents
- ✅ Get All Agents (with filters)
- ✅ Approve Agent
- ✅ Reject Agent
- ✅ Suspend Agent
- ✅ Activate Agent
- ✅ Get Platform Statistics
- ✅ Get Revenue Statistics

### 7. Review Endpoints
- ✅ Create Review
- ✅ Get Car Reviews
- ✅ Get Car Average Rating
- ✅ Get User Reviews
- ✅ Get Review By ID
- ✅ Update Review
- ✅ Delete Review
- ✅ Get All Reviews (Admin)
- ✅ Get Pending Reviews (Admin)
- ✅ Approve Review (Admin)

## 🔐 Authentication

The collection automatically handles JWT tokens:
- Login response stores `token` in environment
- All protected endpoints use `Authorization: Bearer {{token}}`
- No manual token copying needed!

## 🛠️ Modify Requests

1. Click any request to open it
2. Edit parameters, body, or headers
3. Click "Send" to test
4. See response in the right panel

## 📝 Tips

- **Use the Pre-Request Script**: Some requests auto-store data for later use
- **Modify Variables**: Edit `environments/Local.bru` to add/change variables
- **Reorder Requests**: Drag and drop to reorganize
- **Add Comments**: Add descriptions to requests for documentation

## ✅ Quick Test Flow

1. `Register User` → Get registered
2. `Login User` → Get token
3. `Get Current Profile` → Verify user
4. `Get All Cars` → Browse available cars
5. `Calculate Price` → Check pricing
6. `Create Rental` → Create booking

---

**Server**: http://localhost:8080  
**API Docs**: http://localhost:8080/api/docs (Swagger)

Happy testing! 🎯
