'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/supabase/client'
import { Loader2, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

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
    e.preventDefault(); setLoading(true); setError('')
    const cleanUser = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!cleanUser || cleanUser.length < 3) { setError('Pseudo : min. 3 caractères (lettres, chiffres, _)'); setLoading(false); return }
    if (password.length < 6) { setError('Mot de passe : min. 6 caractères'); setLoading(false); return }

    // Use a proper fake email that Supabase will accept
    const email = `${cleanUser}@user.montajwid.app`

    try {
      if (mode === 'signup') {
        // Step 1: Create auth user
        const { data, error: signupErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: cleanUser, display_name: displayName || cleanUser },
            emailRedirectTo: undefined,
          }
        })

        if (signupErr) {
          // Handle specific errors
          if (signupErr.message.includes('already registered') || signupErr.message.includes('already been registered')) {
            throw new Error('Ce pseudo est déjà pris. Essaie un autre.')
          }
          if (signupErr.message.includes('Database error')) {
            // The user was created in auth.users but the trigger failed
            // Try to sign in instead — the auth user exists
            const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
            if (loginErr) throw new Error('Erreur lors de l\'inscription. Réessaie.')

            // Manually create profile since trigger failed
            await createProfileIfMissing(loginData.user!.id, cleanUser, displayName || cleanUser, email)

            const isAdmin = cleanUser === 'mehdi4124'
            login(loginData.user!.id, cleanUser, displayName || cleanUser, isAdmin)
            router.replace('/')
            return
          }
          throw signupErr
        }

        if (!data.user) throw new Error('Erreur inattendue')

        // Step 2: Manually ensure profile exists (don't rely on trigger)
        await createProfileIfMissing(data.user.id, cleanUser, displayName || cleanUser, email)

        const isAdmin = cleanUser === 'mehdi4124'
        login(data.user.id, cleanUser, displayName || cleanUser, isAdmin)

      } else {
        // LOGIN
        const { data, error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
        if (loginErr) throw new Error('Pseudo ou mot de passe incorrect')

        const meta = data.user?.user_metadata
        const isAdmin = cleanUser === 'mehdi4124'
        login(data.user!.id, meta?.username || cleanUser, meta?.display_name || cleanUser, isAdmin)
      }

      router.replace('/')
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-20 pointer-events-none"
        style={{ background:'radial-gradient(ellipse, rgba(201,168,76,0.2), transparent 70%)' }} />

      <div className="w-full max-w-[380px] relative z-10">
        <div className="text-center mb-10 anim-fade-up">
          <div className="w-20 h-20 mx-auto mb-5 anim-float">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(201,168,76,0.2)]">
              <defs><linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2c76a"/><stop offset="100%" stopColor="#a6862f"/>
              </linearGradient></defs>
              <circle cx="50" cy="50" r="42" fill="url(#ag)" opacity="0.95"/>
              <circle cx="64" cy="40" r="34" fill="#080d1a"/>
            </svg>
          </div>
          <h1 className="heading text-3xl font-bold text-white">Mon Tajwid</h1>
          <p className="text-white/30 text-sm mt-2">{mode==='login'?'Bon retour parmi nous':'Rejoins la communauté'}</p>
        </div>

        <div className="glass p-7 anim-fade-up delay-1">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode==='signup' && (
              <div>
                <label className="text-white/35 text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block">Prénom</label>
                <input value={displayName} onChange={e=>setDisplayName(e.target.value)} className="input" placeholder="Ton prénom" />
              </div>
            )}
            <div>
              <label className="text-white/35 text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block">Pseudo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/15" />
                <input value={username} onChange={e=>setUsername(e.target.value)} className="input input-with-icon" placeholder="ex: ahmed_92" required autoComplete="username" />
              </div>
            </div>
            <div>
              <label className="text-white/35 text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/15" />
                <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                  className="input input-with-icon pr-12" placeholder="Min. 6 caractères" required minLength={6} />
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/30 transition">
                  {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {error && <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">{error}</p></div>}

            <button type="submit" disabled={loading} className="btn-primary w-full text-[15px]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{mode==='login'?'Se connecter':"S'inscrire"}<ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-white/25 text-sm mt-6">
            {mode==='login'?'Pas de compte ?':'Déjà inscrit ?'}{' '}
            <button onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}}
              className="text-[#c9a84c] hover:text-[#e2c76a] font-semibold transition">{mode==='login'?"S'inscrire":'Se connecter'}</button>
          </p>
        </div>
      </div>
    </div>
  )
}

/** Create profile row manually — called after signup as fallback */
async function createProfileIfMissing(userId: string, username: string, displayName: string, email: string) {
  try {
    // Check if profile already exists (trigger might have created it)
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).single()
    if (existing) return // Already exists, trigger worked

    // Insert manually
    await supabase.from('profiles').insert({
      id: userId,
      email,
      username,
      display_name: displayName,
      is_admin: username === 'mehdi4124',
    })
  } catch {
    // Non-critical: profile creation might fail due to RLS, but login still works
    // The local store handles all the app state
    console.warn('Profile creation skipped — using local store only')
  }
}
