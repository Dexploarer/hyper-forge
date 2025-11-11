import {
  Users,
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  User as UserIcon,
  AlertCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { Badge } from "../components/common";
import { useAuth } from "../contexts/AuthContext";

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

type AdminTab = "overview" | "profiles";

interface RoleChangeModalProps {
  user: User;
  newRole: "admin" | "member";
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
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
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { getAccessToken } = usePrivy();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [roleChangeUser, setRoleChangeUser] = useState<{
    user: User;
    newRole: "admin" | "member";
  } | null>(null);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
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
  };

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

  const adminCount = users.filter((u) => u.role === "admin").length;
  const memberCount = users.filter((u) => u.role === "member").length;

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
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
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                    <p className="text-sm text-text-secondary mb-1">Admins</p>
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
              <h2 className="text-lg font-semibold text-text-primary">
                User Profiles
              </h2>
              <p className="text-sm text-text-tertiary mt-1">
                View and manage all registered users and their roles
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">
                    Loading users...
                  </p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {users.map((user) => {
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
                                <p className="font-medium text-text-primary">
                                  {user.displayName || "Unnamed User"}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-xs text-text-tertiary">
                                      (You)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-text-tertiary">
                                  {user.privyUserId.substring(0, 20)}...
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
    </div>
  );
};

export default AdminDashboardPage;
