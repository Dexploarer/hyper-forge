import { UserCircle, Mail, X, LogOut, Save } from "lucide-react";
import React, { useState } from "react";

import { Button, Input } from "../common";

interface User {
  id: string;
  displayName: string | null;
  email: string | null;
  discordUsername: string | null;
  profileCompleted: string | null;
}

interface ProfileSettingsModalProps {
  user: User;
  onClose: () => void;
  onSave: (profile: {
    displayName: string;
    email: string;
    discordUsername?: string;
  }) => Promise<void>;
  onLogout: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  user,
  onClose,
  onSave,
  onLogout,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!displayName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        displayName: displayName.trim(),
        email: email.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      onLogout();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-x-0 top-14 bottom-16 lg:top-16 lg:bottom-0 z-modal flex items-center justify-center bg-black/60 overflow-hidden"
      data-overlay="true"
    >
      <div className="w-full max-w-md mx-4 bg-gradient-to-br from-bg-primary to-bg-secondary border border-border-primary rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border-primary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                Profile Settings
              </h2>
              <p className="text-sm text-text-secondary">
                Manage your Asset Forge profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          >
            <X size={20} />
          </button>
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
            />
            <p className="text-xs text-text-tertiary">
              This name appears on your assets and projects
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
              Used for notifications about your asset generation
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {/* Save Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </Button>

            {/* Sign Out Button */}
            <Button
              type="button"
              onClick={handleLogout}
              className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-500/50"
            >
              <LogOut size={18} />
              Sign Out
            </Button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="px-6 pb-6">
          <p className="text-xs text-text-tertiary text-center">
            Your changes will be saved immediately
          </p>
        </div>
      </div>
    </div>
  );
};
