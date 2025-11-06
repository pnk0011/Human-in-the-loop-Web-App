// Get API base URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat';

// Get API key from environment variable
const API_KEY = (import.meta as any).env?.VITE_API_KEY || 'jLGO7tJFHxB0bVc0UmGe6Esns9pkiJR8V3lV8qJ5';

export interface User {
  id: string;
  name: string;
  email: string;
  pwd: string;
  role: 'Admin' | 'Reviewer' | 'QC';
  permissions: string[];
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  pwd: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: 'Admin' | 'Reviewer' | 'QC';
    isActive: boolean;
    created_time: string;
    last_login: string | null;
    qualityControl: string | null;
  };
  error?: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Session {
  id: string;
  userId: string;
  tdata: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a simple tdata (in real app, use JWT)
const generateToken = (userId: string): string => {
  return `token_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Hash pwd (in real app, use proper hashing like bcrypt)
const hashPassword = (pwd: string): string => {
  // Simple hash for demo purposes - in production use bcrypt
  return btoa(pwd + '_salt');
};

// Verify pwd
const verifyPassword = (pwd: string, hashedPassword: string): boolean => {
  return hashPassword(pwd) === hashedPassword;
};

export class AuthAPI {
  private static instance: AuthAPI;

  static getInstance(): AuthAPI {
    if (!AuthAPI.instance) {
      AuthAPI.instance = new AuthAPI();
    }
    return AuthAPI.instance;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const { email, pwd } = credentials;

      // Validate input
      if (!email || !pwd) {
        return {
          status: 'error',
          message: 'Email and password are required',
          error: 'Email and password are required'
        };
      }

      if (!isValidEmail(email)) {
        return {
          status: 'error',
          message: 'Invalid email format',
          error: 'Invalid email format'
        };
      }

      // Static admin login bypass
      if (email.toLowerCase() === 'admin@medpro.com' && pwd === 'admin123') {
        const adminUser = {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@medpro.com',
          role: 'Admin' as const,
          isActive: true,
          created_time: new Date().toISOString(),
          last_login: new Date().toISOString(),
          qualityControl: null
        };
        
        // Don't store user data here - let AuthContext handle it
        
        return {
          status: 'success',
          message: 'Login successful',
          user: adminUser
        };
      }

      // For other users, call the real login API
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ email, 'password' : pwd }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          status: 'error',
          message: data.error || data.message || 'Login failed',
          error: data.error || data.message || 'Login failed'
        };
      }

      if (data.status === 'success' && data.user) {
        // Don't store user data here - let AuthContext handle it
        
        return {
          status: 'success',
          message: data.message,
          user: data.user
        };
      } else {
        return {
          status: 'error',
          message: data.message || 'Login failed',
          error: data.message || 'Login failed'
        };
      }

    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'An unexpected error occurred. Please try again.',
        error: error.message || 'An unexpected error occurred. Please try again.'
      };
    }
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  async validateToken(): Promise<{ valid: boolean; user?: any }> {
    try {
      // Check if user data exists in localStorage
      const userData = localStorage.getItem('user');
      const tdata = localStorage.getItem('accessToken');
      
      if (!userData || !tdata) {
        return { valid: false };
      }

      const user = JSON.parse(userData);
      
      return { valid: true, user };

    } catch (error) {
      return { valid: false };
    }
  }
}

// Export singleton instance
export const authAPI = AuthAPI.getInstance();
