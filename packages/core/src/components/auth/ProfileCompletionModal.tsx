import { UserCircle, Mail, Sparkles, Check } from 'lucide-react'
import React, { useState } from 'react'

import { Button, Input } from '../common'

interface ProfileCompletionModalProps {
  onComplete: (profile: {
    displayName: string
    email: string
    discordUsername?: string
  }) => Promise<void>
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  onComplete,
}) => {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!displayName.trim()) {
      setError('Please enter your name')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    setIsSubmitting(true)
    try {
      await onComplete({
        displayName: displayName.trim(),
        email: email.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-x-0 top-14 bottom-16 lg:top-16 lg:bottom-0 z-50 flex items-center justify-center bg-black/60 overflow-hidden">
      <div className="w-full max-w-md mx-4 bg-gradient-to-br from-bg-primary to-bg-secondary border border-border-primary rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border-primary">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Welcome to Asset Forge!</h2>
              <p className="text-sm text-text-secondary">Set up your profile to start creating 3D assets</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <UserCircle size={16} className="text-text-secondary" />
              Display Name <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g., Alex GameDev"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full"
              autoFocus
            />
            <p className="text-xs text-text-tertiary">
              This name will be shown on your generated assets and projects
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Mail size={16} className="text-text-secondary" />
              Email Address <span className="text-red-400">*</span>
            </label>
            <Input
              type="email"
              placeholder="e.g., alex@gamedev.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-text-tertiary">
              We'll use this to notify you about your asset generation progress
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={18} />
                Complete Profile
              </>
            )}
          </Button>
        </form>

        {/* Footer Note */}
        <div className="px-6 pb-6">
          <p className="text-xs text-text-tertiary text-center">
            Ready to start generating amazing 3D assets for your game? Let's begin!
          </p>
        </div>
      </div>
    </div>
  )
}
