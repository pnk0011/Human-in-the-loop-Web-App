import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
import { Eye, Search, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface QCCompletedDocument {
  id: string;
  documentName: string;
  documentType: string;
  reviewer: string;
  completedDate: string;
  reviewedDate: string;
  fieldsCount: number;
  approvedCount: number;
  sentBackCount: number;
  passRate: number;
}

interface QCWorkHistoryProps {
  onViewClick: (doc: QCCompletedDocument) => void;
}

// Generate mock QC completed documents
const generateMockQCHistory = (): QCCompletedDocument[] => {
  const types = ['Invoice', 'Policy Document', 'Claim Form', 'Medical Record'];
  const reviewers = ['Jane Smith', 'John Doe', 'Mike Johnson', 'Sarah Wilson', 'Tom Brown'];
  const documents: QCCompletedDocument[] = [];
  
  for (let i = 1; i <= 42; i++) {
    const fieldsCount = Math.floor(Math.random() * 8) + 5;
    const approvedCount = Math.floor(fieldsCount * (0.6 + Math.random() * 0.3));
    const sentBackCount = fieldsCount - approvedCount;
    
    const reviewedDate = new Date(2024, 2, Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 24));
    const completedDate = new Date(reviewedDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
    
    documents.push({
      id: String(i),
      documentName: `DOC-2024-${String(i).padStart(4, '0')}`,
      documentType: types[Math.floor(Math.random() * types.length)],
      reviewer: reviewers[Math.floor(Math.random() * reviewers.length)],
      reviewedDate: reviewedDate.toISOString(),
      completedDate: completedDate.toISOString(),
      fieldsCount,
      approvedCount,
      sentBackCount,
      passRate: Math.floor((approvedCount / fieldsCount) * 100),
    });
  }
  
  // Sort by date descending (most recent first)
  return documents.sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());
};

const mockQCHistory = generateMockQCHistory();

export function QCWorkHistory({ onViewClick }: QCWorkHistoryProps) {
  const [documents] = useState<QCCompletedDocument[]>(mockQCHistory);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reviewerFilter, setReviewerFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredDocuments = documents.filter((doc) => {
    if (searchQuery && !doc.documentName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (typeFilter !== 'all' && doc.documentType !== typeFilter) {
      return false;
    }
    if (reviewerFilter !== 'all' && doc.reviewer !== reviewerFilter) {
      return false;
    }
    if (dateFilter !== 'all') {
      const docDate = new Date(doc.completedDate);
      const now = new Date();
      if (dateFilter === 'today') {
        return docDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return docDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return docDate >= monthAgo;
      }
    }
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  const handleFilterChange = (filterSetter: (value: string) => void, value: string) => {
    filterSetter(value);
    setCurrentPage(1);
  };

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 90) return 'text-green-600';
    if (passRate >= 70) return 'text-[#FFC018]';
    return 'text-[#FF0081]';
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Invoice':
        return 'bg-[#0292DC]/10 text-[#0292DC]';
      case 'Policy Document':
        return 'bg-[#10B981]/10 text-[#10B981]';
      case 'Claim Form':
        return 'bg-[#FFC018]/10 text-[#FFC018]';
      case 'Medical Record':
        return 'bg-[#FF0081]/10 text-[#FF0081]';
      default:
        return 'bg-[#80989A]/10 text-[#80989A]';
    }
  };

  const uniqueReviewers = Array.from(new Set(documents.map(d => d.reviewer))).sort();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Total Reviewed</div>
          <div className="text-[#012F66] dark:text-white text-3xl font-bold">{documents.length}</div>
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">This Week</div>
          <div className="text-[#0292DC] dark:text-[#0292DC] text-3xl font-bold">
            {documents.filter(d => {
              const docDate = new Date(d.completedDate);
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return docDate >= weekAgo;
            }).length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Avg. Pass Rate</div>
          <div className="text-green-600 text-3xl font-bold">
            {Math.round(documents.reduce((sum, doc) => sum + doc.passRate, 0) / documents.length)}%
          </div>
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Total Fields</div>
          <div className="text-[#FFC018] text-3xl font-bold">
            {documents.reduce((sum, doc) => sum + doc.fieldsCount, 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#80989A] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a]"
            />
          </div>
          <Select value={typeFilter} onValueChange={(value) => handleFilterChange(setTypeFilter, value)}>
            <SelectTrigger className="w-48 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a]">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Invoice">Invoice</SelectItem>
              <SelectItem value="Policy Document">Policy Document</SelectItem>
              <SelectItem value="Claim Form">Claim Form</SelectItem>
              <SelectItem value="Medical Record">Medical Record</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reviewerFilter} onValueChange={(value) => handleFilterChange(setReviewerFilter, value)}>
            <SelectTrigger className="w-48 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a]">
              <SelectValue placeholder="Reviewer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviewers</SelectItem>
              {uniqueReviewers.map((reviewer) => (
                <SelectItem key={reviewer} value={reviewer}>
                  {reviewer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={(value) => handleFilterChange(setDateFilter, value)}>
            <SelectTrigger className="w-48 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* QC Work History Table */}
      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA] dark:bg-[#1a1a1a] border-b border-[#E5E7EB] dark:border-[#4a4a4a]">
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Document</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Type</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Reviewer</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">QC Completed</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Fields</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">QC Results</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Pass Rate</th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">View</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#3a3a3a] border-b border-[#E5E7EB] dark:border-[#4a4a4a]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#80989A]" />
                      <span className="text-[#012F66] dark:text-white">{doc.documentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getTypeBadgeColor(doc.documentType)}>
                      {doc.documentType}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-[#80989A] dark:text-[#a0a0a0]">
                    {doc.reviewer}
                  </td>
                  <td className="px-6 py-4 text-[#80989A] dark:text-[#a0a0a0]">
                    {new Date(doc.completedDate).toLocaleDateString()} {new Date(doc.completedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-[#012F66] dark:text-white">{doc.fieldsCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-[#80989A] dark:text-[#a0a0a0]">{doc.approvedCount}</span>
                      </div>
                      {doc.sentBackCount > 0 && (
                        <div className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-[#FF0081]" />
                          <span className="text-[#80989A] dark:text-[#a0a0a0]">{doc.sentBackCount}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getPassRateColor(doc.passRate)}>{doc.passRate}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewClick(doc)}
                      className="text-[#0292DC] hover:bg-[#0292DC]/10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#E5E7EB] dark:border-[#4a4a4a]">
            <div className="text-[#80989A] dark:text-[#a0a0a0]">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length} documents
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
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
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
