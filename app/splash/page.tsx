'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function SplashPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 1200)
    const t3 = setTimeout(() => setPhase(3), 2200)
    const t4 = setTimeout(() => {
      router.replace(isAuthenticated ? '/' : '/auth')
    }, 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [router, isAuthenticated])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Crescent */}
      <div className={`transition-all duration-1000 ease-out ${phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <div className="w-24 h-24 relative animate-float">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs><linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4A843" /><stop offset="100%" stopColor="#B8860B" />
            </linearGradient></defs>
            <circle cx="50" cy="50" r="40" fill="url(#moonGrad)" opacity="0.9" />
            <circle cx="62" cy="42" r="32" fill="#0f172a" />
            <circle cx="70" cy="28" r="3" fill="#D4A843" opacity="0.6" />
            <circle cx="82" cy="40" r="2" fill="#D4A843" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div className={`mt-8 text-center transition-all duration-700 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="font-heading text-4xl font-bold text-white mb-2">Mon Tajwid</h1>
        <p className="arabic-text text-amber-200/60 text-xl">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
      </div>

      {/* Ramadan message */}
      <div className={`mt-8 text-center transition-all duration-700 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-400/20">
          <span className="text-amber-300 text-sm font-medium">Profite du Ramadan pour apprendre le Coran</span>
        </div>
      </div>

      {/* Loading dots */}
      <div className={`mt-12 flex gap-1.5 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        {[0,1,2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{ animation: 'pulseGlow 1.2s ease-in-out infinite', animationDelay: `${i*0.2}s` }} />
        ))}
      </div>
    </div>
  )
}
