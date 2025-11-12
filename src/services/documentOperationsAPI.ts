// Get API base URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat';

// Get API key from environment variable
const API_KEY = (import.meta as any).env?.VITE_HEDER_KEY || 'jLGO7tJFHxB0bVc0UmGe6Esns9pkiJR8V3lV8qJ5';

// Assign Reviewer API Interfaces
export interface AssignReviewerRequest {
  file_names: string[];
  reviewer: string;
  qc_assigned?: string; // Made optional
  status: string;
}

export interface AssignReviewerResponse {
  message: string;
  reviewer: string;
  qc_assigned?: string;
  status: string;
  total_entity_rows_updated: number;
  updated_files_summary: Array<{
    file_name: string;
    rows_updated: number;
  }>;
}

// Reviewer Dashboard API Interfaces
export interface GetReviewerDocumentsRequest {
  reviewer: string;
  page?: number;
  limit?: number;
  doc_type_name?: string;
  priority?: string;
  status?: string;
  search?: string; // For searching by file name
  doc_handle_id?: string;
}

export interface ReviewerDocument {
  file_name: string;
  doc_handle_id: string;
  doc_type_name: string | null;
  distinct_entity_type_count: number;
  avg_confidence_percentage: number;
  priority: 'High' | 'Medium' | 'Low';
  reviewer_update_dt: string;
  reviewer_assigned: string;
  qc_assigned: string | null;
  status: string; // '0', '1', '2', '3'
  age_assigned: string;
}

export interface GetReviewerDocumentsResponse {
  status: string;
  message: string;
  stats?: {
    Assigned_documents: number;
    Assigned_files: number;
    Critical_files: number;
    Completed_today: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total_records_filtered: number;
    total_pages: number;
  };
  files?: ReviewerDocument[];
  error?: string;
}

// Review File API Interfaces
export interface ReviewFileRequest {
  file_name: string;
}

export interface ReviewFileEntity {
  entity_type: string;
  entity_value: string;
  updated_entity_value?: string | null;
  reviewer_action?: 'accept' | 'correct' | 'reject' | null;
  qc_action?: 'approve' | 'reject' | 'sendback' | null;
  confidence: number;
  begin_offset?: string;
  end_offset?: string;
}

export interface ReviewFileDocument {
  id: string;
  documentName: string;
  documentType: string | null;
  priority: string;
  fields: ReviewFileEntity[];
  documentImage: string;
  reviewer_updated_dt: string;
  reviewer: string;
  qc_action?: string | null;
}

export interface ReviewFileResponse {
  success: boolean;
  data?: {
    document: ReviewFileDocument;
  };
  error?: string;
}

// Update File API Interfaces
export interface FileValidation {
  entity_type: string;
  reviewer_action: 'accept' | 'correct' | 'reject';
  updated_entity_text?: string | null;
  reviewer_comment?: string | null;
}

export interface UpdateFileRequest {
  file_name: string;
  validations: FileValidation[];
}

export interface UpdateFileResponse {
  message: string;
  total_rows_updated: number;
  error?: string;
}

// QC API Interfaces
export interface GetQCDocumentsRequest {
  quality_control: string;
  page?: number;
  limit?: number;
  doc_type_name?: string;
  priority?: string;
  status?: string;
  reviewer?: string;
  doc_handle_id?: string;
}

export interface QCDocument {
  file_name: string;
  doc_handle_id: string;
  doc_type_name: string | null;
  distinct_entity_type_count: number;
  avg_confidence_percentage: number;
  priority: string;
  qc_completed_dt: string | null;
  reviewer_assigned: string;
  qc_assigned: string;
  status: string;
  age_assigned: string;
}

export interface GetQCDocumentsResponse {
  status: string;
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
  stats?: {
    "Assigned Documents": number;
    "Assigned_files": number;
    "Critical_files": number;
    "Completed_today": number;
  };
  files?: QCDocument[];
}

export interface ReviewerWithQC {
  email: string;
  quality_control: string;
}

export interface ReviewerAssignedToQCResponse {
  status: string;
  message: string;
  reviewers?: ReviewerWithQC[];
  qc_user_requested?: string;
  error?: string;
}

export interface QCOpenFileRequest {
  file_name: string;
}

export interface QCOpenFileResponse {
  success: boolean;
  data: {
    document: {
      id: string;
      documentName: string;
      documentType: string | null;
      priority: string;
      fields: QCDocumentField[];
      documentImage: string;
      qc_updated_dt: string;
      reviewer: string;
    };
  };
}

export interface QCDocumentField {
  entity_type: string;
  entity_value: string;
  confidence: number;
  updated_entity_text: string | null;
  reviewer_action: 'accept' | 'correct' | 'reject';
  reviewer_comment: string | null;
}

export interface QCUpdateFileRequest {
  file_name: string;
  validations: QCValidation[];
}

export interface QCValidation {
  entity_type: string;
  qc_action: 'approve' | 'reject' | 'sendback';
  qc_comment?: string | null;
}

export interface QCUpdateFileResponse {
  message: string;
  total_rows_updated: number;
}

class DocumentOperationsAPI {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          // Add authorization header if needed
          // 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      throw error;
    }
  }

  // Assign Reviewer API
  async assignReviewer(params: AssignReviewerRequest): Promise<AssignReviewerResponse> {
    try {
      // Only include qc_assigned if it exists
      const requestBody: any = {
        file_names: params.file_names,
        reviewer: params.reviewer,
        status: params.status,
      };
      
      if (params.qc_assigned) {
        requestBody.qc_assigned = params.qc_assigned;
      }

      const response = await this.makeRequest<AssignReviewerResponse>('/assign-reviewer', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  // Get Reviewer Documents API
  async getReviewerDocuments(params: GetReviewerDocumentsRequest): Promise<GetReviewerDocumentsResponse> {
    try {
      // Build query parameters exactly as specified in the API documentation
      const query = new URLSearchParams();
      query.append('reviewer', params.reviewer);
      query.append('page', (params.page || 1).toString());
      query.append('limit', (params.limit || 25).toString());
      query.append('doc_type_name', params.doc_type_name || 'All');
      query.append('priority', params.priority || 'All');
      query.append('status', params.status || 'All');
      
      // Add search parameter if provided
      if (params.search) {
        query.append('file_name', params.search);
      }
      
      // Add doc_handle_id parameter if provided
      if (params.doc_handle_id) {
        query.append('doc_handle_id', params.doc_handle_id);
      }

      const queryString = query.toString();
      const endpoint = `/get-all-reviewer-documents?${queryString}`;

      const response = await this.makeRequest<GetReviewerDocumentsResponse>(endpoint, {
        method: 'GET',
      });
      return response;
    } catch (error: any) {
      // Mock response for development/fallback
      return {
        status: 'error',
        message: error.message || 'Failed to fetch reviewer documents',
        files: [],
        pagination: {
          page: params.page || 1,
          limit: params.limit || 25,
          total_records_filtered: 0,
          total_pages: 0,
        },
      };
    }
  }

  // Review File API
  async reviewFile(params: ReviewFileRequest): Promise<ReviewFileResponse> {
    try {
      const response = await this.makeRequest<ReviewFileResponse>('/review-open-file', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch file details',
      };
    }
  }

  // Update File API
  async updateFile(params: UpdateFileRequest): Promise<UpdateFileResponse> {
    try {
      const response = await this.makeRequest<UpdateFileResponse>('/update-file-reviewer', {
        method: 'PUT',
        body: JSON.stringify(params),
      });
      return response;
    } catch (error: any) {
      return {
        message: error.message || 'Failed to update file',
        total_rows_updated: 0,
        error: error.message,
      };
    }
  }

  // QC API Methods
  async getQCDocuments(params: GetQCDocumentsRequest): Promise<GetQCDocumentsResponse> {
    const queryParams = new URLSearchParams({
      quality_control: params.quality_control,
      page: (params.page || 1).toString(),
      limit: (params.limit || 25).toString(),
      doc_type_name: params.doc_type_name || 'All',
      priority: params.priority || 'All',
      status: params.status || 'All',
      reviewer: params.reviewer || 'All',
    });
    
    // Add doc_handle_id if provided
    if (params.doc_handle_id) {
      queryParams.append('doc_handle_id', params.doc_handle_id);
    }

    return this.makeRequest<GetQCDocumentsResponse>(`/get-all-qc-documents?${queryParams}`, {
      method: 'GET',
    });
  }

  async qcOpenFile(params: QCOpenFileRequest): Promise<QCOpenFileResponse> {
    return this.makeRequest<QCOpenFileResponse>('/qc-open-file', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async qcUpdateFile(params: QCUpdateFileRequest): Promise<QCUpdateFileResponse> {
    return this.makeRequest<QCUpdateFileResponse>('/update-file-qc', {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  }

  // Get reviewers assigned to QC user
  async getReviewersAssignedToQC(qcUser: string): Promise<ReviewerAssignedToQCResponse> {
    try {
      const queryParams = new URLSearchParams({
        qc_user: qcUser,
      });

      const response = await this.makeRequest<ReviewerAssignedToQCResponse>(`/get-reviewer-assignedto-qc?${queryParams}`, {
        method: 'GET',
      });
      return response;
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Failed to fetch reviewers',
        reviewers: [],
        error: error.message || 'Unknown error occurred'
      };
    }
  }
}

export const documentOperationsAPI = new DocumentOperationsAPI();
