export interface Document {
  file_name: string;
  doc_handle_id: string;
  doc_type_name: string | null;
  distinct_entity_type_count: number;
  avg_confidence_percentage: number;
  priority: 'High' | 'Medium' | 'Low';
  latest_update_datetime: string;
  reviewer_assigned: string | null;
  qc_assigned: string | null;
  status: string;
}

export interface DocumentsListResponse {
  status: string;
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
  documents?: Document[];
  error?: string;
}

export interface GetDocumentsRequest {
  page?: number;
  limit?: number;
  file_name?: string;
  doc_type_name?: string;
  priority?: string;
  status?: string;
}

class DocumentAPI {
  private baseURL = 'https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat';

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getDocuments(params: GetDocumentsRequest = {}): Promise<DocumentsListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add parameters if they exist
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.file_name) queryParams.append('file_name', params.file_name);
      if (params.doc_type_name) queryParams.append('doc_type_name', params.doc_type_name);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.status) queryParams.append('status', params.status);

      const endpoint = `/get-all-documents?${queryParams.toString()}`;
      const response = await this.makeRequest<DocumentsListResponse>(endpoint, {
        method: 'GET',
      });

      return response;
    } catch (error: any) {
      console.error('Get documents API call failed:', error);
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
        documents: [],
        error: error.message || 'Unknown error occurred'
      };
    }
  }
}

export const documentAPI = new DocumentAPI();
