import React, { useState, useEffect } from "react";
import { QCHeader } from "./AppHeader";
import { Button } from "./ui/button";
import { DashboardStats } from "./DashboardStats";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { QCWorkHistory } from "./QCWorkHistory";
import { ChevronUp, ChevronDown, FileText, Loader2 } from "lucide-react";
import { documentOperationsAPI, GetQCDocumentsRequest, QCDocument } from "../services/documentOperationsAPI";
import { documentAPI } from "../services/documentAPI";
import { useAuth } from "../contexts/AuthContext";

interface QCDashboardProps {
  onValidateClick: (item: any) => Promise<void>;
  onViewHistoryClick?: (doc: any) => void;
  onLogout: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

type SortField =
  | "document"
  | "reviewer"
  | "priority"
  | "reviewedDate";
type SortDirection = "asc" | "desc";

export function QCDashboard({
  onValidateClick,
  onViewHistoryClick,
  onLogout,
  theme,
  onToggleTheme,
}: QCDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Current Queue");
  const [documentType, setDocumentType] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [reviewerFilter, setReviewerFilter] = useState("all");

  const [docIdFilter, setDocIdFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(
    null,
  );
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");
  const [apiDocuments, setApiDocuments] = useState<QCDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    "Assigned Documents": number;
    "Assigned_files": number;
    "Critical_files": number;
    "Completed_today": number;
  } | undefined>();
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [uniqueDocIds, setUniqueDocIds] = useState<string[]>([]);
  const [isLoadingDocIds, setIsLoadingDocIds] = useState(false);
  const [reviewers, setReviewers] = useState<string[]>([]);
  const [isLoadingReviewers, setIsLoadingReviewers] = useState(false);
  const [completedDocuments, setCompletedDocuments] = useState<QCDocument[]>([]);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);

  // Handle validate click with per-item loading state
  const handleValidateClick = async (item: any) => {
    setLoadingItemId(item.id);
    try {
      await onValidateClick(item);
    } finally {
      // Add a small delay to make loading state more visible
      setTimeout(() => {
        setLoadingItemId(null);
      }, 100);
    }
  };

  // Load unique document IDs for QC user
  useEffect(() => {
    const loadUniqueDocIds = async () => {
      if (user?.email) {
        setIsLoadingDocIds(true);
        try {
          const response = await documentAPI.getUniqueDocumentIds(undefined, user.email);
          
          if (response.status === 'success') {
            const docIds = response.doc_handle_ids || response.data || [];
            setUniqueDocIds(Array.isArray(docIds) ? docIds : []);
          }
        } catch (error) {
          // Failed to load QC unique document IDs
        } finally {
          setIsLoadingDocIds(false);
        }
      }
    };
    
    loadUniqueDocIds();
  }, [user?.email]);

  // Load reviewers assigned to QC user
  useEffect(() => {
    const loadReviewers = async () => {
      if (user?.email) {
        setIsLoadingReviewers(true);
        try {
          const response = await documentOperationsAPI.getReviewersAssignedToQC(user.email);
          
          if (response.status === 'success' && response.reviewers) {
            // Extract email addresses from reviewer objects
            const reviewerEmails = Array.isArray(response.reviewers) 
              ? response.reviewers.map((reviewer: { email: string; quality_control: string }) => reviewer.email)
              : [];
            setReviewers(reviewerEmails);
          }
        } catch (error) {
          // Failed to load QC reviewers
        } finally {
          setIsLoadingReviewers(false);
        }
      }
    };
    
    loadReviewers();
  }, [user?.email]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [documentType, priorityFilter, reviewerFilter, docIdFilter]);

