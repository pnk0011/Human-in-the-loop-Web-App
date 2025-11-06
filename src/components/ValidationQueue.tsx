import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ChevronUp, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { documentAPI } from '../services/documentAPI';

interface QueueItem {
  id: string;
  document: string;
  type: string;
  field: string;
  confidence: number;
  priority: 'High' | 'Medium' | 'Low';
  age: string;
  assignedTo: string;
  fieldsCount?: number; // Make optional since API might not provide this
  status?: 'New' | 'In Progress' | 'Pending Review' | 'On Hold' | 'Completed' | 'Reassigned'; // Make optional
  extractedValue?: string;
  fieldDescription?: string;
  expectedFormat?: string;
  doc_handle_id?: string; // Add doc_handle_id for display in Document ID column
}

interface ValidationQueueProps {
  onValidateClick?: (item: QueueItem) => Promise<void>;
  apiDocuments?: QueueItem[]; // Optional API documents to override mock data
  reviewerEmail?: string; // Optional reviewer email for filtering document IDs
  documentType?: string; // Document type filter value
  onDocumentTypeChange?: (value: string) => void; // Callback to update document type filter
  priorityFilter?: string; // Priority filter value
  onPriorityFilterChange?: (value: string) => void; // Callback to update priority filter
  docIdFilter?: string; // Document ID filter value
  onDocIdFilterChange?: (value: string) => void; // Callback to update document ID filter
  isLoading?: boolean; // Loading state from parent component
}

const mockData: QueueItem[] = [
  {
    id: '1',
    document: 'INV-2024-0947',
    type: 'Invoice',
    field: 'Total Amount Due',
    confidence: 67,
    priority: 'High',
    age: '2d min',
    assignedTo: 'You',
    fieldsCount: 5,
    status: 'New',
    extractedValue: '$12,847.50',
    fieldDescription: 'The total amount to be paid for this invoice',
    expectedFormat: '$X,XXX.XX',
  },
  {
    id: '2',
    document: 'PO-2024-3921',
    type: 'Purchase Order',
    field: 'Vendor Name',
    confidence: 42,
    priority: 'Medium',
    age: '1h 15m',
    assignedTo: 'Unassigned',
    fieldsCount: 8,
    status: 'Pending Review',
    extractedValue: 'ABC Medical Supplies Inc.',
    fieldDescription: 'The name of the vendor or supplier',
    expectedFormat: 'Text',
  },
  {
    id: '3',
    document: 'REC-2024-0122',
    type: 'Receipt',
    field: 'Transaction Date',
    confidence: 38,
    priority: 'Low',
    age: '5d 8h',
    assignedTo: 'Jane Smith',
    fieldsCount: 3,
    status: 'On Hold',
    extractedValue: '03/15/2024',
    fieldDescription: 'The date when the transaction occurred',
    expectedFormat: 'MM/DD/YYYY',
  },
  {
    id: '4',
    document: 'INV-2024-0848',
    type: 'Invoice',
    field: 'Tax Amount',
    confidence: 71,
    priority: 'High',
    age: '4h min',
    assignedTo: 'You',
    fieldsCount: 7,
    status: 'In Progress',
    extractedValue: '$1,284.75',
    fieldDescription: 'The total tax amount for this invoice',
    expectedFormat: '$X,XXX.XX',
  },
  {
    id: '5',
    document: 'CON-2024-0055',
    type: 'Contract',
    field: 'Effective Date',
    confidence: 45,
    priority: 'High',
    age: '1d 8h',
    assignedTo: 'Mike Johnson',
    fieldsCount: 12,
    status: 'New',
    extractedValue: '01/01/2025',
    fieldDescription: 'The date when the contract becomes effective',
    expectedFormat: 'MM/DD/YYYY',
  },
];

type SortField = 'document' | 'confidence' | 'priority' | 'age';
type SortDirection = 'asc' | 'desc';

