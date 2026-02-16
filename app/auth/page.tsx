'use client'

import { useState } from 'react'
import { supabase } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, User, BookOpen } from 'lucide-react'

type AuthMode = 'login' | 'signup'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: displayName },
          },
        })
        if (signUpError) throw signUpError
        router.push('/')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-sacred-500/20 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-sacred-400" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Mon Tajwid</h1>
          <p className="text-sacred-400 font-arabic text-sm mt-1">بسم الله الرحمن الرحيم</p>
        </div>

        {/* Form */}
        <div className="card-sacred p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-night-300 text-sm mb-1 block">Nom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-night-900/50 border border-night-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-night-500 focus:border-sacred-500 focus:outline-none transition"
                    placeholder="Ton prénom"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-night-300 text-sm mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-night-900/50 border border-night-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-night-500 focus:border-sacred-500 focus:outline-none transition"
                  placeholder="ton@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-night-300 text-sm mb-1 block">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-night-900/50 border border-night-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-night-500 focus:border-sacred-500 focus:outline-none transition"
                  placeholder="Min. 6 caractères"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-night-700" />
            <span className="text-night-500 text-xs">ou</span>
            <div className="flex-1 h-px bg-night-700" />
          </div>

          {/* Google login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-night-800 hover:bg-night-700 text-white py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuer avec Google
          </button>

          {/* Switch mode */}
          <p className="text-center text-night-400 text-sm mt-5">
            {mode === 'login' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError(null)
              }}
              className="text-sacred-400 hover:text-sacred-300 font-semibold"
            >
              {mode === 'login' ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
