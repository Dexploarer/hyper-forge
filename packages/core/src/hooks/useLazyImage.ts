/**
 * Lazy Image Loading Hook
 * Uses Intersection Observer to load images only when they're about to enter viewport
 */

import { useState, useEffect, useRef } from 'react'

interface UseLazyImageOptions {
  placeholder?: string
  rootMargin?: string
  threshold?: number
}

export function useLazyImage(
  src: string,
  options: UseLazyImageOptions = {}
) {
  const { placeholder, rootMargin = '50px', threshold = 0.1 } = options
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!imgRef.current || !src) return

    // If image is already loaded, skip observer
    if (imageSrc === src) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Start loading image
          const img = new Image()
          img.onload = () => {
            setImageSrc(src)
            setIsLoaded(true)
            setError(false)
          }
          img.onerror = () => {
            setError(true)
            setIsLoaded(false)
          }
          img.src = src
          observer.disconnect()
        }
      },
      { rootMargin, threshold }
    )

    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [src, rootMargin, threshold, imageSrc])

  return { imgRef, imageSrc, isLoaded, error }
}

