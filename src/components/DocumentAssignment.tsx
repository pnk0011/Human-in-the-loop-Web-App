import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
import { Users, ChevronUp, ChevronDown, Loader2, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from "sonner";
import { documentAPI, AccountDocument, GetDocumentsRequest } from '../services/documentAPI';
import { documentOperationsAPI, AssignReviewerRequest } from '../services/documentOperationsAPI';

// Document interface is imported from documentAPI service

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Reviewer' | 'QC';
  quality_control?: string;
  currentLoad: number | string;
}

type SortField = 'accountName' | 'documentCount' | 'status' | 'reviewerAssigned' | 'qcAssigned';
type SortDirection = 'asc' | 'desc';

interface AccountRow {
  id: string;
  accountName: string;
  documentCount: number;
  documentIds: string;
  documentsAssigned: number;
  documentsCompleted: number;
  descriptionSummary: string;
  reviewerAssigned: string | null;
  qcAssigned: string | null;
  status: 'Unassigned' | 'Assigned' | 'In Progress' | 'Completed';
  isActive: boolean;
}

// Mock documents removed - now using real API data

// Mock users removed - now using real API data

export function DocumentAssignment() {
  const emptyStats = {
    Total_policies: 0,
    Assigned_policies: 0,
    Completed_policies: 0,
  };
  const [documents, setDocuments] = useState<AccountRow[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [docIdFilter, setDocIdFilter] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPageFromAPI, setCurrentPageFromAPI] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiError, setHasApiError] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [stats, setStats] = useState(emptyStats);
  
  // Loading state for reviewers
  const [isLoadingAllReviewers, setIsLoadingAllReviewers] = useState(false);
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
    setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when docIdFilter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [docIdFilter]);

  // Load accounts on component mount and when filters change
  useEffect(() => {
    loadDocuments();
  }, [currentPage, debouncedSearchQuery, statusFilter, itemsPerPage, docIdFilter]);

  const loadDocuments = async () => {
    setIsLoading(true);
    setHasApiError(false);
    try {
      const params: GetDocumentsRequest = {
        page: currentPage,
        limit: itemsPerPage,
        search_term: debouncedSearchQuery || undefined,
        status:
          statusFilter === 'Unassigned'
            ? 'UD'
            : statusFilter === 'Completed'
              ? '1'
              : statusFilter === 'Assigned'
                ? '2'
                : statusFilter !== 'All'
                  ? statusFilter
                  : undefined,
        documnet_id: docIdFilter || undefined,
      };

      const response = await documentAPI.getDocuments(params);
      
      const apiList = (response as any).policies || response.files;
      if (response.status === 'success' && Array.isArray(apiList)) {
        // Set stats from API response
        if (response.stats) {
          setStats(response.stats);
        }
        
        // Convert API response to match component expectations
        const formattedDocuments: AccountRow[] = apiList.map((doc: AccountDocument) => ({
          id: doc.id.toString(),
          accountName: doc.first_named_insured,
          documentCount: doc.document_count,
          documentIds: (doc as any).doc_handles || '-',
          documentsAssigned: (doc as any).documents_assigned ?? 0,
          documentsCompleted: (doc as any).documents_completed ?? 0,
          descriptionSummary: doc.description_summary,
          reviewerAssigned: doc.reviewer_assigned,
          qcAssigned: doc.qc_assigned,
          status: getStatusFromApi(doc.status),
          isActive: doc.is_active,
        }));
        
        setDocuments(formattedDocuments);
        
        // Set pagination data from API response
        if (response.pagination) {
          setTotalDocuments(response.pagination.total_records);
          setTotalPages(response.pagination.total_pages);
          setCurrentPageFromAPI(response.pagination.page);
          setItemsPerPage(response.pagination.limit);
        } else {
          setTotalDocuments(formattedDocuments.length);
          setTotalPages(1);
          setCurrentPageFromAPI(1);
        }
      } else {
        toast.error(response.message || 'Failed to load accounts');
        setDocuments([]);
        setTotalDocuments(0);
        setTotalPages(0);
        setCurrentPageFromAPI(1);
        setStats(emptyStats);
        setHasApiError(true);
      }
    } catch (error: any) {
      toast.error('Failed to load accounts. Please try again.');
      setDocuments([]);
      setTotalDocuments(0);
      setTotalPages(0);
      setCurrentPageFromAPI(1);
      setStats(emptyStats);
      setHasApiError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert API status to component status
  const getStatusFromApi = (status: string | null): 'Unassigned' | 'Assigned' | 'In Progress' | 'Completed' => {
    switch (status) {
      case '0':
        return 'Unassigned';
      case '1':
        return 'Completed';
      case '2':
        return 'Assigned';
      case '3':
        return 'In Progress';
      default:
        return 'Unassigned';
    }
  };

  const toggleDocument = (id: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDocuments(newSelected);
  };

  const toggleAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map((doc) => doc.id)));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const loadAllUsers = async () => {
    setIsLoadingAllReviewers(true);
    
    try {
      // Use the get-reviewer-assignedto-qc API with qc_user=All to get all reviewers
      // API endpoint: https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-reviewer-assignedto-qc?qc_user=All
      const response = await documentOperationsAPI.getReviewersAssignedToQC('All');
      
      if (response.status === 'success' && response.reviewers && Array.isArray(response.reviewers)) {
        // Convert reviewer objects to User format
        // The API now returns an array of objects with email and quality_control
        const formattedUsers = response.reviewers.map((reviewer: { email: string; quality_control: string }) => ({
          id: reviewer.email, // Use email as ID
          name: reviewer.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), // Format email to name
          email: reviewer.email,
          role: 'Reviewer' as const,
          quality_control: reviewer.quality_control, // Include quality_control from API response
          currentLoad: 'N/A', // API doesn't provide current load
        }));
        
        setUsers(formattedUsers);
      } else {
        // If response doesn't have reviewers array, set empty array
        setUsers([]);
        if (response.status !== 'success') {
          toast.error(response.message || 'Failed to load reviewers');
        }
      }
    } catch (error: any) {
      setUsers([]);
      toast.error('Failed to load reviewers. Please try again.');
    } finally {
      setIsLoadingAllReviewers(false);
    }
  };
  const handleAssign = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    const user = users.find((u) => u.id === selectedUser);
    if (!user) {
      toast.error('Selected user not found');
      return;
    }

    setIsAssigning(true);
    try {
      // Get account names for selected rows
      const accountNames = Array.from(selectedDocuments).map(docId => {
        const doc = documents.find(d => d.id === docId);
        return doc?.accountName || docId;
      });

      const assignRequest: AssignReviewerRequest = {
        first_named_insured: accountNames,
        reviewer_assigned: user.email,
        qc_assigned: user.quality_control || undefined,
        status: '2'
      };

      const response = await documentOperationsAPI.assignReviewer(assignRequest);
      
      if (response.message) {
        // Show success toast with document count and reviewer name
        const documentCount = selectedDocuments.size;
        toast.success(
          `${documentCount} ${documentCount === 1 ? 'account has' : 'accounts have'} been successfully assigned to ${user.name}`,
          {
            duration: 4000,
          }
        );
        
        // Update local state to reflect the assignment
        setDocuments((prev) =>
          prev.map((doc) =>
            selectedDocuments.has(doc.id)
              ? { ...doc, status: 'Assigned' as const, reviewerAssigned: user.name }
              : doc
          )
        );
        
        setSelectedDocuments(new Set());
        setIsAssignDialogOpen(false);
        setSelectedUser('');
        
        // Reload accounts to get updated status from API
        loadDocuments();
      } else {
        toast.error('Failed to assign accounts');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign accounts');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleBulkUnassign = () => {
    setDocuments((prev) =>
      prev.map((doc) =>
        selectedDocuments.has(doc.id)
          ? { ...doc, status: 'Unassigned' as const, assignedTo: undefined }
          : doc
      )
    );
    toast.success(`${selectedDocuments.size} document(s) unassigned`);
    setSelectedDocuments(new Set());
  };

  // Use API paginated data directly (server-side pagination)
  let filteredDocuments = documents;

  if (sortField) {
    filteredDocuments = [...filteredDocuments].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'documentCount') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        aVal = (aVal ?? '').toString().toLowerCase();
        bVal = (bVal ?? '').toString().toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Unassigned':
        return 'bg-[#80989A] text-white';
      case 'Assigned':
        return 'bg-[#0292DC] text-white';
      case 'In Progress':
        return 'bg-[#FFC018] text-white';
      case 'Completed':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  // Server-side pagination calculations
  const startIndex = (currentPageFromAPI - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + documents.length, totalDocuments);
  
  // Use API paginated data directly (server-side pagination)
  const paginatedDocuments = filteredDocuments;

  // Reset to page 1 when filters change
  const handleFilterChange = (filterSetter: (value: string) => void, value: string) => {
    filterSetter(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Total Policies</div>
          {isLoading ? (
            <div className="h-9 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
          ) : (
            <div className="text-[#012F66] dark:text-white text-3xl font-bold">{stats.Total_policies}</div>
          )}
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Assigned Policies</div>
          {isLoading ? (
            <div className="h-9 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
          ) : (
            <div className="text-[#0292DC] text-3xl font-bold">
              {stats.Assigned_policies}
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Completed Policies</div>
          {isLoading ? (
            <div className="h-9 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
          ) : (
            <div className="text-green-600 text-3xl font-bold">
              {stats.Completed_policies}
            </div>
          )}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h3 className="text-[#012F66] dark:text-white mb-4">Filter Policies</h3>
          <div className="flex flex-wrap items-end gap-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-[#80989A] dark:text-[#a0a0a0]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading accounts...</span>
              </div>
            )}
            {/* <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#80989A]" />
              <span className="text-[#012F66] dark:text-white">Filters</span>
            </div> */}
            <div className="w-full md:w-auto md:min-w-[150px]">
            <Input
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
            />
            </div>
            <div className="w-full md:w-auto md:min-w-[150px]">
              <label className="block text-[#012F66] dark:text-white mb-2">Status</label>
              <Select value={statusFilter} onValueChange={(value) => handleFilterChange(setStatusFilter, value)}>
                <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-auto md:min-w-[180px]">
              <label className="block text-[#012F66] dark:text-white mb-2">Document ID</label>
              <Input
                placeholder="Search by document ID"
                value={docIdFilter}
                onChange={(e) => {
                  setDocIdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#80989A] dark:text-[#a0a0a0] text-sm">Show:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  const newPageSize = Number(value);
                  setItemsPerPage(newPageSize);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
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
            {(searchQuery || statusFilter !== 'All' || docIdFilter) && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearchQuery("");
                  setStatusFilter("All");
                  setDocIdFilter("");
                  setCurrentPage(1);
                }}
                variant="outline"
                size="sm"
                className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white text-xs cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedDocuments.size > 0 && (
              <>
                <span className="text-[#80989A] dark:text-[#a0a0a0]">{selectedDocuments.size} selected</span>
                <Button
                  onClick={() => {
                    loadAllUsers();
                    setIsAssignDialogOpen(true);
                  }}
                  className="bg-[#0292DC] hover:bg-[#012F66] text-white cursor-pointer"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Assign to Reviewer
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Policies Table */}
      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm overflow-hidden border border-[#E5E7EB] dark:border-[#3a3a3a]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA] dark:bg-[#1a1a1a] border-b border-[#E5E7EB] dark:border-[#3a3a3a]">
                <th className="px-6 py-4 text-left">
                  <Checkbox
                    checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th
                  className="px-6 py-4 text-left text-[#012F66] dark:text-white cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-[#2a2a2a]"
                  onClick={() => handleSort('accountName')}
                >
                  Policy {getSortIcon('accountName')}
                </th>
                <th
                  className="px-6 py-4 text-left text-[#012F66] dark:text-white cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-[#2a2a2a]"
                  onClick={() => handleSort('documentCount')}
                >
                  Total Documents {getSortIcon('documentCount')}
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Document IDs
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Assigned Documents
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Completed Documents
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Description
                </th>
                <th
                  className="px-6 py-4 text-left text-[#012F66] dark:text-white cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-[#2a2a2a]"
                  onClick={() => handleSort('reviewerAssigned')}
                >
                  Reviewer {getSortIcon('reviewerAssigned')}
                </th>
                <th
                  className="px-6 py-4 text-left text-[#012F66] dark:text-white cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-[#2a2a2a]"
                  onClick={() => handleSort('qcAssigned')}
                >
                  QC {getSortIcon('qcAssigned')}
                </th>
                <th
                  className="px-6 py-4 text-left text-[#012F66] dark:text-white cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-[#2a2a2a]"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton rows
                Array.from({ length: itemsPerPage }, (_, index) => (
                  <tr
                    key={`loading-${index}`}
                    className="border-b border-[#E5E7EB] dark:border-[#3a3a3a]"
                  >
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-24"></div>
                    </td>
                  </tr>
                ))
              ) : (
                // Actual document data
                paginatedDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#3a3a3a] border-b border-[#E5E7EB] dark:border-[#3a3a3a]">
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedDocuments.has(doc.id)}
                      onCheckedChange={() => toggleDocument(doc.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[#012F66] dark:text-white font-semibold">{doc.accountName}</div>
                  </td>
                    <td className="px-6 py-4 text-[#012F66] dark:text-white">{doc.documentCount}</td>
                    <td className="px-6 py-4 text-[#012F66] dark:text-white max-w-xs">
                      <div className="whitespace-pre-wrap break-words text-xs text-[#012F66] dark:text-white">
                        {doc.documentIds || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#012F66] dark:text-white">{doc.documentsAssigned}</td>
                    <td className="px-6 py-4 text-[#012F66] dark:text-white">{doc.documentsCompleted}</td>
                  <td className="px-6 py-4 text-[#80989A] dark:text-[#a0a0a0] max-w-xs">
                    {doc.descriptionSummary || '-'}
                  </td>
                  <td className="px-6 py-4 text-[#012F66] dark:text-white">
                    {doc.reviewerAssigned || '-'}
                  </td>
                    <td className="px-6 py-4 text-[#012F66] dark:text-white">
                    {doc.qcAssigned || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusBadgeColor(doc.status)}>{doc.status}</Badge>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* No Data Found State */}
        {!isLoading && documents.length === 0 && !hasApiError && (
          <div className="flex flex-col items-center justify-center py-16 px-6" style={{ padding: '20px' }}>
            <div className="w-24 h-24 bg-[#F5F7FA] dark:bg-[#3a3a3a] rounded-full flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-[#80989A] dark:text-[#a0a0a0]" />
            </div>
            <h3 className="text-lg font-semibold text-[#012F66] dark:text-white mb-2">
              No Policies Found
            </h3>
            <p className="text-[#80989A] dark:text-[#a0a0a0] text-center mb-6 max-w-md">
              {debouncedSearchQuery || statusFilter !== 'All'
                ? "No accounts match your current filters. Try adjusting your search criteria or reset the filters."
                : "No accounts are available yet."
              }
            </p>
            {(debouncedSearchQuery || statusFilter !== 'All') && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearchQuery("");
                  setStatusFilter("All");
                  setCurrentPage(1);
                }}
                variant="outline"
                className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            )}
          </div>
        )}

        {/* API Error State */}
        {!isLoading && hasApiError && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-[#012F66] dark:text-white mb-2">
              Failed to Load Policies
            </h3>
            <p className="text-[#80989A] dark:text-[#a0a0a0] text-center mb-6 max-w-md">
              There was an error loading the account data. Please check your connection and try again.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={loadDocuments}
                variant="outline"
                className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              {(debouncedSearchQuery || statusFilter !== 'All') && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearchQuery("");
                    setStatusFilter("All");
                    setCurrentPage(1);
                    loadDocuments();
                  }}
                  variant="outline"
                  className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#E5E7EB] dark:border-[#3a3a3a]">
            <div className="text-[#80989A] dark:text-[#a0a0a0]">
              Showing {startIndex + 1} to {endIndex} of {totalDocuments} accounts
              {isLoading && <span className="ml-2">(Loading...)</span>}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => !isLoading && setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={currentPage === 1 || isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => !isLoading && setCurrentPage(page)}
                          isActive={currentPage === page}
                          className={isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => !isLoading && setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages || isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#2a2a2a] border-[#E5E7EB] dark:border-[#3a3a3a]">
          <DialogHeader>
            <DialogTitle className="text-[#012F66] dark:text-white">Assign Files to Reviewer</DialogTitle>
            <DialogDescription className="text-[#80989A] dark:text-[#a0a0a0]">
              Select a reviewer to assign {selectedDocuments.size} file(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[#012F66] dark:text-white mb-2 block">Select Reviewer</label>
              {isLoadingAllReviewers ? (
                <div className="flex items-center gap-2 p-3 border border-[#E5E7EB] dark:border-[#3a3a3a] rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin text-[#80989A]" />
                  <span className="text-[#80989A] dark:text-[#a0a0a0]">Loading all reviewers...</span>
                </div>
              ) : (
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                    <SelectValue placeholder="Choose a reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div>
                          <div className="text-[#012F66] dark:text-white">{user.name}</div>
                          <div className="text-[#80989A] dark:text-[#a0a0a0] text-sm">{user.email}</div>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {users.length === 0 && !isLoadingAllReviewers && (
                      <div className="p-3 text-[#80989A] dark:text-[#a0a0a0] text-center">
                        No reviewers found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isAssigning}
              className="bg-[#0292DC] hover:bg-[#012F66] text-white disabled:opacity-50 cursor-pointer"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Documents'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}