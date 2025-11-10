import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical, X } from 'lucide-react'
import { cn } from '@/styles'

export interface QuickAction {
  id: string
  label: string
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger'
  divider?: boolean
}

export interface QuickActionMenuProps {
  actions: QuickAction[]
  trigger?: React.ReactNode
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  className?: string
}

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  actions,
  trigger,
  position = 'bottom-right',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const positionClasses = {
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2'
  }

  const handleActionClick = (action: QuickAction) => {
    if (action.disabled) return
    action.onClick()
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'hover:bg-bg-hover text-text-secondary hover:text-text-primary',
          isOpen && 'bg-bg-hover text-text-primary'
        )}
        aria-label="More actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger || <MoreVertical className="w-4 h-4" />}
      </button>

      {/* Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            'absolute z-50 min-w-[180px] bg-bg-secondary/95 backdrop-blur-md border border-border-primary rounded-lg shadow-xl overflow-hidden',
            'animate-fade-in [&_*]:drop-shadow-md',
            positionClasses[position]
          )}
          role="menu"
        >
          {actions.map((action, index) => {
            const Icon = action.icon
            const showDivider = action.divider || (index > 0 && actions[index - 1].divider)

            return (
              <React.Fragment key={action.id}>
                {showDivider && (
                  <div className="h-px bg-border-primary my-1" />
                )}
                <button
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                    'text-text-secondary hover:text-text-primary',
                    action.variant === 'danger'
                      ? 'hover:bg-red-500/10 hover:text-red-400'
                      : 'hover:bg-bg-hover',
                    action.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  role="menuitem"
                >
                  {Icon && <Icon className="w-4 h-4 drop-shadow-sm" />}
                  <span className="flex-1 text-left drop-shadow-sm">{action.label}</span>
                </button>
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}

