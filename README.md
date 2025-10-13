# Human-in-the-Loop Web App

A modern React-based web application for medical insurance data validation with role-based access control, document management, and quality assurance workflows.

## 🚀 Features

- **Role-based Access Control** (Admin, Reviewer, QC)
- **Document Validation Workflows**
- **Quality Assurance (QC) Reviews**
- **User Management** for Admins
- **Document Assignment** and tracking
- **Real-time Progress Tracking**
- **Responsive Design** for all devices
- **Dark/Light Theme** support
- **Performance Optimized** with React.memo and lazy loading
- **TypeScript Support** for type safety
- **Modern UI Components** with Tailwind CSS

## 📁 Project Structure

```
human-in-the-loop-web-app/
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── ValidationScreen.tsx
│   │   └── ...
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── hooks/               # Custom hooks
│   ├── services/            # API services
│   └── main.tsx            # Application entry point
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm (comes with Node.js)

### Setup

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
- Hot reload enabled
- Fast refresh for React components
- TypeScript compilation

### Production Build
```bash
npm run build
```
- Optimized bundle for production
- Minified assets
- Tree shaking enabled

## 👥 User Roles

The application supports three user roles with different permissions:

### Admin
- Full system access
- User management
- Document assignment
- Analytics and reporting
- System settings

### Reviewer  
- Document validation
- Field correction and acceptance
- History viewing
- Document processing

### QC (Quality Control)
- QC validation of reviewed documents
- Quality assurance workflows
- Review history access
- Document approval/sendback decisions

## 🔐 Test Credentials

For testing purposes, you can use these credentials:

| Email | Password | Role | Status |
|-------|----------|------|--------|
| admin@medpro.com | admin123 | Admin | Active |
| reviewer@medpro.com | reviewer123 | Reviewer | Active |
| qc@medpro.com | qc123 | QC | Active |

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern component library

### State Management
- **React Context** - Global state management
- **Custom Hooks** - Reusable stateful logic
- **Local Storage** - Persistent user sessions

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 🎨 Design Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Theme** - Toggle between themes
- **Modern UI** - Clean and intuitive interface
- **Accessibility** - WCAG compliant components
- **Loading States** - Smooth user experience
- **Error Boundaries** - Graceful error handling
- **Performance Optimized** - Lazy loading and memoization

## 📱 Responsive Design

The application is fully responsive and works across all device sizes:

- **Desktop** (1024px+)
- **Tablet** (768px - 1023px)  
- **Mobile** (320px - 767px)

## 🎯 Key Features

### Document Validation
- Extract and validate field data from documents
- Confidence scoring for extracted data
- Manual correction capabilities
- Batch processing workflows

### Quality Assurance
- QC review of validated documents
- Approval/sendback decisions
- Quality metrics tracking
- Reviewer performance monitoring

### User Management
- Role-based access control
- User creation and management
- Activity tracking
- Permission management

## 🧪 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🚀 Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder to your hosting service:**
   - Vercel, Netlify, AWS S3, or any static hosting
   - The built files are in the `dist` directory

3. **Environment Configuration:**
   - Update API endpoints in your environment configuration
   - Configure any necessary environment variables

## 🐛 Troubleshooting

### Common Issues

1. **Port 5173 already in use:**
   ```bash
   # Vite will automatically use the next available port
   # Or specify a different port:
   npm run dev -- --port 3000
   ```

2. **Build errors:**
   ```bash
   # Clean and rebuild
   rm -rf dist node_modules
   npm install
   npm run build
   ```

3. **TypeScript errors:**
   ```bash
   # Check TypeScript configuration
   npm run type-check
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

1. Check the browser console for error messages
2. Verify all dependencies are installed correctly
3. Ensure Node.js version is 18+
4. Check that the port is available

## 🎉 Getting Started

Once everything is set up correctly, you should see:

- ✅ Development server running on `http://localhost:5173`
- ✅ Hot reload working for React components
- ✅ Login working with test credentials
- ✅ Role-based access control functioning
- ✅ Responsive design working across devices

The Human-in-the-Loop Web App is ready for development! 🚀