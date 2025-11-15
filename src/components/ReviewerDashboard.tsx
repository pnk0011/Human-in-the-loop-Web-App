import React, { useState, useEffect } from 'react';
import { DashboardHeader } from './AppHeader';
import { DashboardStats } from './DashboardStats';
import { ValidationQueue } from './ValidationQueue';
import { WorkHistory } from './WorkHistory';
import { LoadingDashboardStats, LoadingTable } from './LoadingComponents';
import { useLoading } from '../hooks/useLoading';
import { documentOperationsAPI, GetReviewerDocumentsRequest, ReviewerDocument } from '../services/documentOperationsAPI';
import { useAuth } from '../contexts/AuthContext';

interface QueueItem {
  id: string;
  document: string;
  type: string;
  field: string;
  confidence: number;
  priority: 'High' | 'Medium' | 'Low';
  age: string;
  assignedTo: string;
  fieldsCount?: number;
  status?: 'New' | 'In Progress' | 'Pending Review' | 'On Hold' | 'Completed' | 'Reassigned';
  extractedValue?: string;
  fieldDescription?: string;
  expectedFormat?: string;
  doc_handle_id?: string;
}

interface ReviewerDashboardProps {
  onValidateClick?: (item: QueueItem) => Promise<void>;
  onViewHistoryClick?: (doc: any) => void;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function ReviewerDashboard({ onValidateClick, onViewHistoryClick, onLogout, theme, onToggleTheme }: ReviewerDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Current Queue');
  const { loading: dashboardLoading, withLoading } = useLoading({ delay: 300 });
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [apiDocuments, setApiDocuments] = useState<ReviewerDocument[]>([]);
  const [completedDocuments, setCompletedDocuments] = useState<ReviewerDocument[]>([]);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [documentType, setDocumentType] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [docIdFilter, setDocIdFilter] = useState('all');
  const [stats, setStats] = useState<{
    Assigned_documents: number;
    Assigned_files: number;
    Critical_files: number;
    Completed_today: number;
  } | undefined>();
  
  // Load API data for real documents (fetch status=2 OR status=4)
  useEffect(() => {
    const loadApiData = async () => {
      if (user?.email) {
        setIsLoading(true);
        try {
          // Base params shared by the API request
          const baseParams: GetReviewerDocumentsRequest = {
            reviewer: user.email,
            doc_type_name: documentType !== 'all' ? documentType : 'All',
            priority: priorityFilter !== 'all' ? priorityFilter : 'All',
            doc_handle_id: docIdFilter !== 'all' ? docIdFilter : undefined,
          };

          const accumulatedFiles: ReviewerDocument[] = [];
          let collectedStats: typeof stats | undefined;
          let page = 1;
          const pageSize = 50;

          while (true) {
            const response = await documentOperationsAPI.getReviewerDocuments({
              ...baseParams,
              status: 'STATUS_IN_2_4',
              page,
              limit: pageSize,
            });

            if (response.status !== 'success') {
              break;
            }

            if (response.files?.length) {
              accumulatedFiles.push(...response.files);
            }

            if (!collectedStats && response.stats) {
              collectedStats = response.stats;
            }

            if (response.pagination) {
              const currentPage = Number(response.pagination.page ?? page);
              const totalPagesFromApi = Number(response.pagination.total_pages ?? 1);
              if (!Number.isFinite(totalPagesFromApi) || currentPage >= totalPagesFromApi) {
                break;
              }
            } else {
              break;
            }

            page += 1;
          }

          setApiDocuments(accumulatedFiles);

          setStats(collectedStats ?? undefined);
        } catch (error) {
          // Failed to load API documents - set empty array
          setApiDocuments([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadApiData();
  }, [user?.email, documentType, priorityFilter, docIdFilter]);

  // Load completed documents for work history tab
  useEffect(() => {
    const loadCompletedDocuments = async () => {
      if (user?.email && activeTab === 'Work History') {
        setIsLoadingCompleted(true);
        try {
          const params: GetReviewerDocumentsRequest = {
            reviewer: user.email,
            page: 1,
            limit: 100, // Load more completed documents for history
            doc_type_name: 'All',
            priority: 'All',
            status: '1', // Status '3' means 'Completed'
          };
          
          const response = await documentOperationsAPI.getReviewerDocuments(params);
          if (response.status === 'success' && response.files) {
            setCompletedDocuments(response.files);
          }
        } catch (error) {
          // Failed to load completed documents
        } finally {
          setIsLoadingCompleted(false);
        }
      }
    };

    loadCompletedDocuments();
  }, [user?.email, activeTab]);

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsDataLoading(false);
    };
    loadData();
  }, []);

  const convertApiDocumentsToQueueItems = (): QueueItem[] => {
    return apiDocuments.map((doc, index) => {
      const docId = `${doc.file_name}_${doc.doc_handle_id}` || `doc-${index}`;
      // Use the field count from API response
      const fieldsToReview = doc.distinct_entity_type_count;
      
      return {
        id: docId,
        document: doc.file_name,
        type: doc.doc_type_name || 'Unknown',
        field: `${fieldsToReview} fields`,
        confidence: Math.round(doc.avg_confidence_percentage),
        priority: doc.priority,
        age: doc.age_assigned || '0d 0h',
        assignedTo: 'Reviewer', // Set to 'Reviewer' to match filter
        fieldsCount: fieldsToReview,
        status: getStatusFromApiResponse(doc.status),
        extractedValue: 'See document', // Dummy value
        fieldDescription: 'Review document fields', // Dummy value
        expectedFormat: 'Various formats', // Dummy value
        doc_handle_id: doc.doc_handle_id, // Add doc_handle_id for display in table
      };
    });
  };

  // Helper function to map API status to display status
  const getStatusFromApiResponse = (apiStatus: string): 'New' | 'In Progress' | 'Pending Review' | 'On Hold' | 'Completed' | 'Reassigned' => {
    switch (apiStatus) {
      case '1':
        return 'Completed';
      case '2':
        return 'New';
      case '3':
        return 'Completed';
      case '4':
        return 'Reassigned';
      default:
        return 'New';
    }
  };

  // Convert completed API documents to CompletedDocument format for WorkHistory
  const convertCompletedDocumentsToWorkHistory = () => {
    return completedDocuments.map((doc) => ({
      id: `${doc.file_name}_${doc.doc_handle_id}`,
      documentName: doc.file_name,
      documentType: doc.doc_type_name || 'Unknown',
      completedDate: doc.reviewer_update_dt ? doc.reviewer_update_dt.split(' ')[0] : new Date().toISOString().split('T')[0],
      fieldsCount: doc.distinct_entity_type_count,
      acceptedCount: 0, // Not available in API response
      correctedCount: 0, // Not available in API response
      rejectedCount: 0, // Not available in API response
      accuracy: Math.round(doc.avg_confidence_percentage), // Use confidence as accuracy
    }));
  };

  // Handle validation click with API integration
  const handleValidateClick = async (item: QueueItem) => {
    if (onValidateClick) {
      await onValidateClick(item);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a]">
      <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
      
              <main className="p-6 w-full">
        {isDataLoading ? (
          <>
            <LoadingDashboardStats />
            <LoadingTable rows={8} />
          </>
        ) : activeTab === 'Current Queue' ? (
          <>
            <DashboardStats stats={stats} />
            <ValidationQueue 
              onValidateClick={handleValidateClick}
              // Pass API documents converted to QueueItem format
              apiDocuments={convertApiDocumentsToQueueItems()}
              reviewerEmail={user?.email}
              documentType={documentType}
              onDocumentTypeChange={setDocumentType}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              docIdFilter={docIdFilter}
              onDocIdFilterChange={setDocIdFilter}
              isLoading={isLoading}
            />
          </>
                  ) : activeTab === 'Work History' ? (
          <WorkHistory 
            onViewClick={onViewHistoryClick || (() => {})} 
            documents={convertCompletedDocumentsToWorkHistory()}
            isLoading={isLoadingCompleted}
          />
          ) : null}
      </main>
    </div>
  );
}