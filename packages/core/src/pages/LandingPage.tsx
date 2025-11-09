import React, { useState } from 'react'
import { Sparkles, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function LandingPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate a brief loading state for better UX
    await new Promise(resolve => setTimeout(resolve, 300))

    const success = login(password)

    if (!success) {
      setError('Invalid password')
      setPassword('')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        {/* Logo/Icon */}
        <div className="mb-8 animate-float">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <div className="relative bg-gradient-to-br from-primary to-accent p-6 rounded-2xl shadow-2xl">
              <Sparkles className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
            Asset Forge
          </h1>
          <p className="text-2xl md:text-3xl text-text-secondary font-light">
            AI-Powered 3D Asset Generation
          </p>

          {/* Alpha Soon badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/30 rounded-full backdrop-blur-sm mt-6">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-primary font-medium">Alpha Coming Soon</span>
          </div>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mb-16">
          {[
            { title: 'AI Generation', desc: 'Text to 3D models' },
            { title: 'Smart Rigging', desc: 'Auto-fit armor & weapons' },
            { title: 'Batch Export', desc: 'Game-ready assets' }
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-bg-secondary/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-colors"
            >
              <h3 className="text-text-primary font-semibold mb-2">{feature.title}</h3>
              <p className="text-text-tertiary text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer login */}
      <footer className="relative z-10 pb-8 px-4">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="bg-bg-secondary/80 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Admin Access</h3>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary/50 transition-colors"
                  disabled={isLoading}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400 animate-shake">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full px-4 py-3 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter Forge</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-text-tertiary text-sm mt-4">
            Early access for administrators only
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  )
}
