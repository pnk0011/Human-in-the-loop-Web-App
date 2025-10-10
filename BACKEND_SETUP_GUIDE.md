# 🚀 Complete Backend API Setup Guide

This guide will help you set up and run the separate Node.js backend API for the Medical Insurance Web App.

## 📋 Prerequisites

- **Node.js 18+** installed on your system
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

## 🛠️ Quick Setup

### Option 1: Automated Setup (Recommended)

1. **Make the setup script executable:**
   ```bash
   chmod +x backend/setup.sh
   ```

2. **Run the setup script:**
   ```bash
   ./backend/setup.sh
   ```

### Option 2: Manual Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Create environment file:**
   ```bash
   cp config.env .env
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Edit the `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### Important Notes:
- **Change `JWT_SECRET`** to a secure random string in production
- **Update `CORS_ORIGIN`** if your frontend runs on a different port
- **Adjust `PORT`** if 5000 is already in use

## 🚀 Running the Backend

### Development Mode
```bash
npm run dev
```
- Auto-restarts on file changes
- Detailed error logging
- Hot reload enabled

### Production Mode
```bash
npm start
```
- Optimized for performance
- Minimal logging
- Production-ready

## 🔍 Testing the API

### 1. Health Check
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Medical Insurance API is running",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. Login Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medpro.com",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1",
      "name": "Admin User",
      "email": "admin@medpro.com",
      "role": "Admin",
      "permissions": ["user.manage", "document.assign", ...],
      "createdAt": "2024-01-15T10:30:00Z",
      "lastLogin": "2024-01-20T14:22:00Z",
      "isActive": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  }
}
```

### 3. Validate Token Test
```bash
curl http://localhost:5000/api/auth/validate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔐 Default Test Users

| Email | Password | Role | Status |
|-------|----------|------|--------|
| admin@medpro.com | admin123 | Admin | Active |
| reviewer@medpro.com | reviewer123 | Reviewer | Active |
| qc@medpro.com | qc123 | QC | Active |
| john.doe@medpro.com | john123 | Reviewer | Active |
| sarah.wilson@medpro.com | sarah123 | QC | Active |
| mike.johnson@medpro.com | mike123 | Reviewer | Active |
| jane.smith@medpro.com | jane123 | QC | Inactive |

## 🔗 Frontend Integration

The frontend has been updated to use the backend API. Make sure both servers are running:

1. **Backend API:** `http://localhost:5000`
2. **Frontend App:** `http://localhost:3000`

### Testing Frontend Integration

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd .. # Go back to root directory
   npm run dev
   ```

3. **Test login in the browser:**
   - Go to `http://localhost:3000`
   - Try logging in with any of the test credentials above
   - Check browser network tab to see API calls

## 🛡️ Security Features

- **JWT Authentication** with access and refresh tokens
- **Password Hashing** using bcrypt with salt rounds
- **Rate Limiting** (100 requests per 15 minutes)
- **CORS Protection** (configured for frontend origin)
- **Security Headers** (Helmet middleware)
- **Input Validation** (express-validator)
- **Session Management** with automatic expiration

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/logout-all` - Logout from all devices
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/validate` - Validate token
- `GET /api/auth/me` - Get current user

### User Management (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🐛 Troubleshooting

### Common Issues

1. **Port 5000 already in use:**
   ```bash
   # Change port in .env file
   PORT=5001
   ```

2. **CORS errors:**
   ```bash
   # Update CORS_ORIGIN in .env file
   CORS_ORIGIN=http://localhost:3000
   ```

3. **JWT errors:**
   ```bash
   # Make sure JWT_SECRET is set in .env
   JWT_SECRET=your-secret-key-here
   ```

4. **Build errors:**
   ```bash
   # Clean and rebuild
   rm -rf dist node_modules
   npm install
   npm run build
   ```

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

## 📝 Development Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🚀 Production Deployment

1. **Set production environment:**
   ```env
   NODE_ENV=production
   JWT_SECRET=your-production-secret-key
   PORT=5000
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## 📞 Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure Node.js version is 18+
4. Check that ports 5000 and 3000 are available

## 🎉 Success!

Once everything is set up correctly, you should see:

- ✅ Backend API running on `http://localhost:5000`
- ✅ Frontend app running on `http://localhost:3000`
- ✅ Login working with test credentials
- ✅ JWT tokens being generated and validated
- ✅ Role-based access control functioning

The backend API is now fully integrated with your frontend application! 🚀
