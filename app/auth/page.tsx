'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/supabase/client'
import { Loader2, User, Lock, Eye, EyeOff } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const email = `${username.toLowerCase().trim()}@montajwid.app`

    try {
      if (mode === 'signup') {
        if (username.length < 3) throw new Error('Minimum 3 caractères pour le pseudo')
        if (password.length < 6) throw new Error('Minimum 6 caractères pour le mot de passe')
        const { data, error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { username: username.trim(), display_name: displayName || username } }
        })
        if (err) throw err
        const isAdmin = username.toLowerCase() === 'mehdi4124'
        login(data.user?.id || '', username, displayName || username, isAdmin)
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw new Error('Pseudo ou mot de passe incorrect')
        const isAdmin = username.toLowerCase() === 'mehdi4124'
        login(data.user?.id || '', username, username, isAdmin)
      }
      router.replace('/')
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/8 rounded-full blur-[100px]" />

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <svg viewBox="0 0 100 100" className="w-9 h-9">
              <defs><linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4A843" /><stop offset="100%" stopColor="#B8860B" />
              </linearGradient></defs>
              <circle cx="50" cy="50" r="35" fill="url(#mg)" opacity="0.9" />
              <circle cx="60" cy="42" r="28" fill="#0f172a" />
            </svg>
          </div>
          <h1 className="font-heading text-3xl font-bold text-white">Mon Tajwid</h1>
          <p className="text-white/30 text-sm mt-1">{mode === 'login' ? 'Content de te revoir' : 'Rejoins la communauté'}</p>
        </div>

        {/* Form */}
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-white/40 text-xs font-medium mb-1.5 block uppercase tracking-wider">Prénom</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                  className="input-field" placeholder="Ton prénom" />
              </div>
            )}
            <div>
              <label className="text-white/40 text-xs font-medium mb-1.5 block uppercase tracking-wider">Pseudo</label>
              <div className="relative">
                <User className="input-icon" />
                <input value={username} onChange={e => setUsername(e.target.value)}
                  className="input-field pl-10" placeholder="Choisis un pseudo" required autoComplete="username" />
              </div>
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium mb-1.5 block uppercase tracking-wider">Mot de passe</label>
              <div className="relative">
                <Lock className="input-icon" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10" placeholder="Min. 6 caractères" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>

          <p className="text-center text-white/30 text-sm mt-5">
            {mode === 'login' ? 'Pas encore inscrit ?' : 'Déjà un compte ?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold">{mode === 'login' ? "S'inscrire" : 'Se connecter'}</button>
          </p>
        </div>
      </div>
    </div>
  )
}
