import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { Label } from "./ui/label";
import { UserPlus, Pencil, Trash2, Search, Loader2, Users, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { userAPI, User, CreateUserRequest, UpdateUserRequest, UserStatsResponse } from "../services/userAPI";

// User interface is imported from userAPI service


export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPageFromAPI, setCurrentPageFromAPI] = useState(1);
  const [hasApiError, setHasApiError] = useState(false);
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    reviewers_count: 0,
    qc_count: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load stats on component mount
  // useEffect(() => {
  //   loadStats();
  // }, []);

  // Load users on component mount and when filters change
  useEffect(() => {
    loadUsers();
  }, [currentPage, debouncedSearchQuery, roleFilter, statusFilter, itemsPerPage]);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await userAPI.getStats();
      if (response.status === 'success' && response.stats) {
        setStats(response.stats);
      }
    } catch (error: any) {
      // Failed to load stats
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setHasApiError(false);
    try {
      const response = await userAPI.getUsers(currentPage, itemsPerPage, debouncedSearchQuery, roleFilter !== 'all' ? roleFilter : undefined, statusFilter !== 'all' ? statusFilter : undefined);
      if (response.status === 'success' && response.users) {
        // Set stats from API response and map field names
        if (response.stats) {
          setStats({
            total_users: response.stats.total_users,
            active_users: response.stats.active_users,
            reviewers_count: response.stats.reviewer_count || 0, // Map API field to component field
            qc_count: response.stats.qc_count,
          });
        }
        
        // Convert API response to match component expectations
        const formattedUsers = response.users.map(user => ({
          ...user,
          id: user.email, // Use email as ID since API doesn't provide separate ID
          name: `${user.first_name} ${user.last_name}`,
          isActive: user.isactive,
          status: user.isactive ? 'Active' as const : 'Inactive' as const,
          createdAt: user.created_time,
          lastLogin: user.last_login,
          qualityControl: user.quality_control,
          createdDate: user.created_time.split('T')[0],
          currentLoad: 'N/A',
          totalValidated: 'N/A',
          accuracy: Math.floor(Math.random() * 15) + 85, // Mock data for display
        }));
        setUsers(formattedUsers);
        
        // Set pagination data from API response
        if (response.pagination) {
          setTotalUsers(response.pagination.total_records);
          setTotalPages(response.pagination.total_pages);
          setCurrentPageFromAPI(response.pagination.page);
          setItemsPerPage(response.pagination.limit);
        } else {
          setTotalUsers(formattedUsers.length);
          setTotalPages(1);
          setCurrentPageFromAPI(1);
        }
      } else {
        toast.error(response.message || 'Failed to load users');
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(0);
        setCurrentPageFromAPI(1);
        setHasApiError(true);
      }
    } catch (error: any) {
      toast.error('Failed to load users. Please try again.');
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(0);
      setCurrentPageFromAPI(1);
      setHasApiError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    pwd: "",
    role: "Reviewer" as "Admin" | "Reviewer" | "QC",
    status: "Active" as "Active" | "Inactive",
    qualityControl: "",
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      pwd: "",
      role: "Reviewer",
      status: "Active",
      qualityControl: "",
    });
  };

  const handleCreateUser = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.pwd) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      const createUserData: CreateUserRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        'password': formData.pwd,
        role: formData.role,
        quality_control: formData.qualityControl || undefined,
      };

      const response = await userAPI.createUser(createUserData);
      
      if (response.status === 'success') {
        toast.success(`User ${formData.firstName} ${formData.lastName} created successfully`);
        setIsCreateDialogOpen(false);
        resetForm();
        // Reload users list and stats
        loadUsers();
        loadStats();
      } else {
        toast.error(response.message || 'Failed to create user');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser || !formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUpdating(true);
    try {
      const updateUserData: UpdateUserRequest = {
        email: editingUser.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        isactive: formData.status === 'Active',
      };

      if (formData.role === 'Reviewer') {
        updateUserData.quality_control = formData.qualityControl?.trim()
          ? formData.qualityControl.trim()
          : null;
      } else {
        updateUserData.quality_control = null;
      }

      const response = await userAPI.updateUser(updateUserData);
      
      if (response.status === 'success') {
        toast.success(`User ${formData.firstName} ${formData.lastName} updated successfully`);
        setIsEditDialogOpen(false);
        setEditingUser(null);
        resetForm();
        // Reload users list and stats
        loadUsers();
        loadStats();
      } else {
        toast.error(response.message || 'Failed to update user');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const response = await userAPI.deleteUser(userToDelete.email);
      
      if (response.status === 'success') {
        toast.success(`User ${userToDelete.name} deleted successfully`);
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        // Reload users list and stats
        loadUsers();
        loadStats();
      } else {
        toast.error(response.message || 'Failed to delete user');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.first_name || user.name?.split(' ')[0] || '',
      lastName: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      pwd: '', // Don't populate pwd for security
      role: user.role,
      status: user.status || (user.isActive ? 'Active' : 'Inactive'),
      qualityControl: user.qualityControl || user.quality_control || '',
    });
    setIsEditDialogOpen(true);
  };

  // Get list of QC users for assignment
  const qcUsers = users.filter((u) => u.role === "QC" && u.status === "Active");

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter)
      return false;
    if (statusFilter !== "all" && user.status !== statusFilter)
      return false;
    if (
      searchQuery &&
      !user.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
      !user.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getRoleBadgeColor = (role: string) => {
    return role === "QC"
      ? "bg-[#FFC018] text-white"
      : "bg-[#0292DC] text-white";
  };

  const getStatusBadgeColor = (status: string) => {
    return status === "Active"
      ? "bg-green-600 text-white"
      : "bg-[#80989A] text-white";
  };

  // Server-side pagination calculations
  const startIndex = (currentPageFromAPI - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + users.length, totalUsers);
  
  // Use API paginated data directly (server-side pagination)
  const paginatedUsers = users;

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
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Total Users</div>
          {isLoadingStats ? (
            <div className="h-9 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
          ) : (
            <div className="text-[#012F66] dark:text-white text-3xl font-bold">{stats.total_users}</div>
          )}
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">
            Active Users
          </div>
          {isLoadingStats ? (
            <div className="h-9 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
          ) : (
            <div className="text-green-600 text-3xl font-bold">
              {stats.active_users}
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">Reviewers</div>
          {isLoadingStats ? (
            <div className="h-9 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
          ) : (
            <div className="text-[#0292DC] text-3xl font-bold">
              {stats.reviewers_count}
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="text-[#80989A] dark:text-[#a0a0a0] mb-2">
            QC Specialists
          </div>
          {isLoadingStats ? (
            <div className="h-9 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
          ) : (
            <div className="text-[#FFC018] text-3xl font-bold">
              {stats.qc_count}
            </div>
          )}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm p-6 border border-[#E5E7EB] dark:border-[#3a3a3a]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-[#012F66] dark:text-white mb-4">Filter Users</h3>
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {isLoading && (
              <div className="flex items-center gap-2 text-[#80989A] dark:text-[#a0a0a0]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading users...</span>
              </div>
            )}
            <div className="w-full md:w-auto md:min-w-[150px]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#80989A] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
                />
              </div>
            </div>
            <div className="w-full md:w-auto md:min-w-[150px]">
              <label className="block text-[#012F66] dark:text-white mb-2">Role</label>
              <Select
                value={roleFilter}
                onValueChange={(value) => handleFilterChange(setRoleFilter, value)}
              >
                <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Reviewer">
                    Reviewer
                  </SelectItem>
                  <SelectItem value="QC">QC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-auto md:min-w-[150px]">
              <label className="block text-[#012F66] dark:text-white mb-2">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => handleFilterChange(setStatusFilter, value)}
              >
                <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-auto md:min-w-[150px]">
              <label className="block text-[#012F66] dark:text-white mb-2">Show</label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  const newPageSize = Number(value);
                  setItemsPerPage(newPageSize);
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
              >
                <SelectTrigger className="w-full md:w-auto bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
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
            {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearchQuery("");
                  setRoleFilter("all");
                  setStatusFilter("all");
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
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0292DC] hover:bg-[#012F66] text-white cursor-pointer whitespace-nowrap shadow-sm flex-shrink-0 self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm overflow-hidden border border-[#E5E7EB] dark:border-[#3a3a3a]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA] dark:bg-[#1a1a1a] border-b border-[#E5E7EB] dark:border-[#3a3a3a]">
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Current Load
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Total Validated
                </th>
                {/* <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">Accuracy</th> */}
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Created Date
                </th>
                <th className="px-6 py-4 text-left text-[#012F66] dark:text-white">
                  Actions
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
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-48"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded-full animate-pulse w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded-full animate-pulse w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-8"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-12"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-[#E5E7EB] dark:bg-[#3a3a3a] rounded animate-pulse"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                // Actual user data
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#F9FAFB] dark:hover:bg-[#3a3a3a] border-b border-[#E5E7EB] dark:border-[#3a3a3a]"
                  >
                    <td className="px-6 py-4">
                      <div className="text-[#012F66] dark:text-white">
                        {user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#80989A] dark:text-[#a0a0a0]">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={getRoleBadgeColor(user.role)}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={getStatusBadgeColor(
                          user.status,
                        )}
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[#012F66] dark:text-white">
                      {user.currentLoad}
                    </td>
                    <td className="px-6 py-4 text-[#012F66] dark:text-white">
                      {user.totalValidated}
                    </td>
                    {/* <td className="px-6 py-4 text-[#012F66] dark:text-white">{user.accuracy}%</td> */}
                    <td className="px-6 py-4 text-[#80989A] dark:text-[#a0a0a0]">
                      {new Date(
                        user.createdDate,
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="text-[#0292DC] hover:bg-[#0292DC]/10 cursor-pointer"
                      >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(user)}
                          className="text-[#FF0081] hover:bg-[#FF0081]/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* No Data Found State */}
        {!isLoading && users.length === 0 && !hasApiError && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-24 h-24 bg-[#F5F7FA] dark:bg-[#3a3a3a] rounded-full flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-[#80989A] dark:text-[#a0a0a0]" />
            </div>
            <h3 className="text-lg font-semibold text-[#012F66] dark:text-white mb-2">
              No Users Found
            </h3>
            <p className="text-[#80989A] dark:text-[#a0a0a0] text-center mb-6 max-w-md">
              {debouncedSearchQuery || roleFilter !== 'all' || statusFilter !== 'all' 
                ? "No users match your current filters. Try adjusting your search criteria or reset the filters."
                : "No users have been created yet. Start by adding your first user."
              }
            </p>
            {(debouncedSearchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearchQuery("");
                  setRoleFilter("all");
                  setStatusFilter("all");
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
              Failed to Load Users
            </h3>
            <p className="text-[#80989A] dark:text-[#a0a0a0] text-center mb-6 max-w-md">
              There was an error loading the user data. Please check your connection and try again.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={loadUsers}
                variant="outline"
                className="border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              {(debouncedSearchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearchQuery("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                    setCurrentPage(1);
                    loadUsers();
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
              Showing {startIndex + 1} to {endIndex} of {totalUsers} users
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

      {/* Create User Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      >
        <DialogContent className="bg-white dark:bg-[#2a2a2a] border-[#E5E7EB] dark:border-[#3a3a3a] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-[#012F66] dark:text-white">
              Create New User
            </DialogTitle>
            <DialogDescription className="text-[#80989A] dark:text-[#a0a0a0]">
              Add a new reviewer or QC specialist to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-2 -mr-2"  style={{maxHeight: '300px'}}>
            <div>
              <Label htmlFor="firstName" className="text-[#012F66] dark:text-white">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    firstName: e.target.value,
                  })
                }
                placeholder="Enter first name"
                className="mt-2 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-[#012F66] dark:text-white">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastName: e.target.value,
                  })
                }
                placeholder="Enter last name"
                className="mt-2 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-[#012F66] dark:text-white">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                placeholder="email@medpro.com"
                className="mt-2 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-[#012F66] dark:text-white">
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.pwd}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pwd: e.target.value,
                  })
                }
                placeholder="Enter password"
                className="mt-2 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-[#012F66] dark:text-white">
                Role *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: "Admin" | "Reviewer" | "QC") =>
                  setFormData({ ...formData, role: value, qualityControl: value === "QC" ? "" : formData.qualityControl })
                }
              >
                <SelectTrigger className="mt-2 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">
                    Admin
                  </SelectItem>
                  <SelectItem value="Reviewer">
                    Reviewer
                  </SelectItem>
                  <SelectItem value="QC">
                    QC Specialist
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "Reviewer" && (
              <div>
                <Label htmlFor="qualityControl" className="text-[#012F66] dark:text-white">
                  Quality Control Email
                </Label>
                <Input
                  id="qualityControl"
                  type="email"
                  value={formData.qualityControl}
                  onChange={(e) =>
                    setFormData({ ...formData, qualityControl: e.target.value })
                  }
                  placeholder="qc@example.com (Optional)"
                  className="mt-2 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
                />
                <p className="text-[#80989A] dark:text-[#a0a0a0] mt-1">
                  Enter the email of the QC specialist who will review this reviewer's work
                </p>
              </div>
            )}
            <div>
              <Label
                htmlFor="status"
                className="text-[#012F66] dark:text-white"
              >
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Active" | "Inactive") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="mt-2 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 sm:flex-row sm:justify-end sm:gap-3 mt-4 border-t border-[#E5E7EB] dark:border-[#3a3a3a] pt-4">
            {/* <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              className="w-full sm:w-auto border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white cursor-pointer"
            >
              Cancel
            </Button> */}
            <Button
              onClick={handleCreateUser}
              disabled={isCreating}
              className="w-full sm:w-auto bg-[#0292DC] hover:bg-[#012F66] text-white disabled:opacity-50 cursor-pointer"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="bg-white dark:bg-[#2a2a2a] border-[#E5E7EB] dark:border-[#3a3a3a] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-[#012F66] dark:text-white">
              Edit User
            </DialogTitle>
            <DialogDescription className="text-[#80989A] dark:text-[#a0a0a0]">
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-2 -mr-2" style={{maxHeight: '300px'}}>
            <div>
              <Label
                htmlFor="edit-firstName"
                className="text-[#012F66] dark:text-white"
              >
                First Name *
              </Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    firstName: e.target.value,
                  })
                }
                placeholder="Enter first name"
                className="mt-2 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
              />
            </div>
            <div>
              <Label
                htmlFor="edit-lastName"
                className="text-[#012F66] dark:text-white"
              >
                Last Name *
              </Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastName: e.target.value,
                  })
                }
                placeholder="Enter last name"
                className="mt-2 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
              />
            </div>
            <div>
              <Label
                htmlFor="edit-email"
                className="text-[#012F66] dark:text-white"
              >
                Email Address *
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                placeholder="email@medpro.com"
                className="mt-2 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
              />
            </div>
            <div>
              <Label
                htmlFor="edit-role"
                className="text-[#012F66] dark:text-white"
              >
                Role *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: "Admin" | "Reviewer" | "QC") =>
                  setFormData({ ...formData, role: value, qualityControl: value === "QC" ? "" : formData.qualityControl })
                }
              >
                <SelectTrigger className="mt-2 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">
                    Admin
                  </SelectItem>
                  <SelectItem value="Reviewer">
                    Reviewer
                  </SelectItem>
                  <SelectItem value="QC">
                    QC Specialist
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "Reviewer" && (
              <div>
                <Label htmlFor="edit-qualityControl" className="text-[#012F66] dark:text-white">
                  Quality Control Email
                </Label>
                <Input
                  id="edit-qualityControl"
                  type="email"
                  value={formData.qualityControl}
                  onChange={(e) =>
                    setFormData({ ...formData, qualityControl: e.target.value })
                  }
                  placeholder="qc@example.com (Optional)"
                  className="mt-2 dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white"
                />
                <p className="text-[#80989A] dark:text-[#a0a0a0] mt-1">
                  Enter the email of the QC specialist who will review this reviewer's work
                </p>
              </div>
            )}
            <div>
              <Label
                htmlFor="edit-status"
                className="text-[#012F66] dark:text-white"
              >
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Active" | "Inactive") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="mt-2 bg-white dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 sm:flex-row sm:justify-end sm:gap-3 mt-4 border-t border-[#E5E7EB] dark:border-[#3a3a3a] pt-4">
            {/* <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingUser(null);
                resetForm();
              }}
              className="w-full sm:w-auto border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white cursor-pointer"
            >
              Cancel
            </Button> */}
            <Button
              onClick={handleEditUser}
              disabled={isUpdating}
              className="w-full sm:w-auto bg-[#0292DC] hover:bg-[#012F66] text-white disabled:opacity-50 cursor-pointer"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent className="bg-white dark:bg-[#2a2a2a] border-[#E5E7EB] dark:border-[#3a3a3a]">
          <DialogHeader>
            <DialogTitle className="text-[#012F66] dark:text-white">
              Delete User
            </DialogTitle>
            <DialogDescription className="text-[#80989A] dark:text-[#a0a0a0]">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-[#FFF0F5] border border-[#FF0081]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#FF0081] rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-[#012F66] mb-1">
                    {userToDelete?.name}
                  </div>
                  <div className="text-[#80989A]">
                    {userToDelete?.email}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      className={getRoleBadgeColor(
                        userToDelete?.role || "Reviewer",
                      )}
                    >
                      {userToDelete?.role}
                    </Badge>
                    <span className="text-[#80989A]">
                      • {userToDelete?.currentLoad} documents assigned
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:flex-row sm:justify-end sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              className="w-full sm:w-auto border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-[#FF0081] hover:bg-[#FF0081]/90 text-white disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}