  // Reset to page 1 when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Load API data for QC documents
  useEffect(() => {
    const loadApiData = async () => {
      if (user?.email) {
        setIsLoading(true);
        try {
          const params: GetQCDocumentsRequest = {
            quality_control: user.email,
            page: currentPage,
            limit: itemsPerPage,
            doc_type_name: documentType !== 'all' ? documentType : 'All',
            priority: priorityFilter !== 'all' ? priorityFilter : 'All',
            status: '3', // Always use status=3 (QC Pending) for QC review queue
            reviewer: reviewerFilter !== 'all' ? reviewerFilter : 'All',
            doc_handle_id: docIdFilter !== 'all' ? docIdFilter : undefined,
          };
          
          const response = await documentOperationsAPI.getQCDocuments(params);
          if (response.status === 'success') {
            // Always set apiDocuments, even if empty array
            setApiDocuments(response.files || []);
            if (response.stats) {
              setStats(response.stats);
            }
            if (response.pagination) {
              setTotalRecords(Number(response.pagination.total_records) || (response.files?.length ?? 0));
              setTotalPages(Number(response.pagination.total_pages) || 1);
              const apiPage = Number(response.pagination.page) || 1;
              if (apiPage !== currentPage) {
                setCurrentPage(apiPage);
              }
            } else {
              setTotalRecords(response.files?.length ?? 0);
              setTotalPages(1);
            }
          } else {
            // Set empty array if response status is not success
            setApiDocuments([]);
            setTotalRecords(0);
            setTotalPages(0);
          }
        } catch (error) {
          // Failed to load QC documents - set empty array
          setApiDocuments([]);
          setTotalRecords(0);
          setTotalPages(0);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadApiData();
  }, [user?.email, documentType, priorityFilter, reviewerFilter, docIdFilter, currentPage, itemsPerPage]);

  // Load completed documents for work history tab (status=1)
  useEffect(() => {
    const loadCompletedDocuments = async () => {
      if (user?.email && activeTab === 'Work History') {
        setIsLoadingCompleted(true);
        try {
          const params: GetQCDocumentsRequest = {
            quality_control: user.email,
            page: 1,
            limit: 100,
            status: '1', // Fetch records with status=1 (Completed) for QC work history
          };

          const response = await documentOperationsAPI.getQCDocuments(params);
          if (response.status === 'success' && response.files) {
            setCompletedDocuments(response.files);
          } else {
            setCompletedDocuments([]);
          }
        } catch (error) {
          setCompletedDocuments([]);
        } finally {
          setIsLoadingCompleted(false);
        }
      }
    };

    loadCompletedDocuments();
  }, [user?.email, activeTab]);

  // Convert completed QCDocuments to QCCompletedDocument format for WorkHistory
  const convertCompletedDocumentsToWorkHistory = () => {
    return completedDocuments.map((doc) => ({
      id: `${doc.file_name}_${doc.doc_handle_id}`,
      documentName: doc.file_name,
      documentType: doc.doc_type_name || 'Unknown',
      reviewer: doc.reviewer_assigned || 'Unknown Reviewer',
      completedDate: doc.qc_completed_dt?.split(' ')[0] || new Date().toISOString().split('T')[0],
      reviewedDate: doc.qc_completed_dt?.split(' ')[0] || new Date().toISOString().split('T')[0],
      fieldsCount: doc.distinct_entity_type_count,
      approvedCount: 0, // Not available in API response
      sentBackCount: 0, // Not available in API response
      passRate: Math.round(doc.avg_confidence_percentage), // Use confidence as pass rate
    }));
  };

  // Convert API documents to original QC queue format
  const convertApiDocumentsToQCQueue = () => {
    return apiDocuments.map((doc, index) => ({
      id: `${doc.file_name}_${doc.doc_handle_id}` || `DOC-${index + 1}`,
      doc_handle_id: doc.doc_handle_id, // Add doc_handle_id for display
      document: doc.file_name,
      type: doc.doc_type_name || 'Unknown',
      reviewer: doc.reviewer_assigned || 'Unknown Reviewer',
      reviewedDate: doc.qc_completed_dt?.split(' ')[0] || new Date().toISOString().split('T')[0],
      fieldsReviewed: doc.distinct_entity_type_count,
      priority: doc.priority as 'High' | 'Medium' | 'Low',
      status: getQCStatusFromApiResponse(doc.status),
    }));
  };

  // Helper function to convert API status to QC status display
  const getQCStatusFromApiResponse = (status: string): string => {
    switch (status) {
      case '1':
        return 'Completed';
      case '3':
        return 'QC Pending';
      case '2':
        return 'Reviewer Assigned';
      case '4':
        return 'Reviewer Reassigned';
      default:
        return 'QC Pending'; // Default fallback
    }
  };

  // Helper function to get status badge color
  const getQCStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'Completed':
        return 'bg-green-600 text-white';
      case 'QC Pending':
        return 'bg-[#FFC018] text-white';
      case 'Reviewer Assigned':
        return 'bg-[#0292DC] text-white';
      case 'Reviewer Reassigned':
        return 'bg-[#F59E0B] text-white';
      default:
        return 'bg-[#0292DC]/10 text-[#0292DC]';
    }
  };

  // Sample data - documents that have been reviewed by reviewers
  const qcQueue = [
    {
      id: "DOC-001",
      document: "Medicare_Claim_2024_001.pdf",
      type: "Medicare Claim",
      reviewer: "John Doe",
      reviewedDate: "2024-03-15",
      fieldsReviewed: 5,
      priority: "High" as const,
      status: "Pending QC",
    },
    {
      id: "DOC-002",
      document: "Policy_Amendment_5678.pdf",
      type: "Policy Amendment",
      reviewer: "Sarah Smith",
      reviewedDate: "2024-03-15",
      fieldsReviewed: 8,
      priority: "Medium" as const,
      status: "Pending QC",
    },
    {
      id: "DOC-003",
      document: "Senior_Care_Invoice_947.pdf",
      type: "Invoice",
      reviewer: "John Doe",
      reviewedDate: "2024-03-14",
      fieldsReviewed: 5,
      priority: "High" as const,
      status: "Pending QC",
    },
    {
      id: "DOC-004",
      document: "Healthcare_Authorization_234.pdf",
      type: "Authorization Form",
      reviewer: "Mike Johnson",
      reviewedDate: "2024-03-14",
      fieldsReviewed: 6,
      priority: "Medium" as const,
      status: "Pending QC",
    },
    {
      id: "DOC-005",
      document: "Claim_Adjustment_789.pdf",
      type: "Claim Adjustment",
      reviewer: "Sarah Smith",
      reviewedDate: "2024-03-13",
      fieldsReviewed: 7,
      priority: "Low" as const,
      status: "Pending QC",
    },
    {
      id: "DOC-006",
      document: "Healthcare_EOB_332.pdf",
      type: "EOB",
      reviewer: "John Doe",
      reviewedDate: "2024-03-13",
      fieldsReviewed: 4,
      priority: "Medium" as const,
      status: "Pending QC",
    },
    {
      id: "DOC-007",
      document: "Prescription_Form_889.pdf",
      type: "Prescription",
      reviewer: "Sarah Smith",
      reviewedDate: "2024-03-12",
      fieldsReviewed: 3,
      priority: "Low" as const,
      status: "Pending QC",
    },
    {
      id: "DOC-008",
      document: "Insurance_Claim_456.pdf",
      type: "Insurance Claim",
      reviewer: "Mike Johnson",
      reviewedDate: "2024-03-12",
      fieldsReviewed: 9,
      priority: "High" as const,
      status: "Pending QC",
    },
  ];

  // Use API documents if available, otherwise use mock data
  // Use only API data, no fallback to dummy data
  const dataSource = convertApiDocumentsToQCQueue();
  
  const filteredQueue = dataSource.filter((item) => {
    const matchesType =
      documentType === "all" ||
      item.type
        .toLowerCase()
        .includes(documentType.toLowerCase());
    const matchesPriority =
      priorityFilter === "all" || item.priority === priorityFilter;
    const matchesReviewer =
      reviewerFilter === "all" || item.reviewer === reviewerFilter;
    const matchesDocId =
      docIdFilter === "all" || (item as any).doc_handle_id === docIdFilter;

    return (
      matchesType &&
      matchesPriority &&
      matchesReviewer &&
      matchesDocId
    );
  });

  const displayTotalItems = totalRecords || filteredQueue.length;
  const computedTotalPages =
    totalPages || Math.max(Math.ceil(filteredQueue.length / itemsPerPage), 1);
  const startIndex =
    displayTotalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex =
    displayTotalItems === 0
      ? 0
      : Math.min(currentPage * itemsPerPage, displayTotalItems);
  const paginatedQueue = filteredQueue;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(
        sortDirection === "asc" ? "desc" : "asc",
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const resetFilters = () => {
    setDocumentType("all");
    setPriorityFilter("all");
    setReviewerFilter("all");
    setDocIdFilter("all");
    setCurrentPage(1);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-[#FF0081]";
      case "Medium":
        return "text-[#FFC018]";
      case "Low":
        return "text-[#80989A]";
      default:
        return "text-[#80989A]";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a]">
      <QCHeader 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={onLogout} 
        theme={theme} 
        onToggleTheme={onToggleTheme} 
      />

      {/* Main Content */}
      <main className="p-6 w-full">
        {activeTab === "Current Queue" ? (
          <>
            {/* Stats */}
            <DashboardStats stats={stats ? {
              Assigned_documents: stats["Assigned Documents"],
              Assigned_files: stats["Assigned_files"],
              Critical_files: stats["Critical_files"],
              Completed_today: stats["Completed_today"],
            } : undefined} />

            <div className="space-y-6 mt-6">
              {/* Filters */}
              <div className="bg-white dark:bg-[#2a2a2a] p-6 rounded-lg shadow-sm border border-[#E5E7EB] dark:border-[#3a3a3a]">
                <h3 className="text-[#012F66] dark:text-white mb-4">
                  Filter Documents
                </h3>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="w-full md:w-auto md:min-w-[150px]">
                    <label className="block text-[#012F66] dark:text-white mb-2">
                      Document Type
                    </label>
                    <Select
                      value={documentType}
                      onValueChange={setDocumentType}
                    >
                      <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Types
                        </SelectItem>
                        <SelectItem value="Large Claim Review Form">Large Claim Review Form</SelectItem>
                        <SelectItem value="Actuarial/UW/Pricing Tools">Actuarial/UW/Pricing Tools</SelectItem>
                        <SelectItem value="Reinsurance">Reinsurance</SelectItem>
                        <SelectItem value="Indication/Quote">Indication/Quote</SelectItem>
                        <SelectItem value="Endorsement">Endorsement</SelectItem>
                        <SelectItem value="Green Card">Green Card</SelectItem>
                        <SelectItem value="Finance Agreement">Finance Agreement</SelectItem>
                        <SelectItem value="Policy Form">Policy Form</SelectItem>
                        <SelectItem value="Additional Risk">Additional Risk</SelectItem>
                        <SelectItem value="Reporting Endorsement">Reporting Endorsement</SelectItem>
                        <SelectItem value="zDup - Loss Run">zDup - Loss Run</SelectItem>
                        <SelectItem value="Loss Run">Loss Run</SelectItem>
                        <SelectItem value="zDup - Stat Notice/Non-Renewal">zDup - Stat Notice/Non-Renewal</SelectItem>
                        <SelectItem value="Expiration/Effective/Retro Date">Expiration/Effective/Retro Date</SelectItem>
                        <SelectItem value="Return Mail">Return Mail</SelectItem>
                        <SelectItem value="Policy">Policy</SelectItem>
                        <SelectItem value="Assessments">Assessments</SelectItem>
                        <SelectItem value="Invoice">Invoice</SelectItem>
                        <SelectItem value="Application">Application</SelectItem>
                        <SelectItem value="Stat Notice/Non-Renewal">Stat Notice/Non-Renewal</SelectItem>
                        <SelectItem value="zDup - Broker of Record (BOR)">zDup - Broker of Record (BOR)</SelectItem>
                        <SelectItem value="Address (not practice loc)">Address (not practice loc)</SelectItem>
                        <SelectItem value="zDup - Actuarial/UW/Pricing Tools">zDup - Actuarial/UW/Pricing Tools</SelectItem>
                        <SelectItem value="zDup - Indication/Quote">zDup - Indication/Quote</SelectItem>
                        <SelectItem value="Cash Application">Cash Application</SelectItem>
                        <SelectItem value="Processing Form">Processing Form</SelectItem>
                        <SelectItem value="Referral/Documentation">Referral/Documentation</SelectItem>
                        <SelectItem value="Coverage">Coverage</SelectItem>
                        <SelectItem value="Broker of Record (BOR)">Broker of Record (BOR)</SelectItem>
                        <SelectItem value="Fund Documentation">Fund Documentation</SelectItem>
                        <SelectItem value="Cancellation">Cancellation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full md:w-auto md:min-w-[150px]">
                    <label className="block text-[#012F66] dark:text-white mb-2">
                      Priority
                    </label>
                    <Select
                      value={priorityFilter}
                      onValueChange={setPriorityFilter}
                    >
                      <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Priorities
                        </SelectItem>
                        <SelectItem value="High">
                          High
                        </SelectItem>
                        <SelectItem value="Medium">
                          Medium
                        </SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full md:w-auto md:min-w-[150px]">
                    <label className="block text-[#012F66] dark:text-white mb-2">
                      Reviewer
                    </label>
                    <Select
                      value={reviewerFilter}
                      onValueChange={setReviewerFilter}
                    >
                      <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white" disabled={isLoadingReviewers}>
                        <SelectValue placeholder={isLoadingReviewers ? "Loading Reviewers..." : "All Reviewers"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Reviewers
                        </SelectItem>
                        {reviewers.map((reviewer) => (
                          <SelectItem key={reviewer} value={reviewer}>
                            {reviewer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>



                  <div className="w-full md:w-auto md:min-w-[150px]">
                    <label className="block text-[#012F66] dark:text-white mb-2">
                      Document ID
                    </label>
                    <Select
                      value={docIdFilter}
                      onValueChange={setDocIdFilter}
                    >
                      <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white" disabled={isLoadingDocIds}>
                        <SelectValue placeholder={isLoadingDocIds ? "Loading IDs..." : "All Document IDs"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Document IDs
                        </SelectItem>
                        {uniqueDocIds.map((docId) => (
                          <SelectItem key={docId} value={docId}>
                            {docId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-auto md:min-w-[150px]">
                    <label className="block text-[#012F66] dark:text-white mb-2">
                      Show
                    </label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white hover:bg-[#F9FAFB] dark:hover:bg-[#3a3a3a] cursor-pointer"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              {/* QC Queue Table */}
              <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm overflow-hidden border border-[#E5E7EB] dark:border-[#3a3a3a]">
                {/* Table Header */}
                <div className="px-6 py-5 border-b border-[#E5E7EB] dark:border-[#3a3a3a] flex items-center justify-between bg-gradient-to-r from-[#012F66] to-[#0292DC]">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white">
                        QC Review Queue
                      </h3>
                      <p className="text-white/80">
                        Review and approve reviewer validations
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F9FAFB] dark:bg-[#1a1a1a] border-b border-[#E5E7EB] dark:border-[#3a3a3a]">
                      <tr>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          Document ID
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          <button
                            onClick={() =>
                              handleSort("document")
                            }
                            className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            Filename{" "}
                            <SortIcon field="document" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          File Type
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          <button
                            onClick={() =>
                              handleSort("reviewer")
                            }
                            className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            Reviewer{" "}
                            <SortIcon field="reviewer" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          <button
                            onClick={() =>
                              handleSort("reviewedDate")
                            }
                            className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            Reviewed Date{" "}
                            <SortIcon field="reviewedDate" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          Fields
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          <button
                            onClick={() =>
                              handleSort("priority")
                            }
                            className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            Priority{" "}
                            <SortIcon field="priority" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-[#012F66] dark:text-white">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#3a3a3a]">
                      {isLoading ? (
                        // Loading skeleton rows
                        Array.from({ length: 5 }, (_, index) => (
                          <tr
                            key={`loading-${index}`}
                            className="hover:bg-[#F9FAFB]/50 dark:hover:bg-[#3a3a3a]/50 transition-colors"
                          >
                            <td className="px-6 py-5">
                              <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-24 font-mono"></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded-lg animate-pulse"></div>
                                <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-32"></div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-20"></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-24"></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-20"></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="h-8 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded-full animate-pulse w-16"></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-16"></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="h-6 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded-full animate-pulse w-20"></div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="h-8 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-16 ml-auto"></div>
                            </td>
                          </tr>
                        ))
                      ) : paginatedQueue.length === 0 ? (
                        // Empty state when no documents found
                        <tr>
                          <td colSpan={9} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center justify-center" style={{ padding: '20px' }}>
                              <div className="w-16 h-16 bg-[#F5F7FA] dark:bg-[#3a3a3a] rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-[#80989A] dark:text-[#a0a0a0]" />
                              </div>
                              <h3 className="text-lg font-semibold text-[#012F66] dark:text-white mb-2">
                                No Documents Found
                              </h3>
                              <p className="text-[#80989A] dark:text-[#a0a0a0] text-center mb-4 max-w-md">
                                {apiDocuments.length === 0 && !isLoading
                                  ? "No documents found. Try adjusting your filters or check back later."
                                  : "No documents match your current filters. Try adjusting your search criteria or reset the filters."
                                }
                              </p>
                              {(documentType !== 'all' || priorityFilter !== 'all' || reviewerFilter !== 'all' || docIdFilter !== 'all' || (apiDocuments.length === 0 && !isLoading)) && (
                                <Button
                                  onClick={resetFilters}
                                  variant="outline"
                                  className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white cursor-pointer"
                                >
                                  Reset Filters
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedQueue.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#F9FAFB]/50 dark:hover:bg-[#3a3a3a]/50 transition-colors"
                        >
                          <td className="px-6 py-5">
                            <div className="text-[#80989A] dark:text-[#a0a0a0] font-mono">
                              {(item as any).doc_handle_id || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#0292DC]/10 to-[#012F66]/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-[#0292DC]" />
                              </div>
                              <div>
                                <div className="text-[#012F66] dark:text-white">
                                  {item.document}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[#80989A] dark:text-[#a0a0a0]">
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[#012F66] dark:text-white">
                              {item.reviewer}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[#80989A] dark:text-[#a0a0a0]">
                              {item.reviewedDate}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-[#012F66] dark:text-white">
                            <span className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-full bg-[#0292DC]/10 text-[#0292DC] flex items-center justify-center">
                                {item.fieldsReviewed}
                              </span>
                              <span className="text-[#80989A] dark:text-[#a0a0a0]">
                                fields
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`flex items-center gap-2 ${getPriorityColor(item.priority)}`}
                            >
                              <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                              {item.priority}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <Badge className={getQCStatusBadgeColor(item.status)}>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <Button
                              onClick={() => handleValidateClick(item)}
                              disabled={loadingItemId === item.id || item.status === 'Completed'}
                              className="bg-[#0292DC] hover:bg-[#012F66] text-white transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {loadingItemId === item.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                'Review'
                              )}
                            </Button>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>


                {/* Pagination */}
                {filteredQueue.length > 0 && (
                  <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-[#3a3a3a] flex items-center justify-between">
                    <div className="text-[#80989A] dark:text-[#a0a0a0]">
                      {displayTotalItems > 0
                        ? `Showing ${startIndex}-${endIndex} of ${displayTotalItems} items`
                        : 'No items'}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((p) => p - 1)
                        }
                        className="border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white disabled:opacity-50 cursor-pointer"
                      >
                        Previous
                      </Button>
                      {Array.from({ length: computedTotalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={
                            currentPage === page
                              ? "default"
                              : "outline"
                          }
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "bg-[#0292DC] hover:bg-[#012F66] text-white cursor-pointer"
                              : "border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white cursor-pointer"
                          }
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        disabled={
                          currentPage >=
                          computedTotalPages
                        }
                        onClick={() =>
                          setCurrentPage((p) => p + 1)
                        }
                        className="border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white disabled:opacity-50 cursor-pointer"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : activeTab === "Work History" ? (
          <QCWorkHistory
            onViewClick={onViewHistoryClick || (() => {})}
            documents={convertCompletedDocumentsToWorkHistory()}
            isLoading={isLoadingCompleted}
          />
        ) : null}
      </main>
    </div>
  );
}