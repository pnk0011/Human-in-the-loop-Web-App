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
  success: boolean;
  user?: Omit<User, 'password'>;
  token?: string;
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
  private users: User[] = data.users;
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
      // Simulate API delay
      await delay(800);

      const { email, password } = credentials;

      // Validate input
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      if (!isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Find user by email
      const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        this.recordLoginAttempt(email, false);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        this.recordLoginAttempt(email, false);
        return {
          success: false,
          error: 'Account is deactivated. Please contact administrator.'
        };
      }

      // Verify password
      if (!verifyPassword(password, user.password)) {
        this.recordLoginAttempt(email, false);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Generate token
      const token = generateToken(user.id);

      // Create session
      const session: Session = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        token,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        isActive: true
      };

      this.sessions.push(session);

      // Update user's last login
      user.lastLogin = new Date().toISOString();

      // Record successful login attempt
      this.recordLoginAttempt(email, true);

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
        token
      };

    } catch (error) {
      console.error('Login API error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  async logout(token: string): Promise<{ success: boolean }> {
    try {
      await delay(300);

      // Find and deactivate session
      const sessionIndex = this.sessions.findIndex(s => s.token === token && s.isActive);
      
      if (sessionIndex !== -1) {
        this.sessions[sessionIndex].isActive = false;
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Logout API error:', error);
      return { success: false };
    }
  }

  async validateToken(token: string): Promise<{ valid: boolean; user?: Omit<User, 'password'> }> {
    try {
      await delay(200);

      const session = this.sessions.find(s => s.token === token && s.isActive);
      
      if (!session) {
        return { valid: false };
      }

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        session.isActive = false;
        return { valid: false };
      }

      const user = this.users.find(u => u.id === session.userId);
      
      if (!user || !user.isActive) {
        return { valid: false };
      }

      const { password: _, ...userWithoutPassword } = user;
      return { valid: true, user: userWithoutPassword };

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
