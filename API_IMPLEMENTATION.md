# Real Login API Implementation

This implementation provides a realistic login API using dummy data stored in `data.json`.

## 🚀 Features

- **Real API calls** with proper error handling
- **Token-based authentication** with session management
- **Password validation** (simple hash for demo)
- **User role management** with permissions
- **Login attempt tracking** for security
- **Session validation** and expiration
- **Comprehensive error messages**

## 📁 Files Created

- `src/data.json` - Dummy user data and system state
- `src/services/authAPI.ts` - API service with all authentication logic
- `src/testCredentials.ts` - Test credentials for easy testing

## 🔐 Test Credentials

### Admin Users
- **Email:** `admin@medpro.com`
- **Password:** `admin123`
- **Role:** Admin (full access)

### Reviewer Users  
- **Email:** `reviewer@medpro.com`
- **Password:** `reviewer123`
- **Role:** Reviewer (document validation)

- **Email:** `john.doe@medpro.com`
- **Password:** `john123`
- **Role:** Reviewer

- **Email:** `mike.johnson@medpro.com`
- **Password:** `mike123`
- **Role:** Reviewer

### QC Users
- **Email:** `qc@medpro.com`
- **Password:** `qc123`
- **Role:** QC (quality control)

- **Email:** `sarah.wilson@medpro.com`
- **Password:** `sarah123`
- **Role:** QC

- **Email:** `jane.smith@medpro.com`
- **Password:** `jane123`
- **Role:** QC (inactive account - will show error)

## 🛠️ API Features

### Authentication
- ✅ Email/password validation
- ✅ User account status checking
- ✅ Token generation and validation
- ✅ Session management
- ✅ Automatic logout on token expiration

### Security
- ✅ Login attempt tracking
- ✅ Account deactivation support
- ✅ Session expiration (24 hours)
- ✅ Input validation and sanitization

### Error Handling
- ✅ Comprehensive error messages
- ✅ Network error handling
- ✅ Invalid credential detection
- ✅ Account status validation

## 🔄 How It Works

1. **Login Process:**
   - User enters credentials
   - API validates email format
   - Finds user in database
   - Verifies password
   - Checks account status
   - Generates session token
   - Returns user data (without password)

2. **Session Management:**
   - Token stored in localStorage
   - Session validated on app load
   - Automatic cleanup of expired sessions
   - Logout clears all session data

3. **Error Handling:**
   - Clear error messages for different scenarios
   - Login attempt logging for security
   - Graceful handling of network issues

## 🎯 Usage

The API is fully integrated into the AuthContext and LoginPage components. Users can now:

- Login with real credentials
- See proper error messages
- Experience realistic loading states
- Have sessions persist across browser refreshes
- Get logged out automatically when sessions expire

## 🔧 Customization

To add more users or modify permissions, edit `src/data.json`:

```json
{
  "users": [
    {
      "id": "8",
      "name": "New User",
      "email": "new@medpro.com", 
      "password": "new123",
      "role": "Reviewer",
      "permissions": ["document.validate", "history.view"],
      "createdAt": "2024-01-21T10:00:00Z",
      "lastLogin": null,
      "isActive": true
    }
  ]
}
```

The system will automatically handle the new user with proper authentication and role-based access control.
