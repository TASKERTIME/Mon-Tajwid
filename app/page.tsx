'use client'
import { useState, useEffect } from 'react'
import { useAuthStore, useProgressStore, useUIStore } from '@/lib/store'
import { RECITERS, fetchSurahs, type Surah } from '@/services/quran-api'
import { getAvailableRules } from '@/features/tajwid-engine'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Star, BookOpen, Settings, ChevronRight, Flame, Check, Volume2,
  BarChart3, Moon, Loader2, Search, X, Swords, BookMarked, Share2,
  LogOut, Shield, Bookmark, Download, Bell, Heart, Copy, CheckCircle2,
} from 'lucide-react'

/* ===== DATA ===== */
const REMINDERS = [
  { ar:'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا', fr:'Certes, avec la difficulté, il y a une facilité.', ref:'Al-Inshirah 94:6', type:'quran' },
  { ar:'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ', fr:'Quiconque place sa confiance en Allah, Il lui suffit.', ref:'At-Talaq 65:3', type:'quran' },
  { ar:'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ', fr:'Souvenez-vous de Moi, Je Me souviendrai de vous.', ref:'Al-Baqara 2:152', type:'quran' },
  { ar:'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', fr:'Le meilleur d\'entre vous est celui qui apprend le Coran et l\'enseigne.', ref:'Sahih al-Bukhari 5027', type:'hadith' },
  { ar:'مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ', fr:'Celui qui lit une lettre du Livre d\'Allah obtient une bonne action.', ref:'Sunan at-Tirmidhi 2910', type:'hadith' },
  { ar:'إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ', fr:'Allah ne regarde ni vos apparences ni vos biens, mais Il regarde vos cœurs et vos actes.', ref:'Sahih Muslim 2564', type:'hadith' },
]

