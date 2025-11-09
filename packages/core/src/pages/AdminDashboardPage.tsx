import { Users, Mail, MessageSquare, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { Badge } from '../components/common'

interface User {
  id: string
  privyUserId: string
  displayName: string | null
  email: string | null
  discordUsername: string | null
  walletAddress: string | null
  role: string
  profileCompleted: string | null
  createdAt: string
  lastLoginAt: string | null
}

export const AdminDashboardPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
              <p className="text-text-secondary">
                Manage users and view admin team members
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">Total Admins</p>
                <p className="text-2xl font-bold text-text-primary">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary/60" />
            </div>
          </div>

          <div className="card p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">Profiles Completed</p>
                <p className="text-2xl font-bold text-text-primary">
                  {users.filter(u => u.profileCompleted).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500/60" />
            </div>
          </div>

          <div className="card p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">Pending Profiles</p>
                <p className="text-2xl font-bold text-text-primary">
                  {users.filter(u => !u.profileCompleted).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-yellow-500/60" />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border-primary bg-bg-secondary/30">
            <h2 className="text-lg font-semibold text-text-primary">Admin Team Members</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                <p className="text-sm text-text-secondary">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-text-primary mb-1">Failed to load users</p>
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
                      Admin
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
                      Last Login
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-bg-tertiary/10 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">
                              {user.displayName || 'Unnamed User'}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              {user.privyUserId.substring(0, 20)}...
                            </p>
                          </div>
                        </div>
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
                            <span className="text-xs text-text-tertiary italic">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {user.profileCompleted ? (
                          <Badge variant="success" className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle size={12} className="mr-1" />
                            Complete
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
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
                        <div className="text-sm text-text-secondary">
                          {formatDate(user.lastLoginAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
