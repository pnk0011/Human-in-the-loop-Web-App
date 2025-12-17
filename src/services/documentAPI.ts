export interface AccountDocument {
  id: number;
  first_named_insured: string;
  document_count: number;
  description_summary: string;
  reviewer_assigned: string | null;
  qc_assigned: string | null;
  status: string;
  is_active: boolean;
}

export interface DocumentsListResponse {
  status: string;
  message: string;
  stats?: {
    Total_accounts: number;
    Assigned_accounts: number;
    Completed_accounts: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
  files?: AccountDocument[];
  error?: string;
}

export interface GetDocumentsRequest {
  page?: number;
  limit?: number;
  search_term?: string;
  status?: string;
}

export interface UniqueDocumentIdsResponse {
  status: string;
  message: string;
  doc_handle_ids?: string[];
  count?: number; // Alternative field name
  data?: string[]; // Alternative field name for document IDs
  error?: string;
}

class DocumentAPI {
  // Get API base URL from environment variable
  private baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat';
  
  // Get API key from environment variable
  private apiKey = (import.meta as any).env?.VITE_HEADER_KEY || 'jLGO7tJFHxB0bVc0UmGe6Esns9pkiJR8V3lV8qJ5';

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  async getDocuments(params: GetDocumentsRequest = {}): Promise<DocumentsListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add parameters if they exist
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search_term) queryParams.append('search_term', params.search_term);
      if (params.status) queryParams.append('status', params.status);

      const endpoint = `/admin-get-unique-policies?${queryParams.toString()}`;
      const response = await this.makeRequest<DocumentsListResponse>(endpoint, {
        method: 'GET',
      });

      return response;
    } catch (error: any) {
      // Mock response for development/fallback
      return {
        status: 'error',
        message: 'Failed to fetch documents',
        pagination: {
          page: 1,
          limit: 10,
          total_records: 0,
          total_pages: 0,
        },
        files: [],
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async getUniqueDocumentIds(reviewer?: string, quality_control?: string): Promise<UniqueDocumentIdsResponse> {
    try {
      // Build URL with optional reviewer or quality_control query parameter
      let url = `${this.baseURL}/get-all-unique-document-id`;
      const params: string[] = [];
      if (reviewer) {
        params.push(`reviewer=${encodeURIComponent(reviewer)}`);
      }
      if (quality_control) {
        params.push(`quality_control=${encodeURIComponent(quality_control)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        status: 'error',
        message: 'Failed to fetch unique document IDs',
        doc_handle_ids: [],
        error: error.message || 'Unknown error occurred'
      };
    }
  }
}

export const documentAPI = new DocumentAPI();
