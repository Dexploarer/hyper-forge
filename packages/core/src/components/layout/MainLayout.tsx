import React, { useState } from 'react'
import { NavigationView } from '@/types'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { MobileMenuDrawer } from './MobileMenuDrawer'

interface MainLayoutProps {
  currentView: NavigationView
  onViewChange: (view: NavigationView) => void
  children: React.ReactNode
}

export function MainLayout({ currentView, onViewChange, children }: MainLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile Layout (< 1024px) */}
      <div className="lg:hidden flex flex-col h-screen bg-gradient-to-br from-bg-primary to-bg-secondary overflow-hidden">
        {/* Main Content with bottom padding for nav */}
        <main id="main-content" className="flex-1 overflow-auto relative pb-16" tabIndex={-1}>
          {/* Subtle grid background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
            <div
              className="h-full w-full"
              className="grid-background"
              style={{
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          {/* Background image - bottom right corner */}
          <div 
            className="absolute bottom-0 right-0 pointer-events-none z-0"
            style={{
              backgroundImage: 'url(/Untitled%20design%20(3)/2.svg)',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom right',
              backgroundSize: 'contain',
              width: '50%',
              height: '50%',
              minWidth: '400px',
              minHeight: '400px',
              opacity: 0.3
            }}
          />

          {/* Page content */}
          <div className="relative z-10 h-full">
            {children}
          </div>
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          currentView={currentView}
          onViewChange={onViewChange}
          onMoreClick={() => setIsMenuOpen(true)}
        />

        {/* Mobile Menu Drawer */}
        <MobileMenuDrawer
          isOpen={isMenuOpen}
          currentView={currentView}
          onClose={() => setIsMenuOpen(false)}
          onViewChange={onViewChange}
        />
      </div>

      {/* Desktop Layout (>= 1024px) */}
      <div className="hidden lg:flex h-screen bg-gradient-to-br from-bg-primary to-bg-secondary overflow-hidden gap-0">
        {/* Left Sidebar */}
        <Sidebar currentView={currentView} onViewChange={onViewChange} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <TopBar currentView={currentView} />

          {/* Main Canvas/Workspace */}
          <main id="main-content" className="flex-1 overflow-auto relative" tabIndex={-1}>
            {/* Subtle grid background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)',
                  backgroundSize: '50px 50px'
                }}
              />
            </div>

            {/* Background image - bottom right corner */}
            <div 
              className="absolute bottom-0 right-0 pointer-events-none z-0"
              style={{
                backgroundImage: 'url(/Untitled%20design%20(3)/2.svg)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'bottom right',
                backgroundSize: 'contain',
                width: '50%',
                height: '50%',
                minWidth: '400px',
                minHeight: '400px',
                opacity: 0.3
              }}
            />

            {/* Page content */}
            <div className="relative z-10 h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
