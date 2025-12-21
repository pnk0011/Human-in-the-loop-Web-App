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
  accountName: string;
  documentCount: number;
  descriptionSummary?: string;
  reviewerAssigned?: string | null;
  qcAssigned?: string | null;
  status?: 'New' | 'In Progress' | 'Pending Review' | 'On Hold' | 'Completed' | 'Reassigned';
  isActive?: boolean;
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
  const [stats, setStats] = useState<{
    Assigned_accounts: number;
    Completed_accounts: number;
  } | undefined>();
  
  // Load API data for real documents (fetch status=2 OR status=4)
  useEffect(() => {
    const loadApiData = async () => {
      if (user?.email) {
        setIsLoading(true);
        try {
          // Base params shared by the API request
          const accumulatedFiles: ReviewerDocument[] = [];
          let collectedStats: typeof stats | undefined;
          let page = 1;
          const pageSize = 50;

          while (true) {
            const response = await documentOperationsAPI.getReviewerDocuments({
              reviewer_assigned: user.email,
              status: '2',
              page,
              limit: pageSize,
            });

            if (response.status !== 'success') {
              break;
            }

            const list = response.files || [];
            if (list.length) {
              accumulatedFiles.push(...list);
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
  }, [user?.email]);

  // Load completed documents for work history tab
  useEffect(() => {
    const loadCompletedDocuments = async () => {
      if (user?.email && activeTab === 'Work History') {
        setIsLoadingCompleted(true);
        try {
          const params: GetReviewerDocumentsRequest = {
            reviewer_assigned: user.email,
            page: 1,
            limit: 100, // Load more completed documents for history
            status: '3',
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
      const docId = doc.id ? doc.id.toString() : `account-${index}`;

      return {
        id: docId,
        accountName: doc.first_named_insured,
        documentCount: doc.document_count,
        descriptionSummary: doc.description_summary,
        reviewerAssigned: doc.reviewer_assigned,
        qcAssigned: doc.qc_assigned,
        status: getStatusFromApiResponse(doc.status),
        isActive: doc.is_active,
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
      id: doc.id ? doc.id.toString() : doc.first_named_insured,
      documentName: doc.first_named_insured,
      documentType: 'Policy',
      completedDate: new Date().toISOString().split('T')[0],
      fieldsCount: doc.document_count,
      acceptedCount: 0, // Not available in API response
      correctedCount: 0, // Not available in API response
      rejectedCount: 0, // Not available in API response
      accuracy: 100,
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