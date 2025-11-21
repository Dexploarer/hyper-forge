import {
  Users,
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  Shield,
  User as UserIcon,
  AlertCircle,
  UserX,
  Trash2,
  RefreshCw,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { usePrivy } from "@privy-io/react-auth";

import { Badge, LoadingSpinner } from "../components/common";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "../hooks/useNavigation";
import { CDNManagementTab } from "../components/admin/CDNManagementTab";

interface User {
  id: string;
  privyUserId: string;
  displayName: string | null;
  email: string | null;
  discordUsername: string | null;
  walletAddress: string | null;
  role: string;
  profileCompleted: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

interface ActivityLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    displayName: string | null;
    email: string | null;
  } | null;
}

type AdminTab = "overview" | "profiles" | "activity" | "cdn";
type SortField = "name" | "role" | "status" | "joined" | "lastLogin";
type SortDirection = "asc" | "desc";

interface RoleChangeModalProps {
  user: User;
  newRole: "admin" | "member";
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

interface DeleteUserModalProps {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const RoleChangeModal: React.FC<RoleChangeModalProps> = ({
  user,
  newRole,
  onConfirm,
  onCancel,
  loading,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-modal"
      data-overlay="true"
    >
      <div className="card max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            Confirm Role Change
          </h3>
        </div>

        <p className="text-text-secondary mb-6">
          Are you sure you want to change{" "}
          <span className="font-medium text-text-primary">
            {user.displayName || user.email || "this user"}
          </span>
          's role to <span className="font-medium text-primary">{newRole}</span>
          ?
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-hover text-text-primary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  onConfirm,
  onCancel,
  loading,
}) => {
  const [confirmChecked, setConfirmChecked] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-modal"
      data-overlay="true"
    >
      <div className="card max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            Delete User
          </h3>
        </div>

        <p className="text-text-secondary mb-4">
          Are you sure you want to delete{" "}
          <span className="font-medium text-text-primary">
            {user.displayName || user.email || "this user"}
          </span>
          ? This will permanently delete all their data.
        </p>

        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
            className="w-4 h-4 rounded border-border-primary bg-bg-tertiary checked:bg-red-500"
          />
          <span className="text-sm text-text-secondary">
            I understand this action cannot be undone
          </span>
        </label>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-hover text-text-primary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !confirmChecked}
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to format relative time
const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? "s" : ""} ago`;
  if (diffDays < 365)
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? "s" : ""} ago`;
};

export const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { getAccessToken } = usePrivy();
  const { navigateToUserProfile } = useNavigation();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const [roleChangeUser, setRoleChangeUser] = useState<{
    user: User;
    newRole: "admin" | "member";
  } | null>(null);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Copy token state
  const [tokenCopied, setTokenCopied] = useState(false);

  // Activity log state
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityHasMore, setActivityHasMore] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "complete" | "pending"
  >("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("joined");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Ref to prevent infinite admin check loop
  const adminCheckRan = useRef(false);

  // Check admin access (only once)
  useEffect(() => {
    if (currentUser && !adminCheckRan.current) {
      adminCheckRan.current = true;
      if (currentUser.role !== "admin") {
        alert("Access denied. Admin privileges required.");
        window.location.href = "/";
      }
    }
  }, [currentUser]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();

      if (!accessToken) {
        setError("Authentication required. Please log in.");
        return;
      }

      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  const fetchActivityLog = useCallback(
    async (page = 1) => {
      try {
        setActivityLoading(true);
        const accessToken = await getAccessToken();

        if (!accessToken) {
          alert("Authentication required. Please log in.");
          return;
        }

        const response = await fetch(
          `/api/admin/activity-log?page=${page}&limit=50`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch activity log");
        }

        const data = await response.json();
        setActivityLogs(
          page === 1 ? data.logs : [...activityLogs, ...data.logs],
        );
        setActivityPage(page);
        setActivityHasMore(data.hasMore);
      } catch (err) {
        console.error("Failed to load activity log:", err);
      } finally {
        setActivityLoading(false);
      }
    },
    [getAccessToken, activityLogs],
  );

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch activity log when tab changes
  useEffect(() => {
    if (activeTab === "activity" && activityLogs.length === 0) {
      fetchActivityLog(1);
    }
  }, [activeTab, fetchActivityLog, activityLogs.length]);

  const handleRoleChange = async () => {
    if (!roleChangeUser) return;

    try {
      setRoleChangeLoading(true);
      const accessToken = await getAccessToken();

      if (!accessToken) {
        alert("Authentication required. Please log in.");
        setRoleChangeUser(null);
        return;
      }

      const response = await fetch(
        `/api/admin/users/${roleChangeUser.user.id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ role: roleChangeUser.newRole }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update role");
      }

      // Refresh users list
      await fetchUsers();

      // Close modal
      setRoleChangeUser(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user role");
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;

    try {
      setDeleteLoading(true);
      const accessToken = await getAccessToken();

      if (!accessToken) {
        alert("Authentication required. Please log in.");
        setDeleteUser(null);
        return;
      }

      const response = await fetch(`/api/admin/users/${deleteUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      // Refresh users list
      await fetchUsers();

      // Close modal
      setDeleteUser(null);

      alert("User deleted successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const handleCopyAccessToken = async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        alert("No access token available. Please log in.");
        return;
      }

      await navigator.clipboard.writeText(accessToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy token:", err);
      alert("Failed to copy access token to clipboard");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtered and sorted users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          user.displayName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.privyUserId?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Role filter
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const isComplete = user.profileCompleted !== null;
        if (statusFilter === "complete" && !isComplete) return false;
        if (statusFilter === "pending" && isComplete) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "name":
          aVal = a.displayName?.toLowerCase() || "";
          bVal = b.displayName?.toLowerCase() || "";
          break;
        case "role":
          aVal = a.role;
          bVal = b.role;
          break;
        case "status":
          aVal = a.profileCompleted ? 1 : 0;
          bVal = b.profileCompleted ? 1 : 0;
          break;
        case "joined":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case "lastLogin":
          aVal = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          bVal = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchQuery, roleFilter, statusFilter, sortField, sortDirection]);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const memberCount = users.filter((u) => u.role === "member").length;
  const pendingProfilesCount = users.filter((u) => !u.profileCompleted).length;

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Admin Dashboard
                </h1>
                <p className="text-text-secondary">
                  Manage users and view system statistics
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyAccessToken}
              className="px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors flex items-center gap-2"
            >
              {tokenCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Access Token
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 border-b border-border-primary">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 font-medium text-sm transition-all relative ${
                activeTab === "overview"
                  ? "text-primary border-b-2 border-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("profiles")}
              className={`px-6 py-3 font-medium text-sm transition-all relative ${
                activeTab === "profiles"
                  ? "text-primary border-b-2 border-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              User Profiles
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-6 py-3 font-medium text-sm transition-all relative ${
                activeTab === "activity"
                  ? "text-primary border-b-2 border-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Activity Log
            </button>
            <button
              onClick={() => setActiveTab("cdn")}
              className={`px-6 py-3 font-medium text-sm transition-all relative ${
                activeTab === "cdn"
                  ? "text-primary border-b-2 border-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              CDN Management
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="card p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-text-primary">
                      {users.length}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-primary/60" />
                </div>
              </div>

              <div className="card p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">
                      Total Admins
                    </p>
                    <p className="text-2xl font-bold text-text-primary">
                      {adminCount}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-red-500/60" />
                </div>
              </div>

              <div className="card p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">Members</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {memberCount}
                    </p>
                  </div>
                  <UserIcon className="w-8 h-8 text-blue-500/60" />
                </div>
              </div>

              <div className="card p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">
                      Profiles Completed
                    </p>
                    <p className="text-2xl font-bold text-text-primary">
                      {users.filter((u) => u.profileCompleted).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500/60" />
                </div>
              </div>

              <div className="card p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">
                      Pending Profiles
                    </p>
                    <p className="text-2xl font-bold text-text-primary">
                      {pendingProfilesCount}
                    </p>
                  </div>
                  <UserX className="w-8 h-8 text-yellow-500/60" />
                </div>
              </div>
            </div>

            {/* Quick Summary */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Quick Summary
              </h2>
              <p className="text-text-secondary">
                Welcome to the Admin Dashboard. Here you can view statistics and
                manage user roles. Use the tabs above to navigate between
                different sections.
              </p>
            </div>
          </>
        )}

        {/* User Profiles Tab */}
        {activeTab === "profiles" && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-border-primary bg-bg-secondary/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    User Profiles
                  </h2>
                  <p className="text-sm text-text-tertiary mt-1">
                    View and manage all registered users and their roles
                  </p>
                </div>
                <button
                  onClick={fetchUsers}
                  className="px-3 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-hover text-text-primary transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-wrap gap-3 mt-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="px-4 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="complete">Complete</option>
                  <option value="pending">Pending</option>
                </select>

                {/* Clear Filters */}
                {(searchQuery ||
                  roleFilter !== "all" ||
                  statusFilter !== "all") && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>

              {/* Results count */}
              <p className="text-sm text-text-tertiary mt-3">
                Showing {filteredAndSortedUsers.length} of {users.length} users
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <LoadingSpinner
                    size="lg"
                    text="Loading users..."
                    className="mx-auto"
                  />
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <XCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-text-primary mb-1">
                    Failed to load users
                  </p>
                  <p className="text-xs text-text-tertiary">{error}</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">No users yet</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-tertiary/20 border-b border-border-primary">
                    <tr>
                      <th
                        onClick={() => handleSort("name")}
                        className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          User
                          {sortField === "name" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("role")}
                        className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Role
                          {sortField === "role" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Contact
                      </th>
                      <th
                        onClick={() => handleSort("status")}
                        className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortField === "status" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("joined")}
                        className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Joined
                          {sortField === "joined" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("lastLogin")}
                        className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Last Login
                          {sortField === "lastLogin" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {filteredAndSortedUsers.map((user) => {
                      const isCurrentUser = user.id === currentUser?.id;
                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-bg-tertiary/10 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <button
                                  onClick={() => navigateToUserProfile(user.id)}
                                  className="font-medium text-text-primary hover:text-primary transition-colors text-left"
                                >
                                  {user.displayName || "Unnamed User"}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-xs text-text-tertiary">
                                      (You)
                                    </span>
                                  )}
                                </button>
                                <p className="text-xs text-text-tertiary">
                                  {user.privyUserId?.substring(0, 20) ||
                                    "No Privy ID"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {user.role === "admin" ? (
                              <Badge
                                variant="error"
                                className="bg-red-500/20 text-red-400 border-red-500/30"
                              >
                                <Shield size={12} className="mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-gray-500/20 text-gray-400 border-gray-500/30"
                              >
                                <UserIcon size={12} className="mr-1" />
                                Member
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {user.email && (
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                  <Mail size={14} />
                                  {user.email}
                                </div>
                              )}
                              {user.discordUsername && (
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                  <MessageSquare size={14} />
                                  {user.discordUsername}
                                </div>
                              )}
                              {!user.email && !user.discordUsername && (
                                <span className="text-xs text-text-tertiary italic">
                                  No contact info
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {user.profileCompleted ? (
                              <Badge
                                variant="success"
                                className="bg-green-500/20 text-green-400 border-green-500/30"
                              >
                                <CheckCircle size={12} className="mr-1" />
                                Complete
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              >
                                <XCircle size={12} className="mr-1" />
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                              <Calendar size={14} />
                              {formatDate(user.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                              <Clock size={14} />
                              {formatRelativeTime(user.lastLoginAt)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {!isCurrentUser && (
                              <div className="flex gap-2">
                                {user.role === "member" ? (
                                  <button
                                    onClick={() =>
                                      setRoleChangeUser({
                                        user,
                                        newRole: "admin",
                                      })
                                    }
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors"
                                  >
                                    Promote to Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setRoleChangeUser({
                                        user,
                                        newRole: "member",
                                      })
                                    }
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30 transition-colors"
                                  >
                                    Demote to Member
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeleteUser(user)}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors flex items-center gap-1"
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CDN Management Tab */}
        {activeTab === "cdn" && <CDNManagementTab />}

        {/* Activity Log Tab */}
        {activeTab === "activity" && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-border-primary bg-bg-secondary/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    Activity Log
                  </h2>
                  <p className="text-sm text-text-tertiary mt-1">
                    View all admin actions and system events
                  </p>
                </div>
                <button
                  onClick={() => fetchActivityLog(1)}
                  className="px-3 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-hover text-text-primary transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {activityLoading && activityLogs.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <LoadingSpinner
                    size="lg"
                    text="Loading activity log..."
                    className="mx-auto"
                  />
                </div>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">No activity yet</p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-bg-tertiary/20 border-b border-border-primary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Entity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary">
                      {activityLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-bg-tertiary/10 transition-colors"
                        >
                          <td className="px-4 py-4 text-sm text-text-secondary whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {log.user ? (
                              <button
                                onClick={() =>
                                  navigateToUserProfile(log.user!.id)
                                }
                                className="text-text-primary hover:text-primary transition-colors text-left font-medium"
                              >
                                {log.user.displayName ||
                                  log.user.email ||
                                  "Unknown User"}
                              </button>
                            ) : (
                              <span className="text-text-tertiary">
                                Unknown User
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              variant={
                                log.action === "user_delete"
                                  ? "error"
                                  : log.action === "role_change"
                                    ? "warning"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {log.action.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-sm text-text-secondary">
                            {log.entityType}
                            {log.entityId && (
                              <span className="text-xs text-text-tertiary ml-1">
                                ({log.entityId.substring(0, 8)}...)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-text-secondary">
                            {log.details &&
                            Object.keys(log.details).length > 0 ? (
                              <div className="max-w-xs truncate">
                                {Object.entries(log.details).map(
                                  ([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium">
                                        {key}:
                                      </span>{" "}
                                      {String(value)}
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-text-tertiary">
                            {log.ipAddress || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Load More */}
                {activityHasMore && (
                  <div className="p-4 border-t border-border-primary">
                    <button
                      onClick={() => fetchActivityLog(activityPage + 1)}
                      disabled={activityLoading}
                      className="w-full px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-hover text-text-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {activityLoading && <LoadingSpinner size="sm" />}
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Role Change Confirmation Modal */}
      {roleChangeUser && (
        <RoleChangeModal
          user={roleChangeUser.user}
          newRole={roleChangeUser.newRole}
          onConfirm={handleRoleChange}
          onCancel={() => setRoleChangeUser(null)}
          loading={roleChangeLoading}
        />
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUser && (
        <DeleteUserModal
          user={deleteUser}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteUser(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
