'use client'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { useState, useEffect, Suspense } from 'react'
import { Swords, ArrowRight, Star, Download, Trophy, BookOpen, Mic } from 'lucide-react'

function DuelContent() {
  const { code } = useParams()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [showInstall, setShowInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  const duelCode = code as string
  const surahId = searchParams.get('s') || '?'
  const challenger = searchParams.get('by') || 'Un ami'

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(ua))
    setIsAndroid(/android/.test(ua))
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (!isStandalone) setShowInstall(true)
  }, [])

  const goToChallenge = () => {
    if (isAuthenticated) {
      router.push(`/quran/${surahId}`)
    } else {
      localStorage.setItem('mtj-pending-duel', JSON.stringify({ code: duelCode, surah: surahId, challenger }))
      router.push('/auth')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-15 pointer-events-none"
        style={{ background:'radial-gradient(ellipse, rgba(201,168,76,0.25), transparent 70%)' }} />

      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-6 anim-fade-up">
          <div className="w-20 h-20 mx-auto mb-4 anim-float">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(201,168,76,0.2)]">
              <defs><linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2c76a"/><stop offset="100%" stopColor="#a6862f"/>
              </linearGradient></defs>
              <circle cx="50" cy="50" r="42" fill="url(#dg)" opacity="0.95"/>
              <circle cx="64" cy="40" r="34" fill="#080d1a"/>
            </svg>
          </div>
          <h1 className="heading text-3xl font-bold text-white">Mon Tajwid</h1>
        </div>

        <div className="glass p-6 mb-5 anim-fade-up delay-1">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#34d399]/10 flex items-center justify-center text-[#34d399] font-bold heading text-lg">
              {challenger[0]?.toUpperCase()}
            </div>
            <Swords className="w-6 h-6 text-[#c9a84c]" />
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 font-bold heading text-lg">?</div>
          </div>

          <h2 className="heading text-xl font-bold text-white text-center mb-2">{challenger} te défie !</h2>
          <p className="text-white/30 text-sm text-center mb-5">Qui récite le mieux la sourate {surahId} ?</p>

          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3">
              <BookOpen className="w-4 h-4 text-[#34d399] shrink-0" /><span className="text-white/50 text-sm flex-1">Sourate {surahId}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3">
              <Mic className="w-4 h-4 text-[#c9a84c] shrink-0" /><span className="text-white/50 text-sm flex-1">Récite et obtiens un score IA</span>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3">
              <Trophy className="w-4 h-4 text-orange-400 shrink-0" /><span className="text-white/50 text-sm flex-1">Le meilleur Tajwid gagne</span>
            </div>
          </div>

          <div className="text-center text-white/10 text-[10px] font-mono mb-4">Code : {duelCode}</div>

          <button onClick={goToChallenge} className="btn-gold w-full text-[15px]">
            {isAuthenticated
              ? <><Trophy className="w-4 h-4" />Relever le défi<ArrowRight className="w-4 h-4" /></>
              : <><Star className="w-4 h-4" />Créer un compte et jouer<ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        {showInstall && (
          <div className="glass p-5 anim-fade-up delay-2">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-5 h-5 text-[#c9a84c]" />
              <h3 className="text-white/60 text-sm font-semibold">Installe l&apos;app en 2 secondes</h3>
            </div>
            {isIOS ? (
              <div className="space-y-2.5">
                {[
                  ['1','Appuie sur le bouton Partager (carré avec flèche) en bas de Safari'],
                  ['2','Descends et appuie sur "Sur l\'écran d\'accueil"'],
                  ['3','Appuie "Ajouter" — l\'app sera sur ton écran']
                ].map(([n,t])=>(
                  <div key={n} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#34d399]/8 flex items-center justify-center text-[10px] text-[#34d399] font-bold shrink-0">{n}</div>
                    <p className="text-white/35 text-sm">{t}</p>
                  </div>
                ))}
              </div>
            ) : isAndroid ? (
              <div className="space-y-2.5">
                {[
                  ['1','Appuie sur les 3 points en haut à droite de Chrome'],
                  ['2','Appuie sur "Ajouter à l\'écran d\'accueil"'],
                ].map(([n,t])=>(
                  <div key={n} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#34d399]/8 flex items-center justify-center text-[10px] text-[#34d399] font-bold shrink-0">{n}</div>
                    <p className="text-white/35 text-sm">{t}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/30 text-sm">Ajoute cette page en favoris pour un accès rapide.</p>
            )}
          </div>
        )}

        <div className="text-center mt-6 anim-fade-up delay-3">
          <p className="arabic text-[#c9a84c]/30 text-sm">وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ ٱلْمُتَنَافِسُونَ</p>
          <p className="text-white/10 text-[10px] mt-1">Al-Mutaffifin 83:26</p>
        </div>
      </div>
    </div>
  )
}

export default function DuelPage() {
  return <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" /></div>}>
    <DuelContent />
  </Suspense>
}