export function ValidationQueue({ onValidateClick, apiDocuments, reviewerEmail, documentType: externalDocumentType, onDocumentTypeChange, priorityFilter: externalPriorityFilter, onPriorityFilterChange, docIdFilter: externalDocIdFilter, onDocIdFilterChange, isLoading: externalIsLoading }: ValidationQueueProps = {}) {
  const [internalDocumentType, setInternalDocumentType] = useState('all');
  // Use external documentType if provided, otherwise use internal state
  const documentType = externalDocumentType !== undefined ? externalDocumentType : internalDocumentType;
  const setDocumentType = onDocumentTypeChange || setInternalDocumentType;
  
  const [internalPriorityFilter, setInternalPriorityFilter] = useState('all');
  // Use external priorityFilter if provided, otherwise use internal state
  const priorityFilter = externalPriorityFilter !== undefined ? externalPriorityFilter : internalPriorityFilter;
  const setPriorityFilter = onPriorityFilterChange || setInternalPriorityFilter;
  
  const [internalDocIdFilter, setInternalDocIdFilter] = useState('all');
  // Use external docIdFilter if provided, otherwise use internal state
  const docIdFilter = externalDocIdFilter !== undefined ? externalDocIdFilter : internalDocIdFilter;
  const setDocIdFilter = onDocIdFilterChange || setInternalDocIdFilter;
  
  const [ageFilter, setAgeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [uniqueDocIds, setUniqueDocIds] = useState<string[]>([]);
  const [isLoadingDocIds, setIsLoadingDocIds] = useState(false);

  // Load unique document IDs on component mount
  useEffect(() => {
    const loadUniqueDocIds = async () => {
      setIsLoadingDocIds(true);
      try {
        const response = await documentAPI.getUniqueDocumentIds(reviewerEmail);
        
        // Check for different possible response structures
        if (response.status === 'success') {
          // Try different possible field names
          const docIds = response.doc_handle_ids || [];
          setUniqueDocIds(Array.isArray(docIds) ? docIds : []);
        }
      } catch (error) {
        // Failed to load unique document IDs
      } finally {
        setIsLoadingDocIds(false);
      }
    };
    
    loadUniqueDocIds();
  }, [reviewerEmail]);

  // Reset to page 1 when filters change (only for internal filters, external filters are handled by parent)
  useEffect(() => {
    if (externalDocumentType === undefined && externalPriorityFilter === undefined && externalDocIdFilter === undefined) {
      setCurrentPage(1);
    }
  }, [documentType, priorityFilter, docIdFilter, externalDocumentType, externalPriorityFilter, externalDocIdFilter]);

  // Reset to page 1 when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Handle validate click with per-item loading state
  const handleValidateClick = async (item: QueueItem) => {
    setLoadingItemId(item.id);
    try {
      await onValidateClick?.(item);
    } finally {
      // Add a small delay to make loading state more visible
      setTimeout(() => {
        setLoadingItemId(null);
      }, 100);
    }
  };

  // Use only API documents, no fallback to dummy data
  const dataSource = apiDocuments || [];
  
  // Filter to show only documents assigned to the current user and apply other filters
  let filteredData = dataSource.filter(item => item.assignedTo === 'You' || item.assignedTo === 'Reviewer');
  
  // Exclude completed documents
  filteredData = filteredData.filter(item => item.status !== 'Completed');
  
  // Apply filters
  // Note: If external filters are provided, filtering is done server-side via API
  // Only apply client-side filters if using internal state (not controlled by parent)
  if (externalDocumentType === undefined && documentType !== 'all') {
    filteredData = filteredData.filter(item => item.type === documentType);
  }
  
  // Only apply client-side priority filter if not controlled by parent
  if (externalPriorityFilter === undefined && priorityFilter !== 'all') {
    filteredData = filteredData.filter(item => item.priority.toLowerCase() === priorityFilter.toLowerCase());
  }
  
  // Only apply client-side doc ID filter if not controlled by parent
  if (externalDocIdFilter === undefined && docIdFilter !== 'all') {
    filteredData = filteredData.filter(item => item.doc_handle_id === docIdFilter);
  }
  
  // Sort to prioritize Reassigned status documents at the top
  // Then apply manual sorting if sortField is set
  filteredData = [...filteredData].sort((a, b) => {
    // First priority: Reassigned status should always be at the top
    if (a.status === 'Reassigned' && b.status !== 'Reassigned') return -1;
    if (a.status !== 'Reassigned' && b.status === 'Reassigned') return 1;
    
    // If both have same Reassigned priority, apply manual sorting if set
    if (sortField) {
      let aVal: any;
      let bVal: any;
      
      switch (sortField) {
        case 'document':
          aVal = a.document?.toLowerCase() || '';
          bVal = b.document?.toLowerCase() || '';
          break;
        case 'confidence':
          aVal = a.confidence || 0;
          bVal = b.confidence || 0;
          break;
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;
        case 'age':
          // Parse age string (e.g., "2d", "5h", "30m")
          const parseAge = (age: string) => {
            if (!age) return 0;
            const match = age.match(/(\d+)([dhm])/);
            if (!match) return 0;
            const value = parseInt(match[1]);
            const unit = match[2];
            if (unit === 'd') return value * 24 * 60; // days to minutes
            if (unit === 'h') return value * 60; // hours to minutes
            return value; // minutes
          };
          aVal = parseAge(a.age);
          bVal = parseAge(b.age);
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    }
    
    // If no manual sorting, maintain original order
    return 0;
  });
  
  const totalItems = filteredData.length;

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-[#FFC018]/20 text-[#FFC018]';
    if (confidence >= 50) return 'bg-[#FFC018]/20 text-[#FFC018]';
    return 'bg-[#FF0081]/20 text-[#FF0081]';
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

  const getAgeColor = (age: string) => {
    if (age.includes('d')) return 'text-[#FF0081]';
    return 'text-[#80989A]';
  };

  const resetFilters = () => {
    // Reset document type filter (use callback if provided by parent, otherwise use local state)
    if (onDocumentTypeChange) {
      onDocumentTypeChange('all');
    } else {
      setDocumentType('all');
    }
    // Reset priority filter
    if (onPriorityFilterChange) {
      onPriorityFilterChange('all');
    } else {
      setPriorityFilter('all');
    }
    // Reset document ID filter
    if (onDocIdFilterChange) {
      onDocIdFilterChange('all');
    } else {
      setDocIdFilter('all');
    }
    setAgeFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-[#2a2a2a] p-6 rounded-lg shadow-sm border border-[#E5E7EB] dark:border-[#3a3a3a]">
        <h3 className="text-[#012F66] dark:text-white mb-4">Filter Documents</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="w-full md:w-auto md:min-w-[150px]">
            <label className="block text-[#012F66] dark:text-white mb-2">Document Type</label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
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
            <label className="block text-[#012F66] dark:text-white mb-2">Priority</label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* <div className="w-full md:w-auto md:min-w-[150px]">
            <label className="block text-[#012F66] dark:text-white mb-2">Age</label>
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="new">Less than 1 day</SelectItem>
                <SelectItem value="medium">1-3 days</SelectItem>
                <SelectItem value="old">More than 3 days</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          <div className="w-full md:w-auto md:min-w-[150px]">
            <label className="block text-[#012F66] dark:text-white mb-2">Document ID</label>
            <Select value={docIdFilter} onValueChange={setDocIdFilter}>
              <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white" disabled={isLoadingDocIds}>
                <SelectValue placeholder={isLoadingDocIds ? "Loading IDs..." : "All Document IDs"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Document IDs</SelectItem>
                {uniqueDocIds.map((docId) => (
                  <SelectItem key={docId} value={docId}>
                    {docId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-auto md:min-w-[150px]">
            <label className="block text-[#012F66] dark:text-white mb-2">Show</label>
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

      {/* Queue Table */}
      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm overflow-hidden border border-[#E5E7EB] dark:border-[#3a3a3a]">
        {/* Table Header */}
        <div className="px-6 py-5 border-b border-[#E5E7EB] dark:border-[#3a3a3a] flex items-center justify-between bg-gradient-to-r from-[#012F66] to-[#0292DC]">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white">Validation Queue</h3>
              <p className="text-white/80">Review and validate AI-extracted data</p>
            </div>
          </div>
          {/* <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 bg-white/5"
            >
              Export List
            </Button>
          </div> */}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9FAFB] dark:bg-[#1a1a1a] border-b border-[#E5E7EB] dark:border-[#3a3a3a]">
              <tr>
              <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Document ID</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  <button
                    onClick={() => handleSort('document')}
                    className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Filename <SortIcon field="document" />
                  </button>
                </th>
                
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">File Type</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  <button
                    onClick={() => handleSort('confidence')}
                    className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Avg. Confidence <SortIcon field="confidence" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  <button
                    onClick={() => handleSort('priority')}
                    className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Priority <SortIcon field="priority" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  <button
                    onClick={() => handleSort('age')}
                    className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Age <SortIcon field="age" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Fields to Review</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Status</th>
                <th className="px-6 py-4 text-right text-[#012F66] dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#3a3a3a]">
              {externalIsLoading || (dataSource.length === 0 && apiDocuments === undefined) ? (
                // Loading skeleton rows when loading or no API data is available yet
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
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-24"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-20"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded-full animate-pulse w-12"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-16"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-16"></div>
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
              ) : filteredData.length === 0 ? (
                // Empty state when no documents found after API data is loaded
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
                        {apiDocuments && apiDocuments.length === 0 && dataSource.length === 0
                          ? "No documents match your current filters. Try adjusting your search criteria or reset the filters."
                          : "No documents match your current filters. Try adjusting your search criteria or reset the filters."
                        }
                      </p>
                      {(documentType !== 'all' || priorityFilter !== 'all' || docIdFilter !== 'all' || (apiDocuments && apiDocuments.length === 0 && dataSource.length === 0)) && (
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
                paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-[#F9FAFB]/50 dark:hover:bg-[#3a3a3a]/50 transition-colors">
                    <td className="px-6 py-5">
                    <div className="text-[#80989A] dark:text-[#a0a0a0] font-mono">{item.doc_handle_id || '-'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#0292DC]/10 to-[#012F66]/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#0292DC]" />
                      </div>
                      <div>
                        <div className="text-[#012F66] dark:text-white">{item.document}</div>
                      </div>
                    </div>
                  </td>
                
                  <td className="px-6 py-5">
                    <span className="text-[#80989A] dark:text-[#a0a0a0]">{item.type}</span>
                  </td>
                  <td className="px-6 py-5">
                    <Badge className={getConfidenceBadgeColor(item.confidence)}>
                      {item.confidence}%
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`flex items-center gap-1 ${getPriorityColor(item.priority)}`}>
                      <span className="w-2 h-2 rounded-full bg-current"></span>
                      {item.priority}
                    </span>
                  </td>
                  <td className={`px-6 py-5 ${getAgeColor(item.age)} dark:text-[#a0a0a0]`}>{item.age}</td>
                  <td className="px-6 py-5 text-[#012F66] dark:text-white">
                    <span className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[#0292DC]/10 text-[#0292DC] flex items-center justify-center">
                        {item.fieldsCount}
                      </span>
                      <span className="text-[#80989A] dark:text-[#a0a0a0]">fields</span>
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <Badge className={
                      item.status === 'New' ? 'bg-[#0292DC]/10 text-[#0292DC]' :
                      item.status === 'In Progress' ? 'bg-[#FFC018]/10 text-[#FFC018]' :
                      item.status === 'Pending Review' ? 'bg-[#80989A]/10 text-[#80989A]' :
                      item.status === 'Completed' ? 'bg-green-600 text-white' :
                      item.status === 'Reassigned' ? 'bg-[#FF0081] text-white' :
                      'bg-[#FF0081]/10 text-[#FF0081]'
                    }>
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
                        'Validate'
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
        <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-[#3a3a3a] flex items-center justify-between">
          <div className="text-[#80989A] dark:text-[#a0a0a0]">
            {totalItems > 0 ? `Showing ${startIndex + 1}-${endIndex} of ${totalItems} items` : 'No items'}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white disabled:opacity-50 cursor-pointer"
            >
              Previous
            </Button>
            {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => setCurrentPage(page)}
                className={`${
                  currentPage === page
                    ? 'bg-[#0292DC] hover:bg-[#012F66] text-white'
                    : 'border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white'
                } cursor-pointer`}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white disabled:opacity-50 cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}