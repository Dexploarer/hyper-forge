import { User as UserIcon, X, Save, Loader2 } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import type { User } from '@/services/api/UsersAPIClient'
import { usersClient } from '@/services/api/UsersAPIClient'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/common'

interface UserProfileModalProps {
  open: boolean
  user: User | null
  sessionId: string
  onClose: () => void
  onSuccess?: (updatedUser: User) => void
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  open,
  user,
  sessionId,
  onClose,
  onSuccess,
}) => {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [discordUsername, setDiscordUsername] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setEmail(user.email || '')
      setDiscordUsername(user.discordUsername || '')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      const response = await usersClient.updateUserProfile(sessionId, {
        displayName,
        email,
        discordUsername,
      })

      onSuccess?.(response.user)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const isValid = displayName.trim() !== '' && email.trim() !== ''

  return (
    <Modal open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Edit Profile</h2>
              <p className="text-sm text-text-secondary">Update your personal information</p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-text-primary mb-1">
                Display Name <span className="text-red-400">*</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter your display name"
                required
              />
              <p className="text-xs text-text-tertiary mt-1">This will be visible to other users</p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="your.email@example.com"
                required
              />
            </div>

            {/* Discord Username */}
            <div>
              <label htmlFor="discordUsername" className="block text-sm font-medium text-text-primary mb-1">
                Discord Username
              </label>
              <input
                id="discordUsername"
                type="text"
                value={discordUsername}
                onChange={(e) => setDiscordUsername(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="username#1234"
              />
              <p className="text-xs text-text-tertiary mt-1">Optional - for team communication</p>
            </div>

            {/* Wallet Address (Read-only) */}
            {user?.walletAddress && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Wallet Address
                </label>
                <div className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-text-secondary font-mono text-sm">
                  {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
                </div>
                <p className="text-xs text-text-tertiary mt-1">Connected wallet (read-only)</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  )
}
