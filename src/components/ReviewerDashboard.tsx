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
}

interface ReviewerDashboardProps {
  onValidateClick?: (item: QueueItem) => void;
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

  // Load API data for real documents
  useEffect(() => {
    const loadApiData = async () => {
      if (user?.email) {
        try {
          const params: GetReviewerDocumentsRequest = {
            reviewer: user.email,
            page: 1,
            limit: 25,
            doc_type_name: 'All',
            priority: 'All',
            status: 'All',
          };
          
          const response = await documentOperationsAPI.getReviewerDocuments(params);
          if (response.status === 'success' && response.documents) {
            setApiDocuments(response.documents);
          }
        } catch (error) {
          console.error('Failed to load API documents:', error);
        }
      }
    };

    loadApiData();
  }, [user?.email]);

  // Simulate data loading (same as original Dashboard)
  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsDataLoading(false);
    };
    loadData();
  }, []);

  // Convert API documents to QueueItem format for compatibility
  const convertApiDocumentsToQueueItems = (): QueueItem[] => {
    return apiDocuments.map((doc, index) => ({
      id: doc.doc_handle_id || `doc-${index}`,
      document: doc.file_name,
      type: doc.doc_type_name || 'Unknown',
      field: `${doc.distinct_entity_type_count} fields`, // Use field count as field info
      confidence: Math.round(doc.avg_confidence_percentage),
      priority: doc.priority,
      age: doc.age_assigned || '0d 0h',
      assignedTo: 'Reviewer', // Set to 'Reviewer' to match filter
      fieldsCount: doc.distinct_entity_type_count,
      status: getStatusFromApiResponse(doc.status),
      extractedValue: 'See document', // Dummy value
      fieldDescription: 'Review document fields', // Dummy value
      expectedFormat: 'Various formats', // Dummy value
    }));
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

  // Handle validation click with API integration
  const handleValidateClick = (item: QueueItem) => {
    if (onValidateClick) {
      onValidateClick(item);
    } else {
      // Default behavior - log for debugging
      console.log('Opening document for validation:', item);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a]">
      <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
      
      <main className="p-6 max-w-[1400px] mx-auto">
        {isDataLoading ? (
          <>
            <LoadingDashboardStats />
            <LoadingTable rows={8} />
          </>
        ) : activeTab === 'Current Queue' ? (
          <>
            <DashboardStats />
            <ValidationQueue 
              onValidateClick={handleValidateClick}
              // Pass API documents converted to QueueItem format
              apiDocuments={convertApiDocumentsToQueueItems()}
            />
          </>
        ) : activeTab === 'Work History' ? (
          <WorkHistory onViewClick={onViewHistoryClick || (() => {})} />
        ) : null}
      </main>
    </div>
  );
}