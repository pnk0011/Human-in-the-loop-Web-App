import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'Admin' | 'Reviewer' | 'QC';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@medpro.com',
    name: 'Admin User',
    role: 'Admin',
    permissions: [
      'user.manage',
      'document.assign',
      'analytics.view',
      'settings.manage',
      'document.validate',
      'document.qc',
      'history.view'
    ],
    isActive: true
  },
  {
    id: '2',
    email: 'reviewer@medpro.com',
    name: 'Reviewer User',
    role: 'Reviewer',
    permissions: [
      'document.validate',
      'history.view'
    ],
    isActive: true
  },
  {
    id: '3',
    email: 'qc@medpro.com',
    name: 'QC User',
    role: 'QC',
    permissions: [
      'document.qc',
      'history.view'
    ],
    isActive: true
  }
];

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Admin: [
    'user.manage',
    'document.assign',
    'analytics.view',
    'settings.manage',
    'document.validate',
    'document.qc',
    'history.view'
  ],
  Reviewer: [
    'document.validate',
    'history.view'
  ],
  QC: [
    'document.qc',
    'history.view'
  ]
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in mock database
      const foundUser = mockUsers.find(u => u.email === email && u.isActive);
      
      if (foundUser) {
        // In a real app, you would verify the password here
        const userWithPermissions = {
          ...foundUser,
          permissions: ROLE_PERMISSIONS[foundUser.role],
          lastLogin: new Date()
        };
        
        setUser(userWithPermissions);
        localStorage.setItem('user', JSON.stringify(userWithPermissions));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) ?? false;
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for role-based access control
export function withRoleAccess<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[],
  fallback?: React.ComponentType
) {
  return function RoleProtectedComponent(props: P) {
    const { hasAnyRole, isLoading } = useAuth();
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    if (!hasAnyRole(allowedRoles)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent />;
      }
      return (
        <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-[#012F66] dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-[#80989A] dark:text-[#a0a0a0] mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#0292DC] hover:bg-[#012F66] text-white px-4 py-2 rounded"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

// Permission-based component wrapper
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  fallback?: React.ComponentType
) {
  return function PermissionProtectedComponent(props: P) {
    const { hasPermission, isLoading } = useAuth();
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    if (!hasPermission(permission)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent />;
      }
      return null;
    }
    
    return <Component {...props} />;
  };
}
