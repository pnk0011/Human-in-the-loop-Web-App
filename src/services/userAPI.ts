// Get API base URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat';

// Get API key from environment variable
const API_KEY = (import.meta as any).env?.VITE_HEDER_KEY || 'jLGO7tJFHxB0bVc0UmGe6Esns9pkiJR8V3lV8qJ5';

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: 'Admin' | 'Reviewer' | 'QC';
  'password': string;
  qualityControl?: string;
}

export interface UpdateUserRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'Admin' | 'Reviewer' | 'QC';
  isactive?: boolean;
}

export interface DeleteUserRequest {
  email: string;
}

export interface User {
  id?: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string; // For compatibility with component
  role: 'Admin' | 'Reviewer' | 'QC';
  isactive: boolean;
  isActive?: boolean; // For compatibility with component
  status?: 'Active' | 'Inactive'; // For compatibility with component
  created_time: string;
  createdAt?: string; // For compatibility with component
  last_login: string | null;
  lastLogin?: string | null; // For compatibility with component
  quality_control: string | null;
  qualityControl?: string | null; // For compatibility with component
  currentLoad?: number | string;
  totalValidated?: number | string;
  accuracy?: number;
  createdDate?: string; // For compatibility with component
}

export interface UserResponse {
  status: string;
  message: string;
  user?: User;
  Email?: string;
  updates?: any;
  deleted_email?: string;
  error?: string;
}

export interface UsersListResponse {
  status: string;
  message: string;
  stats?: {
    total_users: number;
    active_users: number;
    reviewer_count: number;
    qc_count: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
  users?: User[];
  error?: string;
}

export interface UserStatsResponse {
  status: string;
  message: string;
  stats?: {
    total_users: number;
    active_users: number;
    reviewers_count: number;
    qc_count: number;
  };
  error?: string;
}

class UserAPI {
  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const tdata = this.getAuthToken();
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    };

    if (tdata) {
      defaultHeaders['Authorization'] = `Bearer ${tdata}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      // Use the API base URL from environment variable
      const url = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    try {
      const response = await this.makeRequest<UserResponse>('/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async getUsers(page: number = 1, limit: number = 10, search?: string, roleFilter: string = 'All', statusFilter: string = 'All'): Promise<UsersListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (roleFilter) params.append('rolefilter', roleFilter);
      if (statusFilter) params.append('statusfilter', statusFilter);

      const response = await this.makeRequest<UsersListResponse>(`/get-all-users?${params.toString()}`, {
        method: 'GET',
      });

      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async updateUser(userData: UpdateUserRequest): Promise<UserResponse> {
    try {
      const response = await this.makeRequest<UserResponse>('/update-user', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });

      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async deleteUser(email: string): Promise<UserResponse> {
    try {
      const deleteData: DeleteUserRequest = { email };
      const response = await this.makeRequest<UserResponse>('/delete-user', {
        method: 'DELETE',
        body: JSON.stringify(deleteData),
      });

      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async getStats(): Promise<UserStatsResponse> {
    try {
      const response = await this.makeRequest<UserStatsResponse>('/get-user-stats', {
        method: 'GET',
      });

      return response;
    } catch (error: any) {
      // Mock response for development/fallback
      return {
        status: 'success',
        message: 'User stats retrieved successfully',
        stats: {
          total_users: 0,
          active_users: 0,
          reviewers_count: 0,
          qc_count: 0,
        }
      };
    }
  }
}

export const userAPI = new UserAPI();
