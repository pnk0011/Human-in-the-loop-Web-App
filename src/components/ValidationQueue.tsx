import React, { useState } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ChevronUp, ChevronDown, FileText, Loader2, UserCheck, Shield, Activity } from 'lucide-react';

interface QueueItem {
  id: string;
  accountName: string;
  documentCount: number;
  documentIds?: string;
  descriptionSummary?: string;
  reviewerAssigned?: string | null;
  qcAssigned?: string | null;
  status?: 'New' | 'In Progress' | 'Pending Review' | 'On Hold' | 'Completed' | 'Reassigned';
  isActive?: boolean;
}

interface ValidationQueueProps {
  onValidateClick?: (item: QueueItem) => Promise<void>;
  apiDocuments?: QueueItem[];
  isLoading?: boolean;
  docIdFilter?: string;
  onDocIdFilterChange?: (value: string) => void;
}

const mockData: QueueItem[] = [
  {
    id: '1',
    accountName: 'BAYVILLE HEALTHCARE LLC',
    documentCount: 8,
    descriptionSummary: 'Submission | Supporting docs | Loss runs',
    reviewerAssigned: 'you@medpro.com',
    qcAssigned: 'qc.specialist@medpro.com',
    status: 'New',
    isActive: true,
  },
  {
    id: '2',
    accountName: 'CPP SENIOR HOLDINGS, LLC',
    documentCount: 5,
    descriptionSummary: 'Declination | Application | Endorsements',
    reviewerAssigned: 'you@medpro.com',
    qcAssigned: null,
    status: 'In Progress',
    isActive: true,
  },
  {
    id: '3',
    accountName: 'RK4 LLC',
    documentCount: 7,
    descriptionSummary: 'Info gathering | MPG | Rating tool',
    reviewerAssigned: 'another.reviewer@medpro.com',
    qcAssigned: 'qc.specialist@medpro.com',
    status: 'Pending Review',
    isActive: true,
  },
];

type SortField = 'account' | 'documentCount' | 'status';
type SortDirection = 'asc' | 'desc';

export function ValidationQueue({ onValidateClick, apiDocuments, isLoading: externalIsLoading, docIdFilter: externalDocIdFilter, onDocIdFilterChange }: ValidationQueueProps = {}) {
  const [internalDocIdFilter, setInternalDocIdFilter] = useState('');
  const docIdFilter = externalDocIdFilter ?? internalDocIdFilter;
  const setDocIdFilter = onDocIdFilterChange ?? setInternalDocIdFilter;
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
  
  // Data is already filtered by API when docIdFilter is provided
  let filteredData = [...dataSource];

  // Status/active filters removed per request
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
        case 'account':
          aVal = a.accountName?.toLowerCase() || '';
          bVal = b.accountName?.toLowerCase() || '';
          break;
        case 'documentCount':
          aVal = a.documentCount || 0;
          bVal = b.documentCount || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
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

  const formatStatus = (status?: string) => {
    switch (status) {
      case 'In Progress':
        return { label: 'In Progress', className: 'bg-[#FFC018]/10 text-[#FFC018]' };
      case 'Pending Review':
        return { label: 'Pending Review', className: 'bg-[#80989A]/10 text-[#80989A]' };
      case 'Completed':
        return { label: 'Completed', className: 'bg-green-600 text-white' };
      case 'Reassigned':
        return { label: 'Reassigned', className: 'bg-[#FF0081] text-white' };
      default:
        return { label: 'New', className: 'bg-[#0292DC]/10 text-[#0292DC]' };
    }
  };

  const resetFilters = () => {
    setDocIdFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-[#2a2a2a] p-6 rounded-lg shadow-sm border border-[#E5E7EB] dark:border-[#3a3a3a]">
        <h3 className="text-[#012F66] dark:text-white mb-4">Filter Policies</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="w-full md:w-auto md:min-w-[180px]">
            <label className="block text-[#012F66] dark:text-white mb-2">Document ID</label>
            <input
              value={docIdFilter}
              onChange={(event) => {
                setDocIdFilter(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Document ID"
              className="w-full px-3 py-2 rounded-md border border-[#D0D5DD] dark:border-[#4a4a4a] bg-white dark:bg-[#3a3a3a] text-[#012F66] dark:text-white"
            />
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
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  <button
                    onClick={() => handleSort('account')}
                    className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                            Policy <SortIcon field="account" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  <button
                    onClick={() => handleSort('documentCount')}
                    className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Documents <SortIcon field="documentCount" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Document IDs</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Summary</th>
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
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-40"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-28"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-32"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-16"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-8 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-16 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                // Empty state when no documents found after API data is loaded
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center" style={{ padding: '20px' }}>
                      <div className="w-16 h-16 bg-[#F5F7FA] dark:bg-[#3a3a3a] rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-[#80989A] dark:text-[#a0a0a0]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#012F66] dark:text-white mb-2">
                        No Policies Found
                      </h3>
                      <p className="text-[#80989A] dark:text-[#a0a0a0] text-center mb-4 max-w-md">
                        {apiDocuments && apiDocuments.length === 0 && dataSource.length === 0
                          ? "No accounts match your current filters. Try adjusting your search criteria or reset the filters."
                          : "No accounts match your current filters. Try adjusting your search criteria or reset the filters."
                        }
                      </p>
                      {(docIdFilter || (apiDocuments && apiDocuments.length === 0 && dataSource.length === 0)) && (
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
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#0292DC]/10 to-[#012F66]/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#0292DC]" />
                        </div>
                        <div>
                          <div className="text-[#012F66] dark:text-white font-semibold">{item.accountName}</div>
                          <div className="text-xs text-[#80989A] dark:text-[#a0a0a0]">#{item.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[#012F66] dark:text-white">{item.documentCount}</td>
                    <td className="px-6 py-5 text-[#012F66] dark:text-white text-xs max-w-xs">
                      <div className="whitespace-pre-wrap break-words">
                        {item.documentIds || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[#80989A] dark:text-[#a0a0a0] max-w-xs">
                      {item.descriptionSummary || '-'}
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
                      {totalItems > 0 ? `Showing ${startIndex + 1}-${endIndex} of ${totalItems} items` : 'No policies'}
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