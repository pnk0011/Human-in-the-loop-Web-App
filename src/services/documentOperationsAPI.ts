// Get API base URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat';

// Get API key from environment variable
const API_KEY = (import.meta as any).env?.VITE_HEADER_KEY || 'jLGO7tJFHxB0bVc0UmGe6Esns9pkiJR8V3lV8qJ5';

// Assign Reviewer API Interfaces
export interface AssignReviewerRequest {
  first_named_insured: string[];
  reviewer_assigned: string;
  qc_assigned?: string;
  status: string;
}

export interface AssignReviewerResponse {
  status: string;
  message: string;
  reviewer_assigned?: string;
  qc_assigned?: string;
  total_entity_rows_updated?: number;
  updated_accounts_summary?: Array<{
    first_named_insured: string;
    rows_updated: number;
  }>;
}

// Reviewer Dashboard API Interfaces
export interface GetReviewerDocumentsRequest {
  reviewer_assigned: string;
  page?: number;
  limit?: number;
  status?: string;
  first_named_insured?: string;
}

export interface ReviewerDocument {
  id: number;
  first_named_insured: string;
  document_count: number;
  description_summary: string;
  reviewer_assigned: string;
  qc_assigned: string | null;
  status: string;
  is_active: boolean;
}

export interface GetReviewerDocumentsResponse {
  status: string;
  message: string;
  stats?: {
    Assigned_accounts: number;
    Completed_accounts: number;
    Assigned_policies?: number;
    Completed_policies?: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
  files?: ReviewerDocument[];
  policies?: ReviewerDocument[]; // new key from API
  error?: string;
}

// Review File API Interfaces
export interface ReviewFileRequest {
  first_named_insured: string;
}

export interface ReviewerPolicyDocument {
  doc_handle: string;
  presigned_url: string;
  exposure_data?: Record<string, any>[];
  account_data?: Record<string, any>[];
  loss_data?: Record<string, any>[];
}

export interface ReviewFileResponse {
  status?: string;
  message?: string;
  first_named_insured?: string;
  document_count?: number;
  documents?: ReviewerPolicyDocument[];
  error?: string;
}

// Reviewer update policy documents (save field corrections)
export interface ReviewerUpdatePolicyRequest {
  table_name: string;
  action: string;
  id: number | string;
  data: Record<string, any>;
}

export interface ReviewerUpdatePolicyResponse {
  status?: string;
  message?: string;
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
  qc_assigned: string;
  page?: number;
  limit?: number;
  status?: string;
  first_named_insured?: string;
}

export interface QCDocument {
  id: number;
  first_named_insured: string;
  document_count: number;
  description_summary: string;
  reviewer_assigned: string | null;
  qc_assigned: string | null;
  status: string;
  is_active: boolean;
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
    Assigned_accounts: number;
    Completed_accounts: number;
    Policy_Assigned?: number;
    Total_Filtered_Records?: number;
  };
  files?: QCDocument[];
  policies?: QCDocument[]; // new key from API
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
  first_named_insured: string;
}

export interface QCOpenFileResponse {
  status?: string;
  message?: string;
  first_named_insured?: string;
  document_count?: number;
  documents?: ReviewerPolicyDocument[];
  error?: string;
}

export interface QCDocumentField {
  entity_type: string;
  entity_value: string;
  confidence: number;
  updated_entity_text: string | null;
  reviewer_action: 'accept' | 'correct' | 'reject';
  reviewer_comment: string | null;
  qc_action?: 'approve' | 'reject' | 'sendback' | null;
  qc_comment?: string | null;
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
      const requestBody = {
        first_named_insured: params.first_named_insured,
        reviewer_assigned: params.reviewer_assigned,
        qc_assigned: params.qc_assigned,
        status: params.status,
      };

      const response = await this.makeRequest<AssignReviewerResponse>('/admin-assign-reviewer', {
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
      const query = new URLSearchParams();
      query.append('reviewer_assigned', params.reviewer_assigned);
      query.append('page', (params.page || 1).toString());
      query.append('limit', (params.limit || 25).toString());

      if (params.status) {
        query.append('status', params.status);
      }

      if (params.first_named_insured) {
        query.append('first_named_insured', params.first_named_insured);
      }

      const endpoint = `/reviewer-get-assigned-policies?${query.toString()}`;

      const raw = await this.makeRequest<GetReviewerDocumentsResponse>(endpoint, {
        method: 'GET',
      });
      const normalized: GetReviewerDocumentsResponse = { ...raw };

      // Normalize list key
      const list = (raw as any).policies || raw.files || [];
      normalized.files = list;

      // Normalize stats keys
      if (raw.stats) {
        normalized.stats = {
          Assigned_accounts: raw.stats.Assigned_accounts ?? raw.stats.Assigned_policies ?? 0,
          Completed_accounts: raw.stats.Completed_accounts ?? raw.stats.Completed_policies ?? 0,
          Assigned_policies: raw.stats.Assigned_policies,
          Completed_policies: raw.stats.Completed_policies,
        };
      }

      return normalized;
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Failed to fetch reviewer documents',
        files: [],
        pagination: {
          page: params.page || 1,
          limit: params.limit || 25,
          total_records: 0,
          total_pages: 0,
        },
      };
    }
  }

  // Review File API
  async reviewFile(params: ReviewFileRequest): Promise<ReviewFileResponse> {
    try {
      const response = await this.makeRequest<ReviewFileResponse>('/reviewer-view-policy-documents', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return response;
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to fetch file details',
      };
    }
  }

  async reviewerUpdatePolicyDocuments(params: ReviewerUpdatePolicyRequest): Promise<ReviewerUpdatePolicyResponse> {
    try {
      const response = await this.makeRequest<ReviewerUpdatePolicyResponse>('/reviewer-update-policy-documents', {
        method: 'PUT',
        body: JSON.stringify(params),
      });
      return response;
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Failed to update policy documents',
        error: error.message,
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
      qc_assigned: params.qc_assigned,
      page: (params.page || 1).toString(),
      limit: (params.limit || 25).toString(),
    });

    if (params.status) {
      queryParams.append('status', params.status);
    }

    if (params.first_named_insured) {
      queryParams.append('first_named_insured', params.first_named_insured);
    }

    const raw = await this.makeRequest<GetQCDocumentsResponse>(`/qc-get-assigned-policies?${queryParams}`, {
      method: 'GET',
    });

    const normalized: GetQCDocumentsResponse = { ...raw };
    const list = (raw as any).policies || raw.files || [];
    normalized.files = list;

    if (raw.stats) {
      normalized.stats = {
        Assigned_accounts: raw.stats.Assigned_accounts ?? raw.stats.Policy_Assigned ?? 0,
        Completed_accounts: raw.stats.Completed_accounts ?? 0,
        Policy_Assigned: raw.stats.Policy_Assigned,
        Total_Filtered_Records: raw.stats.Total_Filtered_Records,
      };
    }

    return normalized;
  }

  async qcOpenFile(params: QCOpenFileRequest): Promise<QCOpenFileResponse> {
    // API expects { first_named_insured: string }
    return this.makeRequest<QCOpenFileResponse>('/qc-view-policy-documents', {
      method: 'POST',
      body: JSON.stringify({
        first_named_insured: params.first_named_insured,
      }),
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
