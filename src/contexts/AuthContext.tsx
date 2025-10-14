import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authAPI, LoginRequest, LoginResponse } from '../services/authAPI';

export type UserRole = 'Admin' | 'Reviewer' | 'QC';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  clearLoginError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to get permissions for a role
const getPermissionsForRole = (role: UserRole): string[] => {
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
  return ROLE_PERMISSIONS[role] || [];
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load user from localStorage on mount and validate token
  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('user');
      
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Validate token with auth API
          const validation = await authAPI.validateToken();
          
          if (validation.valid && validation.user) {
            setUser(validation.user);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
          }
        } catch (error) {
          console.error('Failed to validate token:', error);
          localStorage.removeItem('user');
        }
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const loginRequest: LoginRequest = { email, password };
      const response: LoginResponse = await authAPI.login(loginRequest);

      console.log('🔍 AuthContext received response:', response);
      
      if (response.status === 'success' && response.user) {
        console.log('✅ Setting user in context:', response.user);
        
        // Convert API response to match our User interface
        const userData = {
          id: response.user.email, // Use email as ID
          name: `${response.user.firstName} ${response.user.lastName}`,
          email: response.user.email,
          role: response.user.role,
          permissions: getPermissionsForRole(response.user.role),
          createdAt: response.user.created_time,
          lastLogin: response.user.last_login,
          isActive: response.user.isActive,
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      } else {
        console.log('❌ Login failed in AuthContext:', response.error || response.message);
        setLoginError(response.error || response.message || 'Login failed');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    }

    setUser(null);
    // authAPI.logout() already clears localStorage
  }, []);

  const hasPermission = useCallback((permission: string) => {
    return user?.permissions.includes(permission) || false;
  }, [user]);

  const hasRole = useCallback((role: UserRole) => {
    return user?.role === role || false;
  }, [user]);

  const hasAnyRole = useCallback((roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  const clearLoginError = useCallback(() => {
    setLoginError(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loginError,
    login,
    logout,
    hasPermission,
    hasRole,
    hasAnyRole,
    clearLoginError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}