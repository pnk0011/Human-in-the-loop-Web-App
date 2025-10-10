# Medical Insurance Backend API

A robust Node.js backend API for the Medical Insurance Web App with JWT authentication, role-based access control, and comprehensive user management.

## 🚀 Features

- **JWT Authentication** with access and refresh tokens
- **Role-based Access Control** (Admin, Reviewer, QC)
- **Password Security** with bcrypt hashing
- **Session Management** with automatic expiration
- **Rate Limiting** to prevent abuse
- **Input Validation** with express-validator
- **Comprehensive Error Handling**
- **Security Headers** with Helmet
- **CORS Configuration** for frontend integration
- **Request Logging** with Morgan
- **TypeScript Support** for type safety

## 📁 Project Structure

```
medical-insurance-backend/
├── src/
│   ├── server.ts              # Main server file
│   ├── models/
│   │   └── User.ts           # User model and database
│   ├── routes/
│   │   ├── auth.ts           # Authentication routes
│   │   └── users.ts          # User management routes
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── errorHandler.ts   # Error handling middleware
│   │   └── validation.ts     # Input validation middleware
│   └── utils/
│       └── jwt.ts            # JWT utility functions
├── package.json
├── tsconfig.json
├── config.env               # Environment configuration template
├── setup.sh                 # Automated setup script
└── README.md
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm (comes with Node.js)

### Quick Setup

1. **Clone or download this repository**

2. **Run the automated setup:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

### Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Create environment file:**
   ```bash
   cp config.env .env
   ```

4. **Edit environment variables:**
   ```bash
   # Edit .env file with your configuration
   nano .env
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `config.env`:

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

## 🚀 Running the Server

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

### Health Check
```bash
curl http://localhost:5000/health
```

### Login Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medpro.com",
    "password": "admin123"
  }'
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

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/logout-all` | Logout from all devices | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/validate` | Validate token | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/login-attempts` | Get login attempts (Admin) | Yes |
| GET | `/api/auth/sessions` | Get active sessions (Admin) | Yes |

### User Management

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/users` | Get all users | Yes | Admin |
| GET | `/api/users/:id` | Get user by ID | Yes | Self or Admin |
| POST | `/api/users` | Create new user | Yes | Admin |
| PUT | `/api/users/:id` | Update user | Yes | Self or Admin |
| PUT | `/api/users/:id/change-password` | Change password | Yes | Self |
| PUT | `/api/users/:id/deactivate` | Deactivate user | Yes | Admin |
| PUT | `/api/users/:id/activate` | Activate user | Yes | Admin |
| DELETE | `/api/users/:id` | Delete user | Yes | Admin |

## 🔗 Frontend Integration

This backend is designed to work with the Medical Insurance Web App frontend. Update your frontend API calls to use:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';

// Login
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});

// Authenticated requests
const response = await fetch(`${API_BASE_URL}/auth/me`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Signed with secret key
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS Protection**: Configured origins only
- **Security Headers**: Helmet middleware
- **Input Validation**: Comprehensive validation
- **Session Management**: Automatic expiration
- **Login Attempt Tracking**: Security monitoring

## 🔍 Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## 🧪 Development Commands

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

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure Node.js version is 18+
4. Check that the port is available

## 🎉 Success!

Once everything is set up correctly, you should see:

- ✅ Backend API running on `http://localhost:5000`
- ✅ Health check endpoint responding
- ✅ Login working with test credentials
- ✅ JWT tokens being generated and validated
- ✅ Role-based access control functioning

The backend API is ready to serve your Medical Insurance Web App! 🚀