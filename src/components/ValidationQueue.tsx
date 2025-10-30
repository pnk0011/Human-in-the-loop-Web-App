import React, { useState } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ChevronUp, ChevronDown, FileText, Loader2 } from 'lucide-react';

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
}

interface ValidationQueueProps {
  onValidateClick?: (item: QueueItem) => Promise<void>;
  apiDocuments?: QueueItem[]; // Optional API documents to override mock data
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

export function ValidationQueue({ onValidateClick, apiDocuments }: ValidationQueueProps = {}) {
  const [documentType, setDocumentType] = useState('all');
  const [confidenceRange, setConfidenceRange] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
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
  
  // Filter to show only documents assigned to the current user
  const filteredData = dataSource.filter(item => item.assignedTo === 'You' || item.assignedTo === 'Reviewer');
  
  const totalItems = filteredData.length;
  const itemsPerPage = 5;

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
        return 'text-[#80989A]';
      default:
        return 'text-[#80989A]';
    }
  };

  const getAgeColor = (age: string) => {
    if (age.includes('d')) return 'text-[#FF0081]';
    return 'text-[#80989A]';
  };

  const resetFilters = () => {
    setDocumentType('all');
    setConfidenceRange('all');
    setPriorityFilter('all');
    setAgeFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-[#2a2a2a] p-6 rounded-lg shadow-sm border border-[#E5E7EB] dark:border-[#3a3a3a]">
        <h3 className="text-[#012F66] dark:text-white mb-4">Filter Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-[#012F66] dark:text-white mb-2">Document Type</label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="po">Purchase Order</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[#012F66] dark:text-white mb-2">Confidence Range</label>
            <Select value={confidenceRange} onValueChange={setConfidenceRange}>
              <SelectTrigger className="bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="All Ranges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranges</SelectItem>
                <SelectItem value="high">70-100%</SelectItem>
                <SelectItem value="medium">50-69%</SelectItem>
                <SelectItem value="low">0-49%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[#012F66] dark:text-white mb-2">Priority</label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
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

          <div>
            <label className="block text-[#012F66] dark:text-white mb-2">Age</label>
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="new">Less than 1 day</SelectItem>
                <SelectItem value="medium">1-3 days</SelectItem>
                <SelectItem value="old">More than 3 days</SelectItem>
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
                    onClick={() => handleSort('document')}
                    className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    DOCUMENT <SortIcon field="document" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">FILE TYPE</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  <button
                    onClick={() => handleSort('confidence')}
                    className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    AVG CONFIDENCE <SortIcon field="confidence" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  <button
                    onClick={() => handleSort('priority')}
                    className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    PRIORITY <SortIcon field="priority" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  <button
                    onClick={() => handleSort('age')}
                    className="hover:text-[#0292DC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    AGE <SortIcon field="age" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">FIELDS TO REVIEW</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">STATUS</th>
                <th className="px-6 py-4 text-right text-[#012F66] dark:text-white">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#3a3a3a]">
              {dataSource.length === 0 && (!apiDocuments || apiDocuments.length === 0) ? (
                // Loading skeleton rows when no API data is available yet
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
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-[#F5F7FA] dark:bg-[#3a3a3a] rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-[#80989A] dark:text-[#a0a0a0]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#012F66] dark:text-white mb-2">
                        No Documents Found
                      </h3>
                      <p className="text-[#80989A] dark:text-[#a0a0a0] text-center mb-4 max-w-md">
                        {dataSource.length === 0 
                          ? "No documents have been assigned for validation yet."
                          : "No documents match your current filters. Try adjusting your search criteria or reset the filters."
                        }
                      </p>
                      {dataSource.length > 0 && (
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
                    <span className={`flex items-center gap-2 ${getPriorityColor(item.priority)}`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
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
                      item.status === 'Reassigned' ? 'bg-[#F59E0B]/20 text-[#D97706]' :
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