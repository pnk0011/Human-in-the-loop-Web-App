import { useState } from 'react';
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
import { Users, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Document {
  id: string;
  documentName: string;
  documentType: string;
  fieldsCount: number;
  confidence: number;
  priority: 'High' | 'Medium' | 'Low';
  uploadDate: string;
  status: 'Unassigned' | 'Assigned' | 'In Progress' | 'Completed';
  assignedTo?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Reviewer' | 'QC';
  currentLoad: number;
}

type SortField = 'documentName' | 'confidence' | 'priority' | 'uploadDate';
type SortDirection = 'asc' | 'desc';

// Generate more mock documents for pagination
const generateMockDocuments = (): Document[] => {
  const types = ['Invoice', 'Purchase Order', 'Receipt', 'Contract'];
  const statuses: Array<'Unassigned' | 'Assigned' | 'In Progress' | 'Completed'> = ['Unassigned', 'Assigned', 'In Progress', 'Completed'];
  const priorities: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];
  const assignees = ['Jane Smith', 'John Doe', 'Mike Johnson', 'Sarah Wilson', 'Tom Brown'];
  
  const documents: Document[] = [];
  
  for (let i = 1; i <= 47; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    documents.push({
      id: String(i),
      documentName: `${type.substring(0, 3).toUpperCase()}-2024-${String(i).padStart(4, '0')}`,
      documentType: type,
      fieldsCount: Math.floor(Math.random() * 10) + 3,
      confidence: Math.floor(Math.random() * 60) + 35,
      priority,
      uploadDate: new Date(2024, 2, Math.floor(Math.random() * 20) + 1).toISOString().split('T')[0],
      status,
      assignedTo: status === 'Assigned' || status === 'In Progress' ? assignees[Math.floor(Math.random() * assignees.length)] : undefined,
    });
  }
  
  return documents;
};

const mockDocuments = generateMockDocuments();

const mockUsers: User[] = [
  { id: '1', name: 'Jane Smith', email: 'jane.smith@medpro.com', role: 'Reviewer', currentLoad: 12 },
  { id: '2', name: 'John Doe', email: 'john.doe@medpro.com', role: 'Reviewer', currentLoad: 8 },
  { id: '3', name: 'Mike Johnson', email: 'mike.johnson@medpro.com', role: 'Reviewer', currentLoad: 15 },
  { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@medpro.com', role: 'QC', currentLoad: 5 },
  { id: '5', name: 'Tom Brown', email: 'tom.brown@medpro.com', role: 'Reviewer', currentLoad: 10 },
];

export function DocumentAssignment() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const handleAssign = () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    const user = mockUsers.find((u) => u.id === selectedUser);
    if (!user) return;

    setDocuments((prev) =>
      prev.map((doc) =>
        selectedDocuments.has(doc.id)
          ? { ...doc, status: 'Assigned' as const, assignedTo: user.name }
          : doc
      )
    );

    toast.success(`${selectedDocuments.size} document(s) assigned to ${user.name}`);
    setSelectedDocuments(new Set());
    setIsAssignDialogOpen(false);
    setSelectedUser('');
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

  let filteredDocuments = documents.filter((doc) => {
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (typeFilter !== 'all' && doc.documentType !== typeFilter) return false;
    if (priorityFilter !== 'all' && doc.priority !== priorityFilter) return false;
    if (searchQuery && !doc.documentName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

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
          <div className="text-[#012F66] dark:text-white text-3xl font-bold">{documents.length}</div>
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Unassigned</div>
          <div className="text-[#FF0081] text-3xl font-bold">
            {documents.filter((d) => d.status === 'Unassigned').length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Assigned</div>
          <div className="text-[#0292DC] text-3xl font-bold">
            {documents.filter((d) => d.status === 'Assigned').length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">In Progress</div>
          <div className="text-[#FFC018] text-3xl font-bold">
            {documents.filter((d) => d.status === 'In Progress').length}
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#80989A]" />
              <span className="text-[#012F66] dark:text-white">Filters</span>
            </div>
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
            />
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange(setStatusFilter, value)}>
              <SelectTrigger className="w-40 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => handleFilterChange(setTypeFilter, value)}>
              <SelectTrigger className="w-40 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="Purchase Order">Purchase Order</SelectItem>
                <SelectItem value="Receipt">Receipt</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => handleFilterChange(setPriorityFilter, value)}>
              <SelectTrigger className="w-40 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {selectedDocuments.size > 0 && (
              <>
                <span className="text-[#80989A] dark:text-[#a0a0a0]">{selectedDocuments.size} selected</span>
                <Button
                  onClick={() => setIsAssignDialogOpen(true)}
                  className="bg-[#0292DC] hover:bg-[#012F66] text-white"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Assign to Reviewer
                </Button>
                <Button
                  onClick={handleBulkUnassign}
                  variant="outline"
                  className="border-[#FF0081] dark:border-[#FF0081] text-[#FF0081] hover:bg-[#FF0081] hover:text-white"
                >
                  Unassign
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
                <th
                  className="px-6 py-4 text-left text-[#012F66] dark:text-white cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-[#2a2a2a]"
                  onClick={() => handleSort('documentName')}
                >
                  Document {getSortIcon('documentName')}
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
              {paginatedDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#3a3a3a] border-b border-[#E5E7EB] dark:border-[#3a3a3a]">
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedDocuments.has(doc.id)}
                      onCheckedChange={() => toggleDocument(doc.id)}
                    />
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
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#E5E7EB] dark:border-[#3a3a3a]">
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
                  // Show first page, last page, current page, and pages around current
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
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                  <SelectValue placeholder="Choose a reviewer" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="text-[#012F66]">{user.name}</div>
                          <div className="text-[#80989A]">{user.email}</div>
                        </div>
                        <div className="ml-4">
                          <Badge className={user.role === 'QC' ? 'bg-[#FFC018] text-white' : 'bg-[#0292DC] text-white'}>
                            {user.role}
                          </Badge>
                          <span className="text-[#80989A] ml-2">({user.currentLoad} docs)</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              className="bg-[#0292DC] hover:bg-[#012F66] text-white"
            >
              Assign Documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}