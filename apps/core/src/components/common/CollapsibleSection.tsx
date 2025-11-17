import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/styles'

export interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  className?: string
  headerClassName?: string
  badge?: string | number
  onToggle?: (isOpen: boolean) => void
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = false,
  icon: Icon,
  className,
  headerClassName,
  badge,
  onToggle
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  return (
    <div className={cn('border border-border-primary rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between p-4 bg-bg-secondary hover:bg-bg-hover transition-colors',
          'text-left',
          headerClassName
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-text-tertiary" />}
          <h3 className="font-semibold text-text-primary">{title}</h3>
          {badge !== undefined && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-text-tertiary transition-transform" />
        ) : (
          <ChevronRight className="w-5 h-5 text-text-tertiary transition-transform" />
        )}
      </button>

      {/* Content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-4 border-t border-border-primary">
          {children}
        </div>
      </div>
    </div>
  )
}

