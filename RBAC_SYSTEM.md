# Role-Based Access Control (RBAC) System

This document describes the comprehensive role-based access control system implemented in the Human-in-the-Loop Web App.

## 🔐 Overview

The RBAC system provides secure, role-based access to different features and functionalities within the application. It ensures that users can only access features appropriate to their role and permissions.

## 👥 User Roles

### 1. **Admin**
- **Full system access** with all permissions
- **User management** - Create, edit, delete users
- **Document assignment** - Assign documents to reviewers
- **Analytics access** - View comprehensive system analytics
- **Settings management** - Configure system settings
- **Document validation** - Can validate documents (inherited from Reviewer)
- **QC review** - Can perform QC reviews (inherited from QC)
- **History access** - View all historical data

### 2. **Reviewer**
- **Document validation** - Review and validate extracted data
- **History access** - View personal validation history
- **Queue management** - Manage assigned document queue

### 3. **QC (Quality Control)**
- **QC review** - Review completed validations
- **History access** - View QC review history
- **Approval workflow** - Approve or send back validations

## 🛡️ Permission System

### Permission Structure
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
}
```

### Available Permissions
- `user.manage` - Manage users (Admin only)
- `document.assign` - Assign documents (Admin only)
- `analytics.view` - View analytics (Admin only)
- `settings.manage` - Manage settings (Admin only)
- `document.validate` - Validate documents (Reviewer, Admin)
- `document.qc` - Perform QC reviews (QC, Admin)
- `history.view` - View history (All roles)

## 🔧 Implementation Details

### 1. Authentication Context (`AuthContext.tsx`)
- **Centralized authentication state management**
- **User session persistence** using localStorage
- **Permission checking utilities**
- **Mock user database** for demonstration

### 2. Role Guards (`RoleGuard.tsx`)
- **Component-level access control**
- **Route protection** with fallback components
- **Permission-based rendering**
- **Convenience components** for common role checks

### 3. User Profile Component (`UserProfile.tsx`)
- **User information display**
- **Role indicator** with visual badges
- **Profile dropdown** with logout functionality
- **Theme toggle integration**

## 🚀 Usage Examples

### Basic Role Protection
```tsx
import { RoleGuard } from './components/RoleGuard';

function AdminPanel() {
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <AdminContent />
    </RoleGuard>
  );
}
```

### Permission-Based Rendering
```tsx
import { PermissionGuard } from './components/RoleGuard';

function UserManagement() {
  return (
    <PermissionGuard permission="user.manage">
      <UserManagementContent />
    </PermissionGuard>
  );
}
```

### Convenience Components
```tsx
import { AdminOnly, ReviewerOnly, QCOnly } from './components/RoleGuard';

function Dashboard() {
  return (
    <div>
      <AdminOnly>
        <AdminControls />
      </AdminOnly>
      
      <ReviewerOnly>
        <ReviewerQueue />
      </ReviewerOnly>
      
      <QCOnly>
        <QCReviewPanel />
      </QCOnly>
    </div>
  );
}
```

## 🔑 Authentication Flow

### 1. Login Process
```typescript
const { login } = useAuth();

const handleLogin = async (email: string, password: string) => {
  const success = await login(email, password);
  if (success) {
    // User is authenticated and redirected
  } else {
    // Show error message
  }
};
```

### 2. Session Management
- **Automatic login** from localStorage on app start
- **Session persistence** across browser refreshes
- **Secure logout** with session cleanup

### 3. Access Control
- **Route-level protection** based on authentication status
- **Component-level protection** based on roles and permissions
- **Graceful fallbacks** for unauthorized access

## 🎯 Mock Users for Testing

### Admin User
- **Email**: `admin@medpro.com`
- **Password**: Any password (mock authentication)
- **Role**: Admin
- **Permissions**: All permissions

### Reviewer User
- **Email**: `reviewer@medpro.com`
- **Password**: Any password (mock authentication)
- **Role**: Reviewer
- **Permissions**: `document.validate`, `history.view`

### QC User
- **Email**: `qc@medpro.com`
- **Password**: Any password (mock authentication)
- **Role**: QC
- **Permissions**: `document.qc`, `history.view`

## 🔒 Security Features

### 1. **Input Validation**
- Email format validation
- Password requirements (in production)
- Role assignment validation

### 2. **Access Control**
- **Component-level protection** prevents unauthorized UI rendering
- **Route-level protection** prevents unauthorized page access
- **API-level protection** (ready for backend integration)

### 3. **Session Security**
- **Secure session storage** using localStorage
- **Automatic session cleanup** on logout
- **Session validation** on app initialization

## 🚀 Future Enhancements

### 1. **Backend Integration**
- Replace mock authentication with real API calls
- Implement JWT token-based authentication
- Add password hashing and validation

### 2. **Advanced Permissions**
- **Granular permissions** for specific features
- **Dynamic permission assignment**
- **Permission inheritance** and role hierarchies

### 3. **Audit Logging**
- **User action logging** for security auditing
- **Access attempt tracking**
- **Permission change history**

## 📱 UI/UX Features

### 1. **Role Indicators**
- **Visual role badges** with color coding
- **User profile dropdown** with role information
- **Contextual role display** throughout the app

### 2. **Access Denied Pages**
- **User-friendly error messages** for unauthorized access
- **Clear role requirements** display
- **Navigation options** for authorized users

### 3. **Loading States**
- **Authentication loading** indicators
- **Permission checking** loading states
- **Smooth transitions** between authenticated states

## 🧪 Testing the System

### 1. **Login Testing**
1. Navigate to the login page
2. Use any of the mock user emails
3. Enter any password
4. Verify successful login and role-based redirection

### 2. **Role Testing**
1. Login as different users
2. Verify access to appropriate features
3. Confirm denial of unauthorized features
4. Test logout functionality

### 3. **Permission Testing**
1. Test component-level access control
2. Verify permission-based rendering
3. Confirm fallback behavior for unauthorized access

## 🔧 Configuration

### Environment Variables
```env
VITE_AUTH_ENDPOINT=your-auth-api-endpoint
VITE_USER_MANAGEMENT_ENDPOINT=your-user-api-endpoint
VITE_SESSION_TIMEOUT=3600000
```

### Customization
- **Role definitions** can be modified in `AuthContext.tsx`
- **Permission mappings** can be updated in the `ROLE_PERMISSIONS` object
- **UI components** can be customized in `UserProfile.tsx` and `RoleGuard.tsx`

---

This RBAC system provides a robust foundation for secure, role-based access control that can be easily extended and customized for specific business requirements.
