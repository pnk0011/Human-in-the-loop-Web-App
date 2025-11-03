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
import { Users, ChevronUp, ChevronDown, Filter, Loader2, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from "sonner";
import { documentAPI, Document, GetDocumentsRequest } from '../services/documentAPI';
import { userAPI } from '../services/userAPI';
import { documentOperationsAPI, AssignReviewerRequest } from '../services/documentOperationsAPI';

// Document interface is imported from documentAPI service

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Reviewer' | 'QC';
  currentLoad: number | string;
}

type SortField = 'documentName' | 'confidence' | 'priority' | 'uploadDate';
type SortDirection = 'asc' | 'desc';

// Mock documents removed - now using real API data

// Mock users removed - now using real API data

export function DocumentAssignment() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [docIdFilter, setDocIdFilter] = useState('All');
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
  const [stats, setStats] = useState({
    "Total Documents": 0,
    "Total Files": 0,
    "Assigned Files": 0,
    "Completed Files": 0,
  });
  
  // Loading state for reviewers
  const [isLoadingAllReviewers, setIsLoadingAllReviewers] = useState(false);
  
  // State for unique document IDs
  const [uniqueDocIds, setUniqueDocIds] = useState<string[]>([]);
  const [isLoadingDocIds, setIsLoadingDocIds] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load unique document IDs on component mount
  useEffect(() => {
    const loadUniqueDocIds = async () => {
      setIsLoadingDocIds(true);
      try {
        const response = await documentAPI.getUniqueDocumentIds();
        console.log('Unique document IDs API response:', response);
        
        // Check for different possible response structures
        if (response.status === 'success') {
          // Try different possible field names
          const docIds = response.doc_handle_ids || [];
          console.log('Extracted document IDs:', docIds);
          setUniqueDocIds(Array.isArray(docIds) ? docIds : []);
        } else {
          console.error('API returned non-success status:', response.status);
        }
      } catch (error) {
        console.error('Failed to load unique document IDs:', error);
      } finally {
        setIsLoadingDocIds(false);
      }
    };
    
    loadUniqueDocIds();
  }, []);

  // Load documents on component mount and when filters change
  useEffect(() => {
    loadDocuments();
  }, [currentPage, debouncedSearchQuery, statusFilter, typeFilter, priorityFilter, docIdFilter, itemsPerPage]);

  const loadDocuments = async () => {
    setIsLoading(true);
    setHasApiError(false);
    try {
      const params: GetDocumentsRequest = {
        page: currentPage,
        limit: itemsPerPage,
        file_name: debouncedSearchQuery || undefined,
        doc_type_name: typeFilter !== 'All' ? typeFilter : undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        doc_handle_id: docIdFilter !== 'All' ? docIdFilter : undefined,
      };

      const response = await documentAPI.getDocuments(params);
      
      if (response.status === 'success' && response.files) {
        // Set stats from API response
        if (response.stats) {
          setStats(response.stats);
        }
        
        // Convert API response to match component expectations
        const formattedDocuments = response.files.map(doc => ({
          ...doc,
          id: `${doc.file_name}_${doc.doc_handle_id}`, // Use combination of file name and doc_handle_id as unique ID
          documentName: doc.file_name,
          documentType: doc.doc_type_name || 'Unknown',
          fieldsCount: doc.distinct_entity_type_count,
          confidence: Math.round(doc.avg_confidence_percentage),
          priority: doc.priority,
          uploadDate: doc.latest_update_datetime ? doc.latest_update_datetime.split(' ')[0] : new Date().toISOString().split('T')[0], // Extract date part
          status: getStatusFromApi(doc.status),
          assignedTo: doc.reviewer_assigned || undefined,
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
        toast.error(response.message || 'Failed to load documents');
        setDocuments([]);
        setTotalDocuments(0);
        setTotalPages(0);
        setCurrentPageFromAPI(1);
        setHasApiError(true);
      }
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents. Please try again.');
      setDocuments([]);
      setTotalDocuments(0);
      setTotalPages(0);
      setCurrentPageFromAPI(1);
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
        return 'Assigned';
      case '2':
        return 'In Progress';
      case '3':
        return 'Completed';
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
      // First, fetch page 1 to get total pages
      const firstPageResponse = await userAPI.getUsers(1, 10);
      
      if (firstPageResponse.status === 'success' && firstPageResponse.users && firstPageResponse.pagination) {
        const totalPages = firstPageResponse.pagination.total_pages;
        const allUsers = [...firstPageResponse.users];
        
        // Fetch remaining pages
        const pagePromises: Promise<any>[] = [];
        for (let page = 2; page <= totalPages; page++) {
          pagePromises.push(userAPI.getUsers(page, 10));
        }
        
        const remainingPagesResponses = await Promise.all(pagePromises);
        
        // Combine all users
        remainingPagesResponses.forEach(response => {
          if (response.status === 'success' && response.users) {
            allUsers.push(...response.users);
          }
        });
        
        // Convert API response to match component expectations
        const formattedUsers = allUsers.map(user => ({
          id: user.email, // Use email as ID
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          quality_control: user.quality_control,
          currentLoad: 'N/A', // API doesn't provide current load
        }));
        
        setUsers(formattedUsers);
      } else {
        console.error('Failed to load users:', firstPageResponse.message);
        setUsers([]);
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setUsers([]);
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
      // Get file names from selected documents
      const fileNames = Array.from(selectedDocuments).map(docId => {
        const doc = documents.find(d => d.id === docId);
        return doc?.documentName || docId;
      });


      
      console.log('Available users:', users);

      const assignRequest: AssignReviewerRequest = {
        file_names: fileNames,
        reviewer: user.email,
        qc_assigned: user?.quality_control,
        status: '2'
      };
      
      console.log('Assign request:', assignRequest);

      const response = await documentOperationsAPI.assignReviewer(assignRequest);
      
      if (response.message) {
        toast.success(response.message);
        
        // Update local state to reflect the assignment
        setDocuments((prev) =>
          prev.map((doc) =>
            selectedDocuments.has(doc.id)
              ? { ...doc, status: 'Assigned' as const, assignedTo: user.name }
              : doc
          )
        );
        
        setSelectedDocuments(new Set());
        setIsAssignDialogOpen(false);
        setSelectedUser('');
        
        // Reload documents to get updated status from API
        loadDocuments();
      } else {
        toast.error('Failed to assign documents');
      }
    } catch (error: any) {
      console.error('Failed to assign documents:', error);
      toast.error(error.message || 'Failed to assign documents');
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

      if (sortField === 'uploadDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-[#FF0081]';
      case 'Medium':
        return 'text-[#FFC018]';
      case 'Low':
        return 'text-[#0292DC]';
      default:
        return 'text-[#80989A]';
    }
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-[#FFC018] text-white';
    if (confidence >= 50) return 'bg-[#FFC018] text-white';
    return 'bg-[#FF0081] text-white';
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
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Total Documents</div>
          {isLoading ? (
            <div className="h-9 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
          ) : (
            <div className="text-[#012F66] dark:text-white text-3xl font-bold">{stats["Total Documents"]}</div>
          )}
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Total Files</div>
          {isLoading ? (
            <div className="h-9 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
          ) : (
            <div className="text-[#0292DC] text-3xl font-bold">
              {stats["Total Files"]}
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Assigned Files</div>
          {isLoading ? (
            <div className="h-9 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
          ) : (
            <div className="text-[#FFC018] text-3xl font-bold">
              {stats["Assigned Files"]}
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Completed Files</div>
          {isLoading ? (
            <div className="h-9 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
          ) : (
            <div className="text-green-600 text-3xl font-bold">
              {stats["Completed Files"]}
            </div>
          )}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h3 className="text-[#012F66] dark:text-white mb-4">Filter Documents</h3>
          <div className="flex flex-wrap items-center gap-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-[#80989A] dark:text-[#a0a0a0]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading documents...</span>
              </div>
            )}
            {/* <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#80989A]" />
              <span className="text-[#012F66] dark:text-white">Filters</span>
            </div> */}
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
            />
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange(setStatusFilter, value)}>
              <SelectTrigger className="w-full md:w-40 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="0">Unassigned</SelectItem>
                <SelectItem value="1">Assigned</SelectItem>
                <SelectItem value="2">In Progress</SelectItem>
                <SelectItem value="3">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => handleFilterChange(setTypeFilter, value)}>
              <SelectTrigger className="w-full md:w-40 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
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
            <Select value={priorityFilter} onValueChange={(value) => handleFilterChange(setPriorityFilter, value)}>
              <SelectTrigger className="w-full md:w-40 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={docIdFilter} onValueChange={(value) => handleFilterChange(setDocIdFilter, value)}>
              <SelectTrigger className="w-full md:w-40 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white" disabled={isLoadingDocIds}>
                <SelectValue placeholder={isLoadingDocIds ? "Loading IDs..." : "Document ID"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Document IDs</SelectItem>
                {uniqueDocIds.map((docId) => (
                  <SelectItem key={docId} value={docId}>
                    {docId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {(searchQuery || statusFilter !== 'All' || typeFilter !== 'All' || priorityFilter !== 'All' || docIdFilter !== 'All') && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearchQuery("");
                  setStatusFilter("All");
                  setTypeFilter("All");
                  setPriorityFilter("All");
                  setDocIdFilter("All");
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

      {/* Documents Table */}
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
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Document ID
                </th>
                <th
                  className="px-6 py-4 text-left text-[#012F66] dark:text-white cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-[#2a2a2a]"
                  onClick={() => handleSort('documentName')}
                >
                  Filename {getSortIcon('documentName')}
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Type</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Fields</th>
                <th
                  className="px-6 py-4 text-left text-[#012F66] dark:text-white cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-[#2a2a2a]"
                  onClick={() => handleSort('confidence')}
                >
                  Avg Confidence {getSortIcon('confidence')}
                </th>
                <th
                  className="px-6 py-4 text-left text-[#012F66] dark:text-white cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-[#2a2a2a]"
                  onClick={() => handleSort('priority')}
                >
                  Priority {getSortIcon('priority')}
                </th>
                <th
                  className="px-6 py-4 text-left text-[#012F66] dark:text-white cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-[#2a2a2a]"
                  onClick={() => handleSort('uploadDate')}
                >
                  Upload Date {getSortIcon('uploadDate')}
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Assigned To</th>
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
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded-full animate-pulse w-12"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded-full animate-pulse w-16"></div>
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
                    <div className="text-[#80989A] dark:text-[#a0a0a0] font-mono">{doc.doc_handle_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[#012F66] dark:text-white">{doc.documentName}</div>
                  </td>
                  <td className="px-6 py-4 text-[#80989A] dark:text-[#a0a0a0]">{doc.documentType}</td>
                  <td className="px-6 py-4 text-[#012F66] dark:text-white">{doc.fieldsCount} fields</td>
                  <td className="px-6 py-4">
                    <Badge className={getConfidenceBadgeColor(doc.confidence)}>
                      {doc.confidence}%
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 ${getPriorityColor(doc.priority)}`}>
                      <span className="w-2 h-2 rounded-full bg-current"></span>
                      {doc.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#012F66] dark:text-white">
                    {new Date(doc.uploadDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusBadgeColor(doc.status)}>{doc.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-[#012F66] dark:text-white">{doc.assignedTo || '-'}</td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* No Data Found State */}
        {!isLoading && documents.length === 0 && !hasApiError && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-24 h-24 bg-[#F5F7FA] dark:bg-[#3a3a3a] rounded-full flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-[#80989A] dark:text-[#a0a0a0]" />
            </div>
            <h3 className="text-lg font-semibold text-[#012F66] dark:text-white mb-2">
              No Documents Found
            </h3>
            <p className="text-[#80989A] dark:text-[#a0a0a0] text-center mb-6 max-w-md">
              {debouncedSearchQuery || statusFilter !== 'All' || typeFilter !== 'All' || priorityFilter !== 'All' || docIdFilter !== 'All'
                ? "No documents match your current filters. Try adjusting your search criteria or reset the filters."
                : "No documents have been uploaded yet."
              }
            </p>
            {(debouncedSearchQuery || statusFilter !== 'All' || typeFilter !== 'All' || priorityFilter !== 'All' || docIdFilter !== 'All') && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearchQuery("");
                  setStatusFilter("All");
                  setTypeFilter("All");
                  setPriorityFilter("All");
                  setDocIdFilter("All");
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
              Failed to Load Documents
            </h3>
            <p className="text-[#80989A] dark:text-[#a0a0a0] text-center mb-6 max-w-md">
              There was an error loading the document data. Please check your connection and try again.
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
              {(debouncedSearchQuery || statusFilter !== 'All' || typeFilter !== 'All' || priorityFilter !== 'All' || docIdFilter !== 'All') && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearchQuery("");
                    setStatusFilter("All");
                    setTypeFilter("All");
                    setPriorityFilter("All");
                    setDocIdFilter("All");
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
              Showing {startIndex + 1} to {endIndex} of {totalDocuments} documents
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
            <DialogTitle className="text-[#012F66] dark:text-white">Assign Documents to Reviewer</DialogTitle>
            <DialogDescription className="text-[#80989A] dark:text-[#a0a0a0]">
              Select a reviewer to assign {selectedDocuments.size} document(s).
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
                    {users.filter(user => user.role === 'Reviewer').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="text-[#012F66]">{user.name}</div>
                            <div className="text-[#80989A]">{user.email}</div>
                          </div>
                          <div className="ml-4">
                            <Badge className="bg-[#0292DC] text-white">
                              {user.role}
                            </Badge>
                            <span className="text-[#80989A] ml-2">({user.currentLoad})</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {users.filter(user => user.role === 'Reviewer').length === 0 && !isLoadingAllReviewers && (
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