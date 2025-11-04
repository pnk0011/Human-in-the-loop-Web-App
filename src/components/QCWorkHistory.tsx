import React, { useState } from 'react';
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
import { Search, FileText } from 'lucide-react';

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
  documents?: QCCompletedDocument[];
  isLoading?: boolean;
}

export function QCWorkHistory({ onViewClick, documents = [], isLoading = false }: QCWorkHistoryProps) {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Total Completed</div>
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
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }, (_, index) => (
                  <tr
                    key={`loading-${index}`}
                    className="border-b border-[#E5E7EB] dark:border-[#3a3a3a]"
                  >
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded-full animate-pulse w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-12"></div>
                    </td>
                  </tr>
                ))
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center" style={{ padding: '20px' }}>
                      <div className="w-16 h-16 bg-[#F5F7FA] dark:bg-[#3a3a3a] rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-[#80989A] dark:text-[#a0a0a0]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#012F66] dark:text-white mb-2">
                        No Documents Found
                      </h3>
                      <p className="text-[#80989A] dark:text-[#a0a0a0] text-center mb-4 max-w-md">
                        No completed QC reviews found in your work history yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map((doc) => (
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
                  </tr>
                ))
              )}
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
