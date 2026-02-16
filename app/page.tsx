'use client'

import { useState, useEffect } from 'react'
import { useProgressStore, useQuranStore, useUserStore } from '@/lib/store'
import { JUZ_SURAH_MAP, RECITERS, fetchSurahs, type Surah } from '@/services/quran-api'
import { getAvailableRules } from '@/features/tajwid-engine'
import Link from 'next/link'
import {
  Trophy, Star, Lock, Mic, BookOpen, Settings, ChevronRight, Flame,
  Play, Check, Volume2, BarChart3, Target, Calendar, Moon,
} from 'lucide-react'

const DAILY_REMINDERS = [
  { ar: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا', fr: 'Certes, avec la difficulté, il y a une facilité.', ref: 'Al-Inshirah, 94:6' },
  { ar: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ', fr: 'Et quiconque place sa confiance en Allah, Il lui suffit.', ref: 'At-Talaq, 65:3' },
  { ar: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ', fr: 'Souvenez-vous de Moi, Je Me souviendrai de vous.', ref: 'Al-Baqara, 2:152' },
  { ar: 'رَبِّ ٱشْرَحْ لِى صَدْرِى', fr: 'Seigneur, ouvre-moi ma poitrine.', ref: 'Ta-Ha, 20:25' },
  { ar: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰٓ', fr: 'Ton Seigneur t\'accordera certes [Ses faveurs], et alors tu seras satisfait.', ref: 'Ad-Duha, 93:5' },
]

export default function HomePage() {
  const { juzProgress, surahProgress, streak, getTotalStars, getTotalTrophies } = useProgressStore()
  const { activeTab, setActiveTab } = useQuranStore()
  const { preferredReciter, setReciter, activeTajwidRules, setTajwidRules } = useUserStore()
  const totalStars = getTotalStars()
  const totalTrophies = getTotalTrophies()
  const [showReminder, setShowReminder] = useState(true)
  const dailyReminder = DAILY_REMINDERS[new Date().getDate() % DAILY_REMINDERS.length]

  return (
    <div className="min-h-screen relative">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {activeTab === 'quran' && (
          <QuranTab
            juzProgress={juzProgress}
            surahProgress={surahProgress}
            totalStars={totalStars}
            totalTrophies={totalTrophies}
            streak={streak}
            showReminder={showReminder}
            setShowReminder={setShowReminder}
            dailyReminder={dailyReminder}
          />
        )}
        {activeTab === 'recite' && <ReciteTab />}
        {activeTab === 'progress' && (
          <ProgressTab totalStars={totalStars} totalTrophies={totalTrophies} streak={streak} surahProgress={surahProgress} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            preferredReciter={preferredReciter}
            setReciter={setReciter}
            activeTajwidRules={activeTajwidRules}
            setTajwidRules={setTajwidRules}
          />
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/92 backdrop-blur-xl border-t border-white/5 z-50">
        <div className="max-w-lg mx-auto flex justify-around py-3 px-4">
          {([
            { key: 'quran' as const, icon: BookOpen, label: 'Coran' },
            { key: 'recite' as const, icon: Mic, label: 'Réciter' },
            { key: 'progress' as const, icon: BarChart3, label: 'Progrès' },
            { key: 'settings' as const, icon: Settings, label: 'Réglages' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === key ? 'text-emerald-400' : 'text-white/25'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {activeTab === key && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

/* ===================== QURAN TAB ===================== */
function QuranTab({ juzProgress, surahProgress, totalStars, totalTrophies, streak, showReminder, setShowReminder, dailyReminder }: any) {
  return (
    <>
      {/* Header */}
      <header className="pt-2 pb-2">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-amber-200/50 text-xs tracking-widest uppercase mb-1">Assalamu alaykum</p>
            <h1 className="font-heading text-2xl font-bold text-white">Mon Tajwid</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-400/20 rounded-full px-3 py-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300 text-sm font-bold">{streak}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-5">
          {[
            { icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />, value: totalStars, label: 'Sourates' },
            { icon: <Trophy className="w-4 h-4 text-amber-400" />, value: totalTrophies, label: 'Juz' },
            { icon: <Flame className="w-4 h-4 text-orange-400" />, value: `${streak}j`, label: 'Série' },
          ].map((s, i) => (
            <div key={i} className="flex-1 card-v2 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">{s.icon}<span className="text-white font-bold text-lg">{s.value}</span></div>
              <p className="text-white/30 text-[10px] uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Daily reminder */}
      {showReminder && (
        <div className="relative mb-5 overflow-hidden rounded-2xl bg-emerald-900/20 border border-emerald-500/10">
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-emerald-300/50 text-[10px] uppercase tracking-[0.2em]">Rappel du jour</span>
              <button onClick={() => setShowReminder(false)} className="text-white/20 hover:text-white/40">&times;</button>
            </div>
            <p className="font-arabic text-amber-200 text-xl leading-[2] text-right mb-3" dir="rtl">{dailyReminder.ar}</p>
            <p className="text-emerald-100/70 text-sm italic mb-1">{dailyReminder.fr}</p>
            <p className="text-emerald-300/30 text-xs">{dailyReminder.ref}</p>
          </div>
        </div>
      )}

      {/* Juz Grid */}
      <h2 className="font-heading text-lg font-semibold text-white/90 mb-3">Les 30 Juz</h2>
      <div className="grid grid-cols-5 gap-2 mb-6">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((juzId) => {
          const p = juzProgress[juzId]
          const completed = p?.completed || false
          return (
            <Link key={juzId} href={`/quran/${juzId}`}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all hover:scale-105 ${
                completed ? 'bg-amber-500/10 border border-amber-400/20' : 'card-v2 hover:border-emerald-500/20'
              }`}>
              {completed && <Trophy className="w-3 h-3 text-amber-400 mb-0.5" />}
              <span className="text-sm font-bold text-emerald-400">{juzId}</span>
              <span className="text-[8px] text-white/20">Juz</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}

/* ===================== RECITE TAB ===================== */
function ReciteTab() {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSurahs().then((data) => { setSurahs(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const shortSurahs = surahs.filter(s => s.verses_count <= 20).slice(-20)

  return (
    <div>
      <header className="pt-2 mb-5">
        <h1 className="font-heading text-2xl font-bold text-white mb-1">Réciter</h1>
        <p className="text-white/40 text-sm">Choisis une sourate et récite-la pour valider</p>
      </header>

      <div className="mb-4 card-v2 p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Mic className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Récitation libre</h3>
            <p className="text-white/30 text-xs">Récite n&apos;importe quelle sourate</p>
          </div>
        </div>
      </div>

      <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wider">Sourates courtes</h3>
      {loading ? (
        <p className="text-white/30 text-center py-8">Chargement...</p>
      ) : (
        <div className="space-y-2">
          {shortSurahs.map((s) => (
            <Link key={s.id} href={`/quran/${Math.ceil(s.id / 4)|| 30}/${s.id}`}
              className="card-v2 p-3 flex items-center gap-3 hover:bg-white/[0.04] transition">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-400">{s.id}</div>
              <div className="flex-1">
                <span className="text-white text-sm font-medium">{s.name_simple}</span>
                <p className="text-white/30 text-xs">{s.verses_count} versets</p>
              </div>
              <span className="font-arabic text-amber-200/20 text-base">{s.name_arabic}</span>
              <Mic className="w-4 h-4 text-white/15" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/* ===================== PROGRESS TAB ===================== */
function ProgressTab({ totalStars, totalTrophies, streak, surahProgress }: any) {
  const validated = Object.entries(surahProgress).filter(([_, v]: any) => v.validated)
  return (
    <div>
      <header className="pt-2 mb-5">
        <h1 className="font-heading text-2xl font-bold text-white mb-1">Progrès</h1>
        <p className="text-white/40 text-sm">Ton avancement dans le Coran</p>
      </header>

      {/* Big stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card-v2 p-4 text-center">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalStars}</p>
          <p className="text-white/30 text-xs">Sourates validées</p>
        </div>
        <div className="card-v2 p-4 text-center">
          <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalTrophies}</p>
          <p className="text-white/30 text-xs">Juz complétés</p>
        </div>
        <div className="card-v2 p-4 text-center">
          <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{streak}</p>
          <p className="text-white/30 text-xs">Jours de suite</p>
        </div>
      </div>

      {/* Global progress */}
      <div className="card-v2 p-4 mb-5">
        <div className="flex justify-between mb-2">
          <span className="text-white/60 text-sm">Progression globale</span>
          <span className="text-emerald-400 text-sm font-semibold">{totalStars}/114</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
            style={{ width: `${(totalStars / 114) * 100}%` }} />
        </div>
      </div>

      {/* Recent validations */}
      <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wider">Récemment validées</h3>
      {validated.length === 0 ? (
        <div className="card-v2 p-6 text-center">
          <Target className="w-8 h-8 text-white/15 mx-auto mb-2" />
          <p className="text-white/30 text-sm">Aucune sourate validée pour le moment</p>
          <p className="text-white/20 text-xs mt-1">Commence par Al-Fatiha !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {validated.slice(-5).map(([id, data]: any) => (
            <div key={id} className="card-v2 p-3 flex items-center gap-3">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-white text-sm">Sourate {id}</span>
              <span className="ml-auto text-emerald-400 text-sm font-semibold">{data.bestScore}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ===================== SETTINGS TAB ===================== */
function SettingsTab({ preferredReciter, setReciter, activeTajwidRules, setTajwidRules }: any) {
  const allRules = getAvailableRules()

  const toggleRule = (ruleId: string) => {
    if (activeTajwidRules.includes(ruleId)) {
      setTajwidRules(activeTajwidRules.filter((r: string) => r !== ruleId))
    } else {
      setTajwidRules([...activeTajwidRules, ruleId])
    }
  }

  return (
    <div>
      <header className="pt-2 mb-5">
        <h1 className="font-heading text-2xl font-bold text-white mb-1">Réglages</h1>
        <p className="text-white/40 text-sm">Personnalise ton expérience</p>
      </header>

      {/* Reciter selection */}
      <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wider">Récitateur</h3>
      <div className="space-y-2 mb-6">
        {RECITERS.map((r) => (
          <button
            key={r.id}
            onClick={() => setReciter(r.id)}
            className={`w-full card-v2 p-4 flex items-center gap-3 text-left transition-all ${
              preferredReciter === r.id ? 'card-v2-active' : 'hover:bg-white/[0.04]'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              preferredReciter === r.id ? 'bg-emerald-500/20' : 'bg-white/5'
            }`}>
              <Volume2 className={`w-5 h-5 ${preferredReciter === r.id ? 'text-emerald-400' : 'text-white/20'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">{r.name}</span>
                {preferredReciter === r.id && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-white/30 text-xs">{r.style}</p>
            </div>
            <span className="font-arabic text-amber-200/20 text-sm">{r.name_ar}</span>
          </button>
        ))}
      </div>

      {/* Tajwid rules */}
      <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wider">Règles de Tajwid actives</h3>
      <p className="text-white/25 text-xs mb-3">Active les règles que tu veux maîtriser pendant la récitation</p>
      <div className="space-y-2">
        {allRules.map((rule) => {
          const active = activeTajwidRules.includes(rule.id)
          return (
            <button
              key={rule.id}
              onClick={() => toggleRule(rule.id)}
              className={`w-full card-v2 p-3 flex items-center gap-3 text-left transition-all ${
                active ? 'border-emerald-500/20 bg-emerald-500/[0.05]' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/20'
              }`}>
                {active ? <Check className="w-4 h-4" /> : '○'}
              </div>
              <div className="flex-1">
                <span className="text-white text-sm">{rule.name}</span>
                <p className="text-white/25 text-xs">{rule.description}</p>
              </div>
              <span className="font-arabic text-amber-200/20 text-xs">{rule.name_ar}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
