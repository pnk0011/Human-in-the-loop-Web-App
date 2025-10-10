import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { backendAPI, LoginRequest, LoginResponse, ValidateResponse } from '../services/backendAPI';

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
          
          // Validate token with backend API
          const validation = await backendAPI.validateToken();
          
          if (validation.success && validation.data) {
            setUser(validation.data.user);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('user');
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
      const response: LoginResponse = await backendAPI.login(loginRequest);

      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      } else {
        setLoginError(response.error || 'Login failed');
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
      await backendAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    }

    setUser(null);
    localStorage.removeItem('user');
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