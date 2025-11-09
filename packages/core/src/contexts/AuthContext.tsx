import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ProfileCompletionModal } from '../components/auth/ProfileCompletionModal'

interface User {
  id: string
  displayName: string | null
  email: string | null
  discordUsername: string | null
  profileCompleted: string | null
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  needsProfileCompletion: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => boolean
  completeProfile: (profile: {
    displayName: string
    email: string
    discordUsername: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'asset_forge_auth'
const SESSION_ID_KEY = 'asset_forge_session'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(false)

  // Generate or retrieve session ID
  const getSessionId = (): string => {
    let sessionId = localStorage.getItem(SESSION_ID_KEY)
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(SESSION_ID_KEY, sessionId)
    }
    return sessionId
  }

  // Fetch user profile
  const fetchUser = async () => {
    try {
      setIsLoadingUser(true)
      const sessionId = getSessionId()
      const response = await fetch(`/users/me?sessionId=${sessionId}`)
      const data = await response.json()

      if (data.user) {
        setUser(data.user)
        // Check if profile needs completion
        if (!data.user.profileCompleted) {
          setNeedsProfileCompletion(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    } finally {
      setIsLoadingUser(false)
    }
  }

  // Check authentication on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored === 'authenticated') {
      setIsAuthenticated(true)
      fetchUser()
    }
  }, [])

  const login = async (password: string): Promise<boolean> => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'authenticated')
      setIsAuthenticated(true)
      await fetchUser()
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setIsAuthenticated(false)
    setUser(null)
    setNeedsProfileCompletion(false)
  }

  const checkAuth = (): boolean => {
    return isAuthenticated
  }

  const completeProfile = async (profile: {
    displayName: string
    email: string
    discordUsername: string
  }) => {
    const sessionId = getSessionId()
    const response = await fetch('/users/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        ...profile,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save profile')
    }

    const data = await response.json()
    setUser(data.user)
    setNeedsProfileCompletion(false)
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      needsProfileCompletion,
      login,
      logout,
      checkAuth,
      completeProfile,
    }}>
      {children}
      {needsProfileCompletion && !isLoadingUser && (
        <ProfileCompletionModal onComplete={completeProfile} />
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
