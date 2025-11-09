/**
 * Skip Links Component
 * Provides keyboard navigation shortcuts for accessibility (WCAG 2.1 Level A)
 * Allows users to bypass repetitive navigation and jump to main content
 */

import React from 'react'
import { cn } from '@/styles'

interface SkipLink {
  href: string
  label: string
}

const DEFAULT_SKIP_LINKS: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
]

interface SkipLinksProps {
  links?: SkipLink[]
  className?: string
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ 
  links = DEFAULT_SKIP_LINKS,
  className 
}) => {
  return (
    <div className={cn('skip-links-container', className)}>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="skip-link"
          onClick={(e) => {
            e.preventDefault()
            const target = document.querySelector(link.href)
            if (target) {
              // Ensure target is focusable
              if (!target.hasAttribute('tabindex')) {
                target.setAttribute('tabindex', '-1')
              }
              ;(target as HTMLElement).focus()
              // Remove tabindex after focus to avoid tab order issues
              setTimeout(() => {
                target.removeAttribute('tabindex')
              }, 1000)
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

