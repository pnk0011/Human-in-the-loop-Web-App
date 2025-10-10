import { User } from '../contexts/AuthContext';

const API_BASE_URL = 'http://localhost:5000/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
  error?: string;
  code?: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
  };
  error?: string;
  code?: string;
}

export interface ValidateResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    permissions: string[];
  };
  error?: string;
  code?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: any;
}

class BackendAPI {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && data.code === 'INVALID_TOKEN') {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry the original request with new token
            config.headers = {
              ...config.headers,
              'Authorization': `Bearer ${this.accessToken}`,
            };
            const retryResponse = await fetch(url, config);
            return retryResponse.json();
          }
        }
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }

    return response;
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
      });
      
      this.clearTokens();
      return response;
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      this.clearTokens();
      return { success: true, message: 'Logged out locally' };
    }
  }

  async validateToken(): Promise<ValidateResponse> {
    return this.makeRequest<ValidateResponse>('/auth/validate');
  }

  async getCurrentUser(): Promise<{ success: boolean; data: { user: User } }> {
    return this.makeRequest<{ success: boolean; data: { user: User } }>('/auth/me');
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await this.makeRequest<RefreshResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.success && response.data) {
        this.accessToken = response.data.accessToken;
        localStorage.setItem('accessToken', this.accessToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.json();
  }
}

export const backendAPI = new BackendAPI();