const INVOCATIONS = [
  { cat:'Matin', items:[
    { ar:'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ', fr:'Nous voilà au matin et le royaume appartient à Allah, louange à Allah.', count:'1x', src:'Citadelle 71' },
    { ar:'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ', fr:'Ô Allah, c\'est par Toi que nous nous retrouvons au matin, et par Toi au soir, par Toi nous vivons et mourons, et c\'est vers Toi la résurrection.', count:'1x', src:'Citadelle 72' },
    { ar:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', fr:'Gloire et louange à Allah.', count:'100x', src:'Citadelle 82' },
  ]},
  { cat:'Soir', items:[
    { ar:'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ', fr:'Nous voilà au soir et le royaume appartient à Allah, louange à Allah.', count:'1x', src:'Citadelle 73' },
    { ar:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', fr:'Je cherche protection par les paroles parfaites d\'Allah contre le mal de ce qu\'Il a créé.', count:'3x', src:'Citadelle 85' },
  ]},
  { cat:'Après la prière', items:[
    { ar:'أَسْتَغْفِرُ ٱللَّهَ', fr:'Je demande pardon à Allah.', count:'3x', src:'Citadelle 63' },
    { ar:'سُبْحَانَ ٱللَّهِ', fr:'Gloire à Allah.', count:'33x', src:'Citadelle 64' },
    { ar:'ٱلْحَمْدُ لِلَّهِ', fr:'Louange à Allah.', count:'33x', src:'Citadelle 64' },
    { ar:'ٱللَّهُ أَكْبَرُ', fr:'Allah est le Plus Grand.', count:'33x', src:'Citadelle 64' },
    { ar:'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', fr:'Pas de divinité à part Allah, Unique, sans associé.', count:'1x', src:'Citadelle 65' },
  ]},
  { cat:'Avant de dormir', items:[
    { ar:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', fr:'En Ton nom, Ô Allah, je meurs et je vis.', count:'1x', src:'Citadelle 100' },
    { ar:'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', fr:'Ô Allah, préserve-moi de Ton châtiment le jour où Tu ressusciteras Tes serviteurs.', count:'1x', src:'Citadelle 101' },
  ]},
  { cat:'Du quotidien', items:[
    { ar:'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', fr:'Au nom d\'Allah, je place ma confiance en Allah. Il n\'y a de force ni de puissance qu\'en Allah.', count:'en sortant', src:'Citadelle 46' },
    { ar:'بِسْمِ اللَّهِ', fr:'Au nom d\'Allah.', count:'en mangeant', src:'Citadelle 52' },
    { ar:'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ', fr:'Louange à Allah qui m\'a nourri de ceci et me l\'a accordé.', count:'après manger', src:'Citadelle 54' },
  ]},
]

export default function HomePage() {
  const { isAuthenticated, username, isAdmin } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return <MainApp />
}

function MainApp() {
  const { activeTab, setActiveTab, showInstallBanner, dismissInstallBanner } = useUIStore()
  const { username, isAdmin, logout, preferredReciter, setReciter, activeTajwidRules, setTajwidRules } = useAuthStore()
  const { surahProgress, bookmarks, streak, getTotalStars } = useProgressStore()
  const totalStars = getTotalStars()
  const router = useRouter()

  return (
    <div className="min-h-screen relative">
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 flex items-center gap-3">
          <Download className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-xs flex-1">Installe Mon Tajwid sur ton écran d&apos;accueil pour un accès rapide</p>
          <button onClick={dismissInstallBanner} className="text-white/30 hover:text-white/50"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-5 pb-24">
        {activeTab === 'quran' && <QuranTab surahProgress={surahProgress} bookmarks={bookmarks} totalStars={totalStars} streak={streak} username={username} />}
        {activeTab === 'duels' && <DuelsTab username={username} />}
        {activeTab === 'invocations' && <InvocationsTab />}
        {activeTab === 'rappels' && <RappelsTab />}
        {activeTab === 'settings' && <SettingsTab preferredReciter={preferredReciter} setReciter={setReciter}
          activeTajwidRules={activeTajwidRules} setTajwidRules={setTajwidRules}
          username={username} isAdmin={isAdmin} logout={() => { logout(); router.replace('/auth') }} />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-white/5 z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto flex justify-around py-2.5 px-2">
          {([
            { key:'quran' as const, icon: BookOpen, label:'Coran' },
            { key:'duels' as const, icon: Swords, label:'Duel' },
            { key:'invocations' as const, icon: Heart, label:'Duas' },
            { key:'rappels' as const, icon: Moon, label:'Rappels' },
            { key:'settings' as const, icon: Settings, label:'Plus' },
          ]).map(({key,icon:Icon,label}) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${activeTab===key ? 'text-emerald-400' : 'text-white/20'}`}>
              <Icon className="w-5 h-5" /><span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

/* ==================== QURAN TAB ==================== */
function QuranTab({ surahProgress, bookmarks, totalStars, streak, username }: any) {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const reminder = REMINDERS[new Date().getDate() % REMINDERS.length]

  useEffect(() => { fetchSurahs().then(setSurahs).catch(console.error).finally(() => setLoading(false)) }, [])

  const bookmarkedSurahs = Object.keys(bookmarks).map(Number)
  const filtered = search ? surahs.filter(s =>
    s.name_simple.toLowerCase().includes(search.toLowerCase()) || s.name_arabic.includes(search) || s.id.toString() === search
  ) : surahs

  return (
    <>
      {/* Header */}
      <header className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/25 text-xs mb-0.5">Assalamu alaykum</p>
            <h1 className="text-xl font-bold text-white">{username || 'Mon Tajwid'}</h1>
          </div>
          <div className="flex gap-2">
            <div className="badge-orange"><Flame className="w-3 h-3" />{streak}</div>
            <div className="badge-amber"><Star className="w-3 h-3 fill-current" />{totalStars}/114</div>
          </div>
        </div>

        {/* Reminder card */}
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[9px] uppercase tracking-widest font-medium ${reminder.type === 'hadith' ? 'text-amber-400/50' : 'text-emerald-400/50'}`}>
              {reminder.type === 'hadith' ? 'Hadith' : 'Verset'} du jour
            </span>
          </div>
          <p className="arabic-text text-amber-200/70 text-base leading-[1.9] text-right mb-2">{reminder.ar}</p>
          <p className="text-white/35 text-xs italic">{reminder.fr}</p>
          <p className="text-white/15 text-[10px] mt-1">{reminder.ref}</p>
        </div>

        {/* Bookmarks */}
        {bookmarkedSurahs.length > 0 && (
          <div className="mb-4">
            <h3 className="text-white/30 text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bookmark className="w-3 h-3" />En cours
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {bookmarkedSurahs.map(id => {
                const s = surahs.find(s => s.id === id)
                return s ? (
                  <Link key={id} href={`/quran/${id}`}
                    className="shrink-0 card px-3 py-2 flex items-center gap-2 hover:bg-white/[0.06] transition">
                    <BookMarked className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-white/70 text-xs font-medium">{s.name_simple}</span>
                    <span className="text-white/20 text-[10px]">v.{bookmarks[id]}</span>
                  </Link>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une sourate..."
            className="input-field pl-10 pr-10" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-white/20" /></button>}
        </div>
      </header>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-emerald-400 animate-spin" /></div> : (
        <div className="space-y-1">
          {filtered.map(s => {
            const p = surahProgress[s.id]; const val = p?.validated
            return (
              <Link key={s.id} href={`/quran/${s.id}`}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.995] ${val ? 'card-gold' : 'card hover:bg-white/[0.05]'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${val ? 'bg-amber-400/15 text-amber-400' : 'bg-white/[0.04] text-white/20'}`}>{s.id}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium truncate ${val ? 'text-amber-200' : 'text-white/70'}`}>{s.name_simple}</span>
                    {val && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                    {bookmarks[s.id] && !val && <Bookmark className="w-3 h-3 text-emerald-400/50 shrink-0" />}
                  </div>
                  <p className="text-white/20 text-[11px]">{s.verses_count} versets &middot; {s.revelation_place==='makkah'?'Mecquoise':'Médinoise'}</p>
                </div>
                <span className="arabic-text text-sm shrink-0" style={{ color: val ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.08)' }}>{s.name_arabic}</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/8 shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

/* ==================== DUELS TAB ==================== */
function DuelsTab({ username }: { username: string | null }) {
  const [shareCode, setShareCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedSurah, setSelectedSurah] = useState(1)

  const createDuel = () => {
    const code = `MTJ-${Math.random().toString(36).substring(2,6).toUpperCase()}`
    setShareCode(code)
  }

  const copyLink = () => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/duel/${shareCode}`
    navigator.clipboard?.writeText(link)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = () => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/duel/${shareCode}`
    const text = `${username} te défie sur la sourate ${selectedSurah} dans Mon Tajwid ! Qui terminera en premier ? 🏆`
    if (navigator.share) {
      navigator.share({ title: 'Mon Tajwid — Duel', text, url: link })
    } else { copyLink() }
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-xl font-bold text-white mb-1">Duel</h1>
        <p className="text-white/30 text-sm">Défie un ami sur une sourate</p>
      </header>

      {/* How it works */}
      <div className="card p-4 mb-5">
        <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">Comment ça marche</h3>
        <div className="space-y-3">
          {[
            { n:'1', t:'Choisis une sourate', d:'Sélectionne la sourate du défi' },
            { n:'2', t:'Envoie le lien', d:'Partage le défi avec un ami' },
            { n:'3', t:'Récitez tous les deux', d:'Qui aura le meilleur score ?' },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs text-emerald-400 font-bold shrink-0">{s.n}</div>
              <div><p className="text-white/70 text-sm font-medium">{s.t}</p><p className="text-white/25 text-xs">{s.d}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Create duel */}
      <div className="card p-4 mb-4">
        <label className="text-white/40 text-xs font-medium mb-2 block uppercase tracking-wider">Sourate du défi</label>
        <select value={selectedSurah} onChange={e => setSelectedSurah(Number(e.target.value))}
          className="input-field mb-3 appearance-none">
          {Array.from({length:114},(_,i) => <option key={i+1} value={i+1} className="bg-slate-900">Sourate {i+1}</option>)}
        </select>
        <button onClick={createDuel} className="btn-primary w-full flex items-center justify-center gap-2">
          <Swords className="w-4 h-4" />Créer un duel
        </button>
      </div>

      {/* Share code */}
      {shareCode && (
        <div className="card p-4 animate-fade-in-up">
          <p className="text-emerald-400 text-xs font-medium mb-3">Duel créé ! Partage ce lien :</p>
          <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg p-3 mb-3">
            <code className="text-amber-300 text-sm flex-1 font-mono">{shareCode}</code>
            <button onClick={copyLink} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition">
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/30" />}
            </button>
          </div>
          <button onClick={shareLink} className="btn-gold w-full flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" />Envoyer à un ami
          </button>
        </div>
      )}
    </div>
  )
}

/* ==================== INVOCATIONS TAB ==================== */
function InvocationsTab() {
  const [openCat, setOpenCat] = useState(0)
  return (
    <div>
      <header className="mb-5">
        <h1 className="text-xl font-bold text-white mb-1">Invocations</h1>
        <p className="text-white/30 text-sm">La Citadelle du Musulman</p>
      </header>
      {INVOCATIONS.map((section, si) => (
        <div key={si} className="mb-3">
          <button onClick={() => setOpenCat(openCat === si ? -1 : si)}
            className={`w-full card p-3 flex items-center justify-between transition ${openCat === si ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : ''}`}>
            <span className="text-white/70 text-sm font-medium">{section.cat}</span>
            <span className="text-white/20 text-xs">{section.items.length} duas</span>
          </button>
          {openCat === si && (
            <div className="mt-1 space-y-1.5 animate-fade-in-up">
              {section.items.map((item, ii) => (
                <div key={ii} className="card p-4 ml-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-emerald">{item.count}</span>
                    <span className="text-white/15 text-[10px]">{item.src}</span>
                  </div>
                  <p className="arabic-text text-amber-200/70 text-base leading-[2] text-right mb-2">{item.ar}</p>
                  <p className="text-white/30 text-xs">{item.fr}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ==================== RAPPELS TAB ==================== */
function RappelsTab() {
  const [idx, setIdx] = useState(0)
  const r = REMINDERS[idx]
  return (
    <div>
      <header className="mb-5">
        <h1 className="text-xl font-bold text-white mb-1">Rappels</h1>
        <p className="text-white/30 text-sm">Versets et hadiths pour nourrir le cœur</p>
      </header>
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[9px] uppercase tracking-widest font-semibold ${r.type==='hadith'?'text-amber-400/60':'text-emerald-400/60'}`}>{r.type==='hadith'?'Hadith':'Verset'}</span>
          <span className="text-white/10 text-[10px]">{idx+1}/{REMINDERS.length}</span>
        </div>
        <p className="arabic-text text-amber-200 text-lg leading-[2.2] text-right mb-3">{r.ar}</p>
        <p className="text-white/50 text-sm italic mb-2">{r.fr}</p>
        <p className="text-white/20 text-xs">{r.ref}</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setIdx((idx-1+REMINDERS.length)%REMINDERS.length)} className="btn-outline text-xs py-2 px-4">Précédent</button>
          <button onClick={() => setIdx((idx+1)%REMINDERS.length)} className="btn-outline text-xs py-2 px-4">Suivant</button>
        </div>
      </div>
      {/* Progress stat */}
      <div className="card p-4">
        <div className="flex items-center gap-3"><Bell className="w-5 h-5 text-amber-400/40" />
          <div><p className="text-white/60 text-sm font-medium">Rappels quotidiens</p>
            <p className="text-white/25 text-xs">Active les notifications pour ne rien manquer</p></div>
        </div>
      </div>
    </div>
  )
}

/* ==================== SETTINGS TAB ==================== */
function SettingsTab({ preferredReciter, setReciter, activeTajwidRules, setTajwidRules, username, isAdmin, logout }: any) {
  const allRules = getAvailableRules()
  const { surahProgress, streak, getTotalStars } = useProgressStore()
  const totalStars = getTotalStars()
  const router = useRouter()
  const toggle = (id: string) => setTajwidRules(activeTajwidRules.includes(id) ? activeTajwidRules.filter((r:string) => r!==id) : [...activeTajwidRules, id])

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-xl font-bold text-white mb-1">Paramètres</h1>
      </header>

      {/* Profile card */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-lg">
          {(username || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold">{username}</p>
          <div className="flex gap-3 mt-0.5">
            <span className="text-amber-400 text-xs">{totalStars} sourates</span>
            <span className="text-orange-400 text-xs">{streak}j série</span>
          </div>
        </div>
        {isAdmin && <Link href="/admin" className="badge-red"><Shield className="w-3 h-3" />Admin</Link>}
      </div>

      {/* Progress */}
      <div className="card p-4 mb-5">
        <div className="flex justify-between mb-2">
          <span className="text-white/40 text-sm">Progression</span>
          <span className="text-emerald-400 text-sm font-semibold">{Math.round((totalStars/114)*100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{width:`${(totalStars/114)*100}%`}} />
        </div>
      </div>

      <h3 className="text-white/30 text-xs font-medium uppercase tracking-wider mb-2">Récitateur</h3>
      <div className="space-y-1.5 mb-5">
        {RECITERS.map(r => (
          <button key={r.id} onClick={() => setReciter(r.id)}
            className={`w-full card p-3 flex items-center gap-3 text-left transition ${preferredReciter===r.id?'card-active':''}`}>
            <Volume2 className={`w-4 h-4 ${preferredReciter===r.id?'text-emerald-400':'text-white/10'}`} />
            <div className="flex-1"><span className="text-white/70 text-sm">{r.name}</span><p className="text-white/20 text-xs">{r.style}</p></div>
            {preferredReciter===r.id && <Check className="w-4 h-4 text-emerald-400" />}
          </button>
        ))}
      </div>

      <h3 className="text-white/30 text-xs font-medium uppercase tracking-wider mb-2">Tajwid</h3>
      <div className="space-y-1.5 mb-5">
        {allRules.map(rule => {
          const a = activeTajwidRules.includes(rule.id)
          return (
            <button key={rule.id} onClick={() => toggle(rule.id)}
              className={`w-full card p-3 flex items-center gap-3 text-left transition ${a?'border-emerald-500/15 bg-emerald-500/[0.03]':''}`}>
              <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${a?'bg-emerald-500/20 text-emerald-400':'bg-white/5 text-white/10'}`}>
                {a && <Check className="w-3 h-3" />}
              </div>
              <div className="flex-1"><span className="text-white/60 text-sm">{rule.name}</span></div>
            </button>
          )
        })}
      </div>

      <button onClick={logout} className="w-full card p-3 flex items-center justify-center gap-2 text-red-400/60 hover:text-red-400 transition">
        <LogOut className="w-4 h-4" />Déconnexion
      </button>
    </div>
  )
}
