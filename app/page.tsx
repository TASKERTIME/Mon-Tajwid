'use client'

import { useState, useEffect } from 'react'
import { useProgressStore, useQuranStore, useUserStore } from '@/lib/store'
import { RECITERS, fetchSurahs, type Surah } from '@/services/quran-api'
import { getAvailableRules } from '@/features/tajwid-engine'
import Link from 'next/link'
import {
  Star, Mic, BookOpen, Settings, ChevronRight, Flame, Check, Volume2,
  BarChart3, Target, Moon, Loader2, Search, X,
} from 'lucide-react'

const DAILY_REMINDERS = [
  { ar: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا', fr: 'Certes, avec la difficulté, il y a une facilité.', ref: 'Al-Inshirah, 94:6' },
  { ar: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ', fr: 'Et quiconque place sa confiance en Allah, Il lui suffit.', ref: 'At-Talaq, 65:3' },
  { ar: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ', fr: 'Souvenez-vous de Moi, Je Me souviendrai de vous.', ref: 'Al-Baqara, 2:152' },
  { ar: 'رَبِّ ٱشْرَحْ لِى صَدْرِى', fr: 'Seigneur, ouvre-moi ma poitrine.', ref: 'Ta-Ha, 20:25' },
  { ar: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰٓ', fr: 'Ton Seigneur t\'accordera certes [Ses faveurs], et alors tu seras satisfait.', ref: 'Ad-Duha, 93:5' },
  { ar: 'وَٱصْبِرْ فَإِنَّ ٱللَّهَ لَا يُضِيعُ أَجْرَ ٱلْمُحْسِنِينَ', fr: 'Et sois patient, car Allah ne laisse pas perdre la récompense des bienfaisants.', ref: 'Hud, 11:115' },
]

const ADHKAR = [
  { title: 'Après la prière', items: [
    { ar: 'أَسْتَغْفِرُ ٱللَّهَ', fr: 'Je demande pardon à Allah', count: '3x' },
    { ar: 'سُبْحَانَ ٱللَّهِ', fr: 'Gloire à Allah', count: '33x' },
    { ar: 'ٱلْحَمْدُ لِلَّهِ', fr: 'Louange à Allah', count: '33x' },
    { ar: 'ٱللَّهُ أَكْبَرُ', fr: 'Allah est le Plus Grand', count: '33x' },
  ]},
  { title: 'Matin et soir', items: [
    { ar: 'بِسْمِ ٱللَّهِ ٱلَّذِي لَا يَضُرُّ مَعَ ٱسْمِهِ شَيْءٌ فِي ٱلْأَرْضِ وَلَا فِي ٱلسَّمَاءِ وَهُوَ ٱلسَّمِيعُ ٱلْعَلِيمُ', fr: 'Au nom d\'Allah, celui dont le nom protège de tout mal sur terre et dans les cieux, et Il est l\'Audient, l\'Omniscient.', count: '3x' },
    { ar: 'أَعُوذُ بِكَلِمَاتِ ٱللَّهِ ٱلتَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', fr: 'Je cherche protection par les paroles parfaites d\'Allah contre le mal de ce qu\'Il a créé.', count: '3x' },
  ]},
]

export default function HomePage() {
  const { activeTab, setActiveTab } = useQuranStore()
  const { preferredReciter, setReciter, activeTajwidRules, setTajwidRules } = useUserStore()
  const { surahProgress, streak, getTotalStars } = useProgressStore()
  const totalStars = getTotalStars()

  return (
    <div className="min-h-screen relative">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {activeTab === 'quran' && <QuranTab surahProgress={surahProgress} totalStars={totalStars} streak={streak} />}
        {activeTab === 'rappels' && <RappelsTab />}
        {activeTab === 'progress' && <ProgressTab totalStars={totalStars} streak={streak} surahProgress={surahProgress} />}
        {activeTab === 'settings' && <SettingsTab preferredReciter={preferredReciter} setReciter={setReciter} activeTajwidRules={activeTajwidRules} setTajwidRules={setTajwidRules} />}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/5 z-50">
        <div className="max-w-lg mx-auto flex justify-around py-3 px-4">
          {([
            { key: 'quran' as const, icon: BookOpen, label: 'Coran' },
            { key: 'rappels' as const, icon: Moon, label: 'Rappels' },
            { key: 'progress' as const, icon: BarChart3, label: 'Progrès' },
            { key: 'settings' as const, icon: Settings, label: 'Réglages' },
          ]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === key ? 'text-emerald-400' : 'text-white/25'}`}>
              <Icon className="w-5 h-5" /><span className="text-[10px] font-medium">{label}</span>
              {activeTab === key && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

/* ===================== QURAN TAB — 114 SOURATES ===================== */
function QuranTab({ surahProgress, totalStars, streak }: any) {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const reminder = DAILY_REMINDERS[new Date().getDate() % DAILY_REMINDERS.length]

  useEffect(() => { fetchSurahs().then(setSurahs).catch(console.error).finally(() => setLoading(false)) }, [])

  const filtered = search
    ? surahs.filter(s => s.name_simple.toLowerCase().includes(search.toLowerCase()) || s.name_arabic.includes(search) || s.id.toString() === search)
    : surahs

  return (
    <>
      <header className="pt-2 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-amber-200/50 text-xs tracking-widest uppercase mb-1">Assalamu alaykum</p>
            <h1 className="font-heading text-2xl font-bold text-white">Mon Tajwid</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-400/20 rounded-full px-3 py-1.5">
              <Flame className="w-4 h-4 text-orange-400" /><span className="text-orange-300 text-sm font-bold">{streak}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/20 rounded-full px-3 py-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /><span className="text-amber-300 text-sm font-bold">{totalStars}/114</span>
            </div>
          </div>
        </div>
        {/* Daily reminder mini */}
        <div className="rounded-xl bg-emerald-900/20 border border-emerald-500/10 p-3 mb-4">
          <p className="font-arabic text-amber-200/80 text-base text-right leading-[1.8]" dir="rtl">{reminder.ar}</p>
          <p className="text-emerald-100/50 text-xs italic mt-1">{reminder.fr} — {reminder.ref}</p>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une sourate..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/30" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-white/20" /></button>}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((s) => {
            const p = surahProgress[s.id]
            const isValidated = p?.validated || false
            return (
              <Link key={s.id} href={`/quran/${s.id}`}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.99] ${
                  isValidated
                    ? 'bg-gradient-to-r from-amber-500/[0.08] to-amber-600/[0.04] border border-amber-400/15'
                    : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]'
                }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  isValidated ? 'bg-amber-500/15 text-amber-400' : 'bg-white/[0.04] text-white/25'}`}>
                  {s.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium truncate ${isValidated ? 'text-amber-200' : 'text-white/80'}`}>{s.name_simple}</span>
                    {isValidated && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                  </div>
                  <p className="text-white/25 text-xs">{s.verses_count} versets &middot; {s.revelation_place === 'makkah' ? 'Mecquoise' : 'Médinoise'}</p>
                </div>
                <span className="font-arabic text-base shrink-0" style={{ color: isValidated ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)' }}>{s.name_arabic}</span>
                <ChevronRight className="w-4 h-4 text-white/10 shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

/* ===================== RAPPELS TAB ===================== */
function RappelsTab() {
  const [reminderIdx, setReminderIdx] = useState(new Date().getDate() % DAILY_REMINDERS.length)
  const reminder = DAILY_REMINDERS[reminderIdx]

  return (
    <div>
      <header className="pt-2 mb-5">
        <h1 className="font-heading text-2xl font-bold text-white mb-1">Rappels</h1>
        <p className="text-white/40 text-sm">Nourris ton cœur au quotidien</p>
      </header>

      {/* Daily verse */}
      <div className="rounded-2xl bg-emerald-900/20 border border-emerald-500/10 p-5 mb-6">
        <p className="text-emerald-300/40 text-[10px] uppercase tracking-[0.2em] mb-3">Verset du jour</p>
        <p className="font-arabic text-amber-200 text-xl leading-[2.2] text-right mb-3" dir="rtl">{reminder.ar}</p>
        <p className="text-emerald-100/70 text-sm italic mb-2">{reminder.fr}</p>
        <p className="text-emerald-300/30 text-xs">{reminder.ref}</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setReminderIdx((reminderIdx + DAILY_REMINDERS.length - 1) % DAILY_REMINDERS.length)}
            className="px-4 py-1.5 rounded-lg bg-white/5 text-white/30 text-xs">Précédent</button>
          <button onClick={() => setReminderIdx((reminderIdx + 1) % DAILY_REMINDERS.length)}
            className="px-4 py-1.5 rounded-lg bg-white/5 text-white/30 text-xs">Suivant</button>
        </div>
      </div>

      {/* Adhkar */}
      {ADHKAR.map((section, si) => (
        <div key={si} className="mb-6">
          <h3 className="text-white/50 text-sm font-medium mb-3 uppercase tracking-wider">{section.title}</h3>
          <div className="space-y-2">
            {section.items.map((item, ii) => (
              <div key={ii} className="card-v2 p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded">{item.count}</span>
                </div>
                <p className="font-arabic text-amber-200/80 text-base text-right leading-[2] mb-2" dir="rtl">{item.ar}</p>
                <p className="text-white/35 text-xs">{item.fr}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ===================== PROGRESS TAB ===================== */
function ProgressTab({ totalStars, streak, surahProgress }: any) {
  const validated = Object.entries(surahProgress).filter(([_, v]: any) => v.validated)
  return (
    <div>
      <header className="pt-2 mb-5">
        <h1 className="font-heading text-2xl font-bold text-white mb-1">Progrès</h1>
      </header>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card-v2 p-4 text-center">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalStars}</p>
          <p className="text-white/30 text-xs">Sourates validées</p>
        </div>
        <div className="card-v2 p-4 text-center">
          <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{streak}</p>
          <p className="text-white/30 text-xs">Jours de suite</p>
        </div>
      </div>
      <div className="card-v2 p-4 mb-5">
        <div className="flex justify-between mb-2">
          <span className="text-white/50 text-sm">Progression globale</span>
          <span className="text-emerald-400 text-sm font-semibold">{totalStars}/114</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${(totalStars/114)*100}%` }} />
        </div>
      </div>
      <h3 className="text-white/50 text-sm font-medium mb-3 uppercase tracking-wider">Sourates validées</h3>
      {validated.length === 0 ? (
        <div className="card-v2 p-6 text-center"><Target className="w-8 h-8 text-white/10 mx-auto mb-2" /><p className="text-white/25 text-sm">Aucune sourate validée</p></div>
      ) : (
        <div className="space-y-1.5">{validated.map(([id, data]: any) => (
          <div key={id} className="card-v2 p-3 flex items-center gap-3">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" /><span className="text-white text-sm flex-1">Sourate {id}</span>
            <span className="text-emerald-400 text-sm font-semibold">{data.bestScore}%</span>
          </div>
        ))}</div>
      )}
    </div>
  )
}

/* ===================== SETTINGS TAB ===================== */
function SettingsTab({ preferredReciter, setReciter, activeTajwidRules, setTajwidRules }: any) {
  const allRules = getAvailableRules()
  const toggleRule = (id: string) => {
    setTajwidRules(activeTajwidRules.includes(id) ? activeTajwidRules.filter((r: string) => r !== id) : [...activeTajwidRules, id])
  }
  return (
    <div>
      <header className="pt-2 mb-5"><h1 className="font-heading text-2xl font-bold text-white mb-1">Réglages</h1></header>
      <h3 className="text-white/50 text-sm font-medium mb-3 uppercase tracking-wider">Récitateur</h3>
      <div className="space-y-2 mb-6">
        {RECITERS.map((r) => (
          <button key={r.id} onClick={() => setReciter(r.id)}
            className={`w-full card-v2 p-3 flex items-center gap-3 text-left transition ${preferredReciter === r.id ? 'card-v2-active' : 'hover:bg-white/[0.04]'}`}>
            <Volume2 className={`w-5 h-5 ${preferredReciter === r.id ? 'text-emerald-400' : 'text-white/15'}`} />
            <div className="flex-1"><span className="text-white text-sm">{r.name}</span><p className="text-white/25 text-xs">{r.style}</p></div>
            {preferredReciter === r.id && <Check className="w-4 h-4 text-emerald-400" />}
          </button>
        ))}
      </div>
      <h3 className="text-white/50 text-sm font-medium mb-3 uppercase tracking-wider">Règles de Tajwid</h3>
      <div className="space-y-2">
        {allRules.map((rule) => {
          const active = activeTajwidRules.includes(rule.id)
          return (
            <button key={rule.id} onClick={() => toggleRule(rule.id)}
              className={`w-full card-v2 p-3 flex items-center gap-3 text-left transition ${active ? 'border-emerald-500/20 bg-emerald-500/[0.05]' : ''}`}>
              <div className={`w-7 h-7 rounded flex items-center justify-center text-xs ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/15'}`}>
                {active ? <Check className="w-3.5 h-3.5" /> : ''}
              </div>
              <div className="flex-1"><span className="text-white text-sm">{rule.name}</span><p className="text-white/20 text-xs">{rule.description}</p></div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
