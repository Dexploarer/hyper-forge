import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePrivy, useLogin } from '@privy-io/react-auth'
import { ProfileCompletionModal } from '../components/auth/ProfileCompletionModal'
import type { User } from '@/services/api/UsersAPIClient'

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  needsProfileCompletion: boolean
  login: (password?: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => boolean
  completeProfile: (profile: {
    displayName: string
    email: string
    discordUsername: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user: privyUser, logout: privyLogout, getAccessToken } = usePrivy()
  const [user, setUser] = useState<User | null>(null)
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(false)

  // Use Privy's login hook with callbacks
  const { login: privyLogin } = useLogin({
    onComplete: async () => {
      // After successful login, fetch user profile
      await fetchUser()
    },
    onError: (error) => {
      console.error('Login failed:', error)
    },
  })

  // Fetch user profile from our backend
  const fetchUser = async () => {
    try {
      setIsLoadingUser(true)
      const accessToken = await getAccessToken()

      if (!accessToken) {
        return
      }

      const response = await fetch('/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

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

  // Fetch user when Privy authentication changes
  useEffect(() => {
    if (ready && authenticated) {
      fetchUser()
    } else if (ready && !authenticated) {
      setUser(null)
      setNeedsProfileCompletion(false)
    }
  }, [ready, authenticated])

  // Login wrapper - compatible with old interface but uses Privy
  const login = async (_password?: string): Promise<boolean> => {
    try {
      privyLogin()
      return true // Login modal opened successfully
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    privyLogout()
    setUser(null)
    setNeedsProfileCompletion(false)
  }

  const checkAuth = (): boolean => {
    return authenticated
  }

  const completeProfile = async (profile: {
    displayName: string
    email: string
    discordUsername: string
  }) => {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch('/users/complete-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(profile),
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
      isAuthenticated: authenticated,
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
