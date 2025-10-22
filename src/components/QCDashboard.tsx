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
import { useAuth } from "../contexts/AuthContext";

interface QCDashboardProps {
  onValidateClick: (item: any) => void;
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(
    null,
  );
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");
  const itemsPerPage = 5;
  const [apiDocuments, setApiDocuments] = useState<QCDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load API data for QC documents
  useEffect(() => {
    const loadApiData = async () => {
      if (user?.email) {
        setIsLoading(true);
        try {
          const params: GetQCDocumentsRequest = {
            quality_control: user.email,
            page: 1,
            limit: 25,
            doc_type_name: documentType !== 'all' ? documentType : 'All',
            priority: priorityFilter !== 'all' ? priorityFilter : 'All',
            status: statusFilter !== 'all' ? statusFilter : 'All',
            reviewer: reviewerFilter !== 'all' ? reviewerFilter : 'All',
          };
          
          const response = await documentOperationsAPI.getQCDocuments(params);
          if (response.status === 'success' && response.documents) {
            setApiDocuments(response.documents);
          }
        } catch (error) {
          console.error('Failed to load QC documents:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadApiData();
  }, [user?.email, documentType, priorityFilter, statusFilter, reviewerFilter]);

  // Convert API documents to original QC queue format
  const convertApiDocumentsToQCQueue = () => {
    return apiDocuments.map((doc, index) => ({
      id: doc.doc_handle_id || `DOC-${index + 1}`,
      document: doc.file_name,
      type: doc.doc_type_name || 'Unknown',
      reviewer: doc.reviewer_assigned || 'Unknown Reviewer',
      reviewedDate: doc.qc_update_dt?.split(' ')[0] || new Date().toISOString().split('T')[0],
      fieldsReviewed: doc.distinct_entity_type_count,
      priority: doc.priority as 'High' | 'Medium' | 'Low',
      status: 'Pending QC', // Default status for QC queue
    }));
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
  const dataSource = apiDocuments.length > 0 ? convertApiDocumentsToQCQueue() : qcQueue;
  
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
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return (
      matchesType &&
      matchesPriority &&
      matchesReviewer &&
      matchesStatus
    );
  });

  const totalItems = filteredQueue.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQueue = filteredQueue.slice(
    startIndex,
    endIndex,
  );

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
    setStatusFilter("all");
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

  const stats = [
    { label: "Pending QC Review", value: qcQueue.length },
    { label: "Approved Today", value: 12 },
    { label: "Sent Back", value: 3 },
    { label: "Avg Accuracy", value: "89%" },
  ];

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
      <main className="p-6 max-w-[1400px] mx-auto">
        {activeTab === "Current Queue" ? (
          <>
            {/* Stats */}
            <DashboardStats stats={stats} />

            <div className="space-y-6 mt-6">
              {/* Filters */}
              <div className="bg-white dark:bg-[#2a2a2a] p-6 rounded-lg shadow-sm border border-[#E5E7EB] dark:border-[#3a3a3a]">
                <h3 className="text-[#012F66] dark:text-white mb-4">
                  Filter Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-[#012F66] dark:text-white mb-2">
                      Document Type
                    </label>
                    <Select
                      value={documentType}
                      onValueChange={setDocumentType}
                    >
                      <SelectTrigger className="bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Types
                        </SelectItem>
                        <SelectItem value="medicare claim">
                          Medicare Claim
                        </SelectItem>
                        <SelectItem value="invoice">
                          Invoice
                        </SelectItem>
                        <SelectItem value="policy">
                          Policy Amendment
                        </SelectItem>
                        <SelectItem value="authorization">
                          Authorization Form
                        </SelectItem>
                        <SelectItem value="claim">
                          Claim Adjustment
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-[#012F66] dark:text-white mb-2">
                      Priority
                    </label>
                    <Select
                      value={priorityFilter}
                      onValueChange={setPriorityFilter}
                    >
                      <SelectTrigger className="bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
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

                  <div>
                    <label className="block text-[#012F66] dark:text-white mb-2">
                      Reviewer
                    </label>
                    <Select
                      value={reviewerFilter}
                      onValueChange={setReviewerFilter}
                    >
                      <SelectTrigger className="bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                        <SelectValue placeholder="All Reviewers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Reviewers
                        </SelectItem>
                        <SelectItem value="John Doe">
                          John Doe
                        </SelectItem>
                        <SelectItem value="Sarah Smith">
                          Sarah Smith
                        </SelectItem>
                        <SelectItem value="Mike Johnson">
                          Mike Johnson
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-[#012F66] dark:text-white mb-2">
                      Status
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Statuses
                        </SelectItem>
                        <SelectItem value="Pending QC">
                          Pending QC
                        </SelectItem>
                        <SelectItem value="In Review">
                          In Review
                        </SelectItem>
                        <SelectItem value="Approved">
                          Approved
                        </SelectItem>
                        <SelectItem value="Sent Back">
                          Sent Back
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white hover:bg-[#F9FAFB] dark:hover:bg-[#3a3a3a]"
                  >
                    Reset Filters
                  </Button>
                  <Button className="bg-[#0292DC] hover:bg-[#012F66] text-white">
                    Apply Filters
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 bg-white/5"
                    >
                      Export List
                    </Button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F9FAFB] dark:bg-[#1a1a1a] border-b border-[#E5E7EB] dark:border-[#3a3a3a]">
                      <tr>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          <button
                            onClick={() =>
                              handleSort("document")
                            }
                            className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            DOCUMENT{" "}
                            <SortIcon field="document" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          FILE TYPE
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          <button
                            onClick={() =>
                              handleSort("reviewer")
                            }
                            className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            REVIEWER{" "}
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
                            REVIEWED DATE{" "}
                            <SortIcon field="reviewedDate" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          FIELDS
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          <button
                            onClick={() =>
                              handleSort("priority")
                            }
                            className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            PRIORITY{" "}
                            <SortIcon field="priority" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                          STATUS
                        </th>
                        <th className="px-6 py-4 text-right text-[#012F66] dark:text-white">
                          ACTION
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
                      ) : (
                        paginatedQueue.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#F9FAFB]/50 dark:hover:bg-[#3a3a3a]/50 transition-colors"
                        >
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
                            <Badge className="bg-[#0292DC]/10 text-[#0292DC]">
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <Button
                              onClick={() =>
                                onValidateClick(item)
                              }
                              className="bg-[#0292DC] hover:bg-[#012F66] text-white transition-colors"
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredQueue.length === 0 && (
                  <div className="text-center py-12 text-[#80989A] dark:text-[#a0a0a0]">
                    No documents found matching your filters.
                  </div>
                )}

                {/* Pagination */}
                {filteredQueue.length > 0 && (
                  <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-[#3a3a3a] flex items-center justify-between">
                    <div className="text-[#80989A] dark:text-[#a0a0a0]">
                      Showing {startIndex + 1}-
                      {Math.min(endIndex, totalItems)} of{" "}
                      {totalItems} items
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((p) => p - 1)
                        }
                        className="border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white disabled:opacity-50"
                      >
                        Previous
                      </Button>
                      {Array.from(
                        {
                          length: Math.ceil(
                            totalItems / itemsPerPage,
                          ),
                        },
                        (_, i) => i + 1,
                      ).map((page) => (
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
                              ? "bg-[#0292DC] hover:bg-[#012F66] text-white"
                              : "border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white"
                          }
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        disabled={
                          currentPage >=
                          Math.ceil(totalItems / itemsPerPage)
                        }
                        onClick={() =>
                          setCurrentPage((p) => p + 1)
                        }
                        className="border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white disabled:opacity-50"
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
          />
        ) : null}
      </main>
    </div>
  );
}