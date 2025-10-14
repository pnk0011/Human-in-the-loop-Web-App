import data from '../data.json';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Reviewer' | 'QC';
  permissions: string[];
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
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
  token: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a simple token (in real app, use JWT)
const generateToken = (userId: string): string => {
  return `token_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Hash password (in real app, use proper hashing like bcrypt)
const hashPassword = (password: string): string => {
  // Simple hash for demo purposes - in production use bcrypt
  return btoa(password + '_salt');
};

// Verify password
const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

export class AuthAPI {
  private static instance: AuthAPI;
  private users: User[] = data.users.map(user => ({
    ...user,
    role: user.role as 'Admin' | 'Reviewer' | 'QC'
  }));
  private loginAttempts: LoginAttempt[] = data.loginAttempts;
  private sessions: Session[] = data.sessions;

  static getInstance(): AuthAPI {
    if (!AuthAPI.instance) {
      AuthAPI.instance = new AuthAPI();
    }
    return AuthAPI.instance;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const { email, password } = credentials;
      console.log('🔐 Login attempt:', { email, password });

      // Validate input
      if (!email || !password) {
        console.log('❌ Missing email or password');
        return {
          status: 'error',
          message: 'Email and password are required',
          error: 'Email and password are required'
        };
      }

      if (!isValidEmail(email)) {
        console.log('❌ Invalid email format');
        return {
          status: 'error',
          message: 'Invalid email format',
          error: 'Invalid email format'
        };
      }

      // Static admin login bypass
      if (email.toLowerCase() === 'admin@medpro.com' && password === 'admin123') {
        console.log('✅ Static admin login successful');
        
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
        
        // Store user data in localStorage for session management
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('accessToken', `token_${adminUser.email}_${Date.now()}`);
        
        return {
          status: 'success',
          message: 'Login successful',
          user: adminUser
        };
      }

      // For other users, call the real login API
      const response = await fetch('https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('🌐 API Response:', data);

      if (!response.ok) {
        console.log('❌ API request failed:', response.status, data);
        return {
          status: 'error',
          message: data.error || data.message || 'Login failed',
          error: data.error || data.message || 'Login failed'
        };
      }

      if (data.status === 'success' && data.user) {
        console.log('✅ Login successful:', data.user);
        
        // Store user data in localStorage for session management
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', `token_${data.user.email}_${Date.now()}`);
        
        return {
          status: 'success',
          message: data.message,
          user: data.user
        };
      } else {
        console.log('❌ Login failed:', data.message);
        return {
          status: 'error',
          message: data.message || 'Login failed',
          error: data.message || 'Login failed'
        };
      }

    } catch (error: any) {
      console.error('❌ Login API error:', error);
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
      
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('Logout API error:', error);
      return { success: false };
    }
  }

  async validateToken(): Promise<{ valid: boolean; user?: any }> {
    try {
      // Check if user data exists in localStorage
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      
      if (!userData || !token) {
        return { valid: false };
      }

      const user = JSON.parse(userData);
      console.log('🔍 Token validation - user found:', user);
      
      return { valid: true, user };

    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false };
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      await delay(500);
      return this.users.filter(user => user.isActive);
    } catch (error) {
      console.error('Get users error:', error);
      return [];
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      await delay(300);
      return this.users.find(user => user.id === id) || null;
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  }

  private recordLoginAttempt(email: string, success: boolean): void {
    const attempt: LoginAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      success,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1', // In real app, get from request
      userAgent: navigator.userAgent
    };

    this.loginAttempts.push(attempt);

    // Keep only last 100 attempts
    if (this.loginAttempts.length > 100) {
      this.loginAttempts = this.loginAttempts.slice(-100);
    }
  }

  // Get login attempts for analytics
  async getLoginAttempts(): Promise<LoginAttempt[]> {
    try {
      await delay(300);
      return [...this.loginAttempts];
    } catch (error) {
      console.error('Get login attempts error:', error);
      return [];
    }
  }

  // Get active sessions
  async getActiveSessions(): Promise<Session[]> {
    try {
      await delay(300);
      return this.sessions.filter(session => session.isActive);
    } catch (error) {
      console.error('Get active sessions error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const authAPI = AuthAPI.getInstance();
