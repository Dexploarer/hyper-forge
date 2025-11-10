import React, { useEffect, useRef } from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/styles'

export interface TrayProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
  defaultHeight?: 'sm' | 'md' | 'lg'
  resizable?: boolean
}

const Tray: React.FC<TrayProps> = ({
  open,
  onClose,
  children,
  title,
  className,
  defaultHeight = 'md',
  resizable = true
}) => {
  const trayRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<'sm' | 'md' | 'lg'>(defaultHeight)
  const [isDragging, setIsDragging] = React.useState(false)
  const dragStartY = useRef<number>(0)
  const dragStartHeight = useRef<number>(0)

  const heights = {
    sm: 'h-64',
    md: 'h-96',
    lg: 'h-[32rem]'
  }

  useEffect(() => {
    if (!open) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !trayRef.current) return

      const deltaY = dragStartY.current - e.clientY // Inverted because we drag up
      const newHeight = dragStartHeight.current + deltaY
      const viewportHeight = window.innerHeight

      // Convert to height category
      if (newHeight < viewportHeight * 0.25) {
        setHeight('sm')
      } else if (newHeight < viewportHeight * 0.5) {
        setHeight('md')
      } else {
        setHeight('lg')
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, open])

  const handleDragStart = (e: React.MouseEvent) => {
    if (!resizable) return
    setIsDragging(true)
    dragStartY.current = e.clientY
    const currentHeight = trayRef.current?.offsetHeight || 0
    dragStartHeight.current = currentHeight
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Tray */}
      <div
        ref={trayRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[91]',
          'bg-bg-secondary border-t border-border-primary shadow-2xl',
          'transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
          heights[height],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'tray-title' : undefined}
      >
        {/* Resize Handle */}
        {resizable && (
          <div
            className="absolute top-0 left-0 right-0 h-1 bg-border-primary cursor-ns-resize hover:bg-primary/50 transition-colors flex items-center justify-center group"
            onMouseDown={handleDragStart}
          >
            <div className="w-12 h-0.5 bg-text-tertiary group-hover:bg-primary transition-colors rounded" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          {title && (
            <h2 id="tray-title" className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
          )}
          <div className="flex items-center gap-2">
            {resizable && (
              <button
                onClick={() => {
                  const nextHeight = height === 'sm' ? 'md' : height === 'md' ? 'lg' : 'sm'
                  setHeight(nextHeight)
                }}
                className="p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Toggle tray size"
              >
                {height === 'lg' ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close tray"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-4rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}

export { Tray }

