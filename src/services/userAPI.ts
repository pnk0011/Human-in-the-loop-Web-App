export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: 'Admin' | 'Reviewer' | 'QC';
  password: string;
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
  currentLoad?: number;
  totalValidated?: number;
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
  pagination?: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
  users?: User[];
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
    const token = this.getAuthToken();
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      // For now, we'll use the external API endpoint for user creation
      // You can modify this to use your actual API base URL
      const baseURL = 'https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat';
      const url = `${baseURL}${endpoint}`;
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('User API request failed:', error);
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
      console.error('Create user API call failed:', error);
      throw error;
    }
  }

  async getUsers(page: number = 1, limit: number = 10, search?: string, roleFilter?: string, statusFilter?: string): Promise<UsersListResponse> {
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
      console.error('Get users API call failed:', error);
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
      console.error('Update user API call failed:', error);
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
      console.error('Delete user API call failed:', error);
      throw error;
    }
  }
}

export const userAPI = new UserAPI();
