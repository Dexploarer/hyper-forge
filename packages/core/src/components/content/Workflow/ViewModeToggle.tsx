/**
 * ViewModeToggle - Toggle between List and Workflow views
 * Matches TabNavigation styling
 */

import React from 'react'
import { List, Workflow } from 'lucide-react'
import { cn } from '@/styles'

export type ViewMode = 'list' | 'workflow'

export interface ViewModeToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange }) => {
  const modes: Array<{ value: ViewMode; label: string; icon: React.ReactNode }> = [
    { value: 'list', label: 'List View', icon: <List className="w-4 h-4" /> },
    { value: 'workflow', label: 'Workflow', icon: <Workflow className="w-4 h-4" /> },
  ]

  return (
    <div className="flex border-b border-[var(--border-primary)]">
      {modes.map(({ value, label, icon }) => {
        const isActive = mode === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 border-b-2 transition-all font-medium text-sm',
              isActive
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/30'
            )}
          >
            {icon}
            {label}
          </button>
        )
      })}
    </div>
  )
}
