import { useState } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ChevronUp, ChevronDown, FileText } from 'lucide-react';

interface QueueItem {
  id: string;
  document: string;
  type: string;
  field: string;
  confidence: number;
  priority: 'High' | 'Medium' | 'Low';
  age: string;
  assignedTo: string;
  fieldsCount: number;
  status: 'New' | 'In Progress' | 'Pending Review' | 'On Hold';
  extractedValue?: string;
  fieldDescription?: string;
  expectedFormat?: string;
}

interface ValidationQueueProps {
  onValidateClick?: (item: QueueItem) => void;
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

export function ValidationQueue({ onValidateClick }: ValidationQueueProps = {}) {
  const [documentType, setDocumentType] = useState('all');
  const [confidenceRange, setConfidenceRange] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter to show only documents assigned to the current user
  const filteredData = mockData.filter(item => item.assignedTo === 'You');
  
  const totalItems = filteredData.length;
  const itemsPerPage = 5;

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
              {filteredData.map((item) => (
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
                      'bg-[#FF0081]/10 text-[#FF0081]'
                    }>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Button
                      onClick={() => onValidateClick?.(item)}
                      className="bg-[#0292DC] hover:bg-[#012F66] text-white transition-colors"
                    >
                      Validate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-[#3a3a3a] flex items-center justify-between">
          <div className="text-[#80989A] dark:text-[#a0a0a0]">
            Showing {Math.min(1, totalItems)}-{Math.min(itemsPerPage, totalItems)} of {totalItems} items
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white disabled:opacity-50"
            >
              Previous
            </Button>
            {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => setCurrentPage(page)}
                className={
                  currentPage === page
                    ? 'bg-[#0292DC] hover:bg-[#012F66] text-white'
                    : 'border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white'
                }
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="border-[#D0D5DD] dark:border-[#4a4a4a] text-[#012F66] dark:text-white disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}