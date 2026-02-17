'use client'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { useState, useEffect } from 'react'
import { Swords, ArrowRight, Star, Download, Trophy } from 'lucide-react'

export default function DuelPage() {
  const { code } = useParams()
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    // Detect if standalone (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (!isStandalone) setShowInstall(true)
  }, [])

  // Extract surah from code (future: fetch from DB)
  const duelCode = code as string

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-15 pointer-events-none"
        style={{ background:'radial-gradient(ellipse, rgba(201,168,76,0.25), transparent 70%)' }} />

      <div className="w-full max-w-[400px] text-center relative z-10">
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-6 anim-float">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(201,168,76,0.2)]">
            <defs><linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2c76a"/><stop offset="100%" stopColor="#a6862f"/>
            </linearGradient></defs>
            <circle cx="50" cy="50" r="42" fill="url(#dg)" opacity="0.95"/>
            <circle cx="64" cy="40" r="34" fill="#080d1a"/>
          </svg>
        </div>

        <h1 className="heading text-3xl font-bold text-white mb-2">Duel Tajwid</h1>
        <p className="text-white/30 text-sm mb-6">Tu as été défié !</p>

        {/* Duel card */}
        <div className="glass p-6 mb-5 anim-fade-up">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center mb-4">
            <Swords className="w-7 h-7 text-[#c9a84c]" />
          </div>
          <p className="text-white/50 text-sm mb-1">Code du duel</p>
          <p className="text-[#c9a84c] font-mono text-xl font-bold mb-4">{duelCode}</p>
          <p className="text-white/25 text-xs leading-relaxed">
            Un ami te défie à réciter une sourate du Coran. Qui aura le meilleur score de Tajwid ?
          </p>
        </div>

        {/* CTA */}
        {isAuthenticated ? (
          <button onClick={() => router.push('/')} className="btn-primary w-full text-[15px] mb-3">
            <Trophy className="w-4 h-4" />Accepter le défi<ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => router.push('/auth')} className="btn-gold w-full text-[15px] mb-3">
            <Star className="w-4 h-4" />Créer un compte pour jouer<ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Install prompt */}
        {showInstall && (
          <div className="glass-gold p-4 mt-4 anim-fade-up delay-2">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-[#c9a84c] shrink-0" />
              <div className="text-left">
                <p className="text-[#c9a84c] text-sm font-medium">Installe Mon Tajwid</p>
                <p className="text-[#c9a84c]/50 text-xs">Ajoute l&apos;app sur ton écran d&apos;accueil</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
