'use client'

import { useProgressStore } from '@/lib/store'
import { JUZ_SURAH_MAP } from '@/services/quran-api'
import Link from 'next/link'
import { Trophy, Star, Lock, Mic, BookOpen, User, Settings } from 'lucide-react'

export default function HomePage() {
  const { juzProgress, getTotalStars, getTotalTrophies } = useProgressStore()
  const totalStars = getTotalStars()
  const totalTrophies = getTotalTrophies()

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="font-heading text-3xl font-bold text-white mb-1">Mon Tajwid</h1>
        <p className="text-sacred-400 font-arabic text-lg">بسم الله الرحمن الرحيم</p>

        {/* Stats */}
        <div className="flex justify-center gap-6 mt-5">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-gold-400 fill-gold-400" />
            <span className="text-white font-semibold">{totalStars}</span>
            <span className="text-night-400 text-sm">sourates</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold-400 fill-gold-400" />
            <span className="text-white font-semibold">{totalTrophies}</span>
            <span className="text-night-400 text-sm">juz</span>
          </div>
        </div>
      </header>

      <div className="divider-geometric" />

      {/* Juz Grid */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((juzId) => {
          const progress = juzProgress[juzId]
          const isUnlocked = progress?.unlocked || juzId === 1
          const isCompleted = progress?.completed || false
          const hasTrophy = progress?.trophy || false
          const surahCount = JUZ_SURAH_MAP[juzId]?.length || 0

          const stateClass = isCompleted
            ? 'juz-completed'
            : isUnlocked
            ? 'juz-active'
            : 'juz-locked'

          const card = (
            <div className={`card-sacred p-4 text-center transition-all duration-300 hover:scale-[1.03] ${stateClass}`}>
              <div className="relative">
                {hasTrophy && (
                  <Trophy className="w-4 h-4 text-gold-400 fill-gold-400 absolute -top-1 -right-1 animate-star-pop" />
                )}
                <div className="w-12 h-12 mx-auto rounded-full bg-night-700/50 flex items-center justify-center mb-2">
                  {!isUnlocked ? (
                    <Lock className="w-5 h-5 text-night-500" />
                  ) : (
                    <span className="font-heading text-lg font-bold text-sacred-400">{juzId}</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-night-400 mt-1">Juz {juzId}</p>
              <p className="text-[10px] text-night-500">
                {surahCount} sourate{surahCount > 1 ? 's' : ''}
              </p>
              {isCompleted && (
                <div className="mt-2">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '100%' }} />
                  </div>
                </div>
              )}
            </div>
          )

          if (!isUnlocked) return <div key={juzId}>{card}</div>
          return (
            <Link key={juzId} href={`/quran/${juzId}`}>
              {card}
            </Link>
          )
        })}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-night-900/95 backdrop-blur-lg border-t border-night-700/50 px-4 py-3 z-50">
        <div className="max-w-lg mx-auto flex justify-around">
          <NavItem icon={<BookOpen className="w-5 h-5" />} label="Coran" active />
          <NavItem icon={<Mic className="w-5 h-5" />} label="Réciter" />
          <NavItem icon={<Trophy className="w-5 h-5" />} label="Progrès" />
          <NavItem icon={<Settings className="w-5 h-5" />} label="Réglages" />
        </div>
      </nav>
    </div>
  )
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center gap-1 ${active ? 'text-sacred-400' : 'text-night-500'}`}>
      {icon}
      <span className="text-[10px]">{label}</span>
    </button>
  )
}
