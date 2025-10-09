
# Human-in-the-Loop Web App

A comprehensive validation portal for human in the loop built with React, TypeScript, and modern web technologies. This application provides a streamlined interface for document validation workflows with role-based access control.

## 🚀 Features

### Core Functionality
- **Document Validation** - Review and validate ai extracted data
- **Quality Control (QC)** - Secondary review process for validated documents
- **Admin Dashboard** - Comprehensive analytics and user management
- **Role-Based Access** - Reviewer, QC, and Admin user roles
- **Real-time Updates** - Live queue management and status tracking

### User Experience
- **Responsive Design** - Works seamlessly across multiple browsers
- **Dark/Light Theme** - Toggle between themes for user preference
- **Loading States** - Comprehensive loading system with progress indicators
- **Error Handling** - Robust error boundaries and user feedback
- **Lazy Loading** - Optimized performance with code splitting

### Technical Features
- **TypeScript** - Full type safety and better developer experience
- **React 18** - Latest React features with concurrent rendering
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern, accessible component library
- **Performance Optimized** - React.memo, useMemo, useCallback optimizations

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **UI Components**: Shadcn/ui, Radix UI primitives
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useMemo, useCallback)
- **Routing**: React Router
- **Notifications**: Sonner

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd human-in-the-loop-web-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to view the application

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── figma/           # Figma-specific components
│   └── *.tsx            # Feature components
├── hooks/               # Custom React hooks
├── contexts/            # React context providers
├── styles/              # Global styles
├── guidelines/          # Development guidelines
└── assets/              # Static assets
```

## 🎯 User Roles

### Reviewer
- Validate extracted document fields
- Accept, correct, or reject field values
- View validation history
- Manage document queue

### QC (Quality Control)
- Review completed validations
- Approve or send back for re-validation
- Access QC-specific analytics
- Monitor reviewer performance

### Admin
- User management and role assignment
- Document assignment and queue management
- Comprehensive analytics dashboard
- System configuration

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (if configured)

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_APP_TITLE=Human-in-the-Loop Web App
VITE_API_URL=your-api-url
```

### Theme Configuration
The app supports both light and dark themes. Theme preference is stored in localStorage and persists across sessions.

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)

## 🎨 Design System

Built with a consistent design system featuring:
- **Color Palette**: Blues and grays
- **Typography**: Clean, readable font hierarchy
- **Spacing**: Consistent spacing scale
- **Components**: Accessible, reusable UI components

## 🔒 Security Features

- Role-based access control
- Input validation and sanitization
- Error boundary implementation
- Secure authentication flow

## 📈 Performance Optimizations

- **Code Splitting**: Lazy loading of components
- **Memoization**: React.memo, useMemo, useCallback
- **Bundle Optimization**: Vite's built-in optimizations
- **Image Optimization**: Optimized asset loading
---

Built with ❤️ for efficient human-in-the-loop workflow.