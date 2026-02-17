'use client'
import { useState, useEffect } from 'react'
import { useAuthStore, useProgressStore, useUIStore } from '@/lib/store'
import { RECITERS, fetchSurahs, type Surah } from '@/services/quran-api'
import { getAvailableRules } from '@/features/tajwid-engine'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Star, BookOpen, Settings, ChevronRight, Flame, Check, Volume2,
  Moon, Loader2, Search, X, Swords, BookMarked, Share2,
  LogOut, Shield, Bookmark, Download, Heart, Copy, CheckCircle2,
  ArrowRight, Sparkles, Clock, Trophy, Users, Info, MessageCircle, Mic,
} from 'lucide-react'

/* ===== CONTENT DATA ===== */
const REMINDERS = [
  { ar:'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا', fr:'Certes, avec la difficulté, il y a une facilité.', ref:'Al-Inshirah 94:6', type:'quran' as const },
  { ar:'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ', fr:'Quiconque place sa confiance en Allah, Il lui suffit.', ref:'At-Talaq 65:3', type:'quran' as const },
  { ar:'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ', fr:'Souvenez-vous de Moi, Je Me souviendrai de vous.', ref:'Al-Baqara 2:152', type:'quran' as const },
  { ar:'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', fr:'Le meilleur d\'entre vous est celui qui apprend le Coran et l\'enseigne.', ref:'Sahih al-Bukhari 5027', type:'hadith' as const },
  { ar:'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ', fr:'Celui qui emprunte un chemin pour rechercher la science, Allah lui facilite un chemin vers le Paradis.', ref:'Sahih Muslim 2699', type:'hadith' as const },
  { ar:'إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ', fr:'Allah ne regarde ni vos apparences ni vos biens, mais vos cœurs et vos actes.', ref:'Sahih Muslim 2564', type:'hadith' as const },
]

const DUAS = [
  { cat:'Matin', icon:'🌅', items:[
    { ar:'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ', ph:'Asbahna wa asbahal-mulku lillahi wal-hamdulillah', fr:'Nous voilà au matin et le royaume appartient à Allah.', n:'1x', src:'Citadelle 71' },
    { ar:'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ', ph:'Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan-nushur', fr:'Ô Allah, par Toi nous nous retrouvons au matin et au soir, par Toi nous vivons et mourons.', n:'1x', src:'Citadelle 72' },
    { ar:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', ph:'SubhanAllahi wa bihamdihi', fr:'Gloire et louange à Allah.', n:'100x', src:'Citadelle 82' },
  ]},
  { cat:'Soir', icon:'🌙', items:[
    { ar:'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ', ph:'Amsayna wa amsal-mulku lillah', fr:'Nous voilà au soir et le royaume appartient à Allah.', n:'1x', src:'Citadelle 73' },
    { ar:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', ph:"A'udhu bikalimati-llahit-tammati min sharri ma khalaq", fr:"Je cherche protection par les paroles parfaites d'Allah contre le mal de ce qu'Il a créé.", n:'3x', src:'Citadelle 85' },
  ]},
  { cat:'Après la prière', icon:'🕌', items:[
    { ar:'أَسْتَغْفِرُ ٱللَّهَ', ph:'Astaghfirullah', fr:'Je demande pardon à Allah.', n:'3x', src:'Citadelle 63' },
    { ar:'سُبْحَانَ ٱللَّهِ', ph:'SubhanAllah', fr:'Gloire à Allah.', n:'33x', src:'Citadelle 64' },
    { ar:'ٱلْحَمْدُ لِلَّهِ', ph:'Alhamdulillah', fr:'Louange à Allah.', n:'33x', src:'Citadelle 64' },
    { ar:'ٱللَّهُ أَكْبَرُ', ph:'Allahu Akbar', fr:'Allah est le Plus Grand.', n:'33x', src:'Citadelle 64' },
    { ar:'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', ph:'La ilaha illallahu wahdahu la sharika lah', fr:'Pas de divinité hormis Allah, Unique, sans associé.', n:'1x', src:'Citadelle 65' },
  ]},
  { cat:'Avant de dormir', icon:'😴', items:[
    { ar:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', ph:'Bismika Allahumma amutu wa ahya', fr:'En Ton nom, Ô Allah, je meurs et je vis.', n:'1x', src:'Citadelle 100' },
    { ar:'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', ph:"Allahumma qini 'adhabaka yawma tab'athu 'ibadak", fr:"Ô Allah, préserve-moi de Ton châtiment le jour où Tu ressusciteras Tes serviteurs.", n:'1x', src:'Citadelle 101' },
  ]},
  { cat:'Quotidien', icon:'📿', items:[
    { ar:'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', ph:"Bismillahi tawakkaltu 'alallahi wa la hawla wa la quwwata illa billah", fr:"Au nom d'Allah, je place ma confiance en Allah.", n:'en sortant', src:'Citadelle 46' },
    { ar:'بِسْمِ اللَّهِ', ph:'Bismillah', fr:"Au nom d'Allah.", n:'en mangeant', src:'Citadelle 52' },
    { ar:'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ', ph:"Alhamdulillahilladhi at'amani hadha wa razaqanihi", fr:"Louange à Allah qui m'a nourri de ceci et me l'a accordé.", n:'après manger', src:'Citadelle 54' },
  ]},
]

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  useEffect(() => { if (!isAuthenticated) router.replace('/auth') }, [isAuthenticated, router])
  if (!isAuthenticated) return null
  return <App />
}

function App() {
  const { activeTab, setTab, showInstall, hideInstall } = useUIStore()
  const { username, isAdmin, logout, preferredReciter, setReciter, activeTajwidRules, setTajwidRules } = useAuthStore()
  const progress = useProgressStore()
  const router = useRouter()
  const stars = progress.getTotalStars()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('mtj-onboarding')
    if (!seen) setShowOnboarding(true)
  }, [])

  const dismissOnboarding = () => { setShowOnboarding(false); localStorage.setItem('mtj-onboarding', '1') }

  return (
    <div className="min-h-dvh relative">
      {/* Onboarding modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-5 bg-black/60 backdrop-blur-sm anim-fade-in">
          <div className="w-full max-w-[380px] glass p-7 anim-fade-up">
            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#c9a84c]" />
              </div>
              <h2 className="heading text-xl font-bold text-white">Bienvenue sur Mon Tajwid</h2>
              <p className="text-white/30 text-sm mt-2">Apprends le Coran avec le Tajwid</p>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { icon: BookOpen, text: 'Écoute et lis les 114 sourates avec traduction et phonétique' },
                { icon: Mic, text: 'Récite et valide ta prononciation grâce à l\'IA' },
                { icon: Swords, text: 'Défie tes amis sur une sourate — qui aura le meilleur score ?' },
                { icon: Heart, text: 'Retrouve les invocations de la Citadelle du Musulman' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#34d399]/8 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-[#34d399]" />
                  </div>
                  <p className="text-white/45 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <button onClick={dismissOnboarding} className="btn-primary w-full">
              Commencer<ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {showInstall && (
        <div className="glass-gold mx-4 mt-3 px-4 py-3 flex items-center gap-3 rounded-2xl">
          <Download className="w-4 h-4 text-[#c9a84c] shrink-0" />
          <p className="text-[#c9a84c]/80 text-xs flex-1 leading-relaxed">Ajoute Mon Tajwid sur ton écran d&apos;accueil pour un accès instantané</p>
          <button onClick={hideInstall} className="text-white/20 hover:text-white/40 p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-5 pb-28">
        {activeTab==='quran' && <QuranTab p={progress} stars={stars} username={username} />}
        {activeTab==='duels' && <DuelsTab username={username} />}
        {activeTab==='duas' && <DuasTab />}
        {activeTab==='rappels' && <RappelsTab />}
        {activeTab==='settings' && <SettingsTab rec={preferredReciter} setRec={setReciter} rules={activeTajwidRules} setRules={setTajwidRules} username={username} isAdmin={isAdmin} stars={stars} streak={progress.streak} logout={()=>{logout();router.replace('/auth')}} />}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 safe-b" style={{background:'linear-gradient(to top, #080d1a 80%, transparent)'}}>
        <div className="max-w-lg mx-auto">
          <div className="mx-3 mb-2 glass rounded-2xl flex justify-around py-2">
            {([
              {k:'quran' as const,i:BookOpen,l:'Coran'},
              {k:'duels' as const,i:Swords,l:'Duel'},
              {k:'duas' as const,i:Heart,l:'Duas'},
              {k:'rappels' as const,i:Moon,l:'Rappels'},
              {k:'settings' as const,i:Settings,l:'Plus'},
            ]).map(({k,i:I,l})=>(
              <button key={k} onClick={()=>setTab(k)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all ${activeTab===k?'text-[#34d399]':'text-white/18 hover:text-white/30'}`}>
                <I className="w-[20px] h-[20px]" strokeWidth={activeTab===k?2.2:1.5} />
                <span className="text-[10px] font-semibold tracking-wide">{l}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}

/* ═══════════════ QURAN TAB ═══════════════ */
function QuranTab({ p, stars, username }: { p: any; stars: number; username: string|null }) {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const reminder = REMINDERS[new Date().getDate() % REMINDERS.length]

  useEffect(() => { fetchSurahs().then(setSurahs).catch(console.error).finally(()=>setLoading(false)) }, [])

  const bmKeys = Object.keys(p.bookmarks).map(Number)
  const filtered = search ? surahs.filter(s=>s.name_simple.toLowerCase().includes(search.toLowerCase())||s.name_arabic.includes(search)||String(s.id)===search) : surahs

  return <>
    <header className="mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-white/20 text-[11px] tracking-widest uppercase">Assalamu alaykum</p>
          <h1 className="heading text-2xl font-bold text-white mt-0.5">{username}</h1>
        </div>
        <div className="flex gap-2">
          <div className="pill-orange"><Flame className="w-3 h-3" />{p.streak}</div>
          <div className="pill-gold"><Star className="w-3 h-3 fill-current" />{stars}/114</div>
        </div>
      </div>

      {/* Daily reminder */}
      <div className="glass p-4 mb-5 anim-fade-up">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]/50" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{color: reminder.type==='hadith'?'rgba(201,168,76,0.5)':'rgba(52,211,153,0.5)'}}>
            {reminder.type==='hadith'?'Hadith':'Verset'} du jour
          </span>
        </div>
        <p className="arabic text-[#c9a84c]/80 text-[17px] leading-[2] text-right mb-2">{reminder.ar}</p>
        <p className="text-white/30 text-[13px] italic leading-relaxed">{reminder.fr}</p>
        <p className="text-white/12 text-[11px] mt-1.5">{reminder.ref}</p>
      </div>

      {/* Bookmarks */}
      {bmKeys.length > 0 && (
        <div className="mb-5 anim-fade-up delay-1">
          <h3 className="text-white/20 text-[10px] font-semibold uppercase tracking-[0.2em] mb-2.5 flex items-center gap-1.5">
            <Bookmark className="w-3 h-3" />En cours d&apos;apprentissage
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {bmKeys.map(id => {
              const s = surahs.find(s=>s.id===id)
              return s ? (
                <Link key={id} href={`/quran/${id}`} className="shrink-0 glass px-3.5 py-2 flex items-center gap-2 hover:bg-white/[0.04] transition rounded-xl">
                  <BookMarked className="w-3.5 h-3.5 text-[#34d399]/60" />
                  <span className="text-white/60 text-xs font-medium whitespace-nowrap">{s.name_simple}</span>
                  <span className="text-white/15 text-[10px]">v.{p.bookmarks[id]}</span>
                </Link>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative anim-fade-up delay-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/12" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une sourate..."
          className="input input-with-icon" />
        {search && <button onClick={()=>setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-white/15" /></button>}
      </div>
    </header>

    {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-[#34d399] animate-spin" /></div> : (
      <div className="space-y-1">
        {filtered.map((s,i) => {
          const val = p.surahProgress[s.id]?.validated; const hasBm = p.bookmarks[s.id]
          return (
            <Link key={s.id} href={`/quran/${s.id}`}
              className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-[0.995] anim-fade-up ${val?'glass-gold':'glass hover:bg-white/[0.04]'}`}
              style={{animationDelay:`${Math.min(i*0.02,0.5)}s`}}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${val?'bg-[#c9a84c]/15 text-[#c9a84c]':'bg-white/[0.03] text-white/15'}`}>{s.id}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[14px] font-medium truncate ${val?'text-[#c9a84c]':'text-white/65'}`}>{s.name_simple}</span>
                  {val && <Star className="w-3.5 h-3.5 text-[#c9a84c] fill-[#c9a84c] shrink-0" />}
                  {hasBm && !val && <Bookmark className="w-3 h-3 text-[#34d399]/40 shrink-0" />}
                </div>
                <p className="text-white/18 text-[11px] mt-0.5">{s.verses_count} versets &middot; {s.revelation_place==='makkah'?'Mecquoise':'Médinoise'}</p>
              </div>
              <span className="arabic text-[15px] shrink-0" style={{color:val?'rgba(201,168,76,0.2)':'rgba(255,255,255,0.06)'}}>{s.name_arabic}</span>
              <ChevronRight className="w-4 h-4 text-white/6 shrink-0" />
            </Link>
          )
        })}
      </div>
    )}
  </>
}

/* ═══════════════ DUELS TAB ═══════════════ */
function DuelsTab({ username }: { username: string|null }) {
  const [code, setCode] = useState(''); const [copied, setCopied] = useState(false); const [surah, setSurah] = useState(114)

  const create = () => setCode(`MTJ-${Math.random().toString(36).substring(2,6).toUpperCase()}`)
  const copy = () => {
    const link = `${typeof window!=='undefined'?window.location.origin:''}/duel/${code}`
    navigator.clipboard?.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2000)
  }
  const share = () => {
    const link = `${typeof window!=='undefined'?window.location.origin:''}/duel/${code}`
    if (navigator.share) navigator.share({ title:'Mon Tajwid — Duel', text:`${username} te défie sur la sourate ${surah} ! Qui aura le meilleur score ?`, url:link })
    else copy()
  }

  return <div>
    <header className="mb-6"><h1 className="heading text-2xl font-bold text-white">Duel</h1><p className="text-white/25 text-sm mt-1">Défie un ami sur une sourate</p></header>

    {/* Islamic verse about competition */}
    <div className="glass-gold p-4 mb-5 anim-fade-up">
      <p className="arabic text-[#c9a84c]/80 text-[15px] leading-[2] text-right mb-2">وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ ٱلْمُتَنَافِسُونَ</p>
      <p className="text-[#c9a84c]/40 text-xs italic">Et que ceux qui veulent se surpasser rivalisent pour cela.</p>
      <p className="text-[#c9a84c]/20 text-[10px] mt-1">Al-Mutaffifin 83:26</p>
    </div>

    <div className="glass p-5 mb-5 anim-fade-up">
      <h3 className="text-white/30 text-[10px] font-semibold uppercase tracking-[0.2em] mb-4">Comment ça marche</h3>
      {[{n:'1',t:'Choisis une sourate',d:'Sélectionne le défi'},{n:'2',t:'Partage le lien',d:'Envoie à un ami'},{n:'3',t:'Récitez et comparez',d:'Le meilleur score gagne'}].map(s=>(
        <div key={s.n} className="flex items-start gap-3 mb-3 last:mb-0">
          <div className="w-7 h-7 rounded-lg bg-[#34d399]/8 flex items-center justify-center text-[12px] text-[#34d399] font-bold shrink-0">{s.n}</div>
          <div><p className="text-white/60 text-sm font-medium">{s.t}</p><p className="text-white/20 text-xs">{s.d}</p></div>
        </div>
      ))}
    </div>

    <div className="glass p-5 mb-4 anim-fade-up delay-1">
      <label className="text-white/30 text-[10px] font-semibold uppercase tracking-[0.2em] mb-2 block">Sourate</label>
      <select value={surah} onChange={e=>setSurah(Number(e.target.value))} className="input mb-4 appearance-none" style={{backgroundImage:'none'}}>
        {Array.from({length:114},(_,i)=><option key={i+1} value={i+1} style={{background:'#0f172a'}}>Sourate {i+1}</option>)}
      </select>
      <button onClick={create} className="btn-primary w-full"><Swords className="w-4 h-4" />Créer un duel</button>
    </div>

    {code && (
      <div className="glass p-5 anim-fade-up">
        <p className="text-[#34d399] text-xs font-semibold mb-3">Duel créé ! Partage ce lien :</p>
        <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl p-3 mb-4">
          <code className="text-[#c9a84c] text-sm flex-1 font-mono">{code}</code>
          <button onClick={copy} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
            {copied?<CheckCircle2 className="w-4 h-4 text-[#34d399]"/>:<Copy className="w-4 h-4 text-white/25"/>}
          </button>
        </div>
        <button onClick={share} className="btn-gold w-full"><Share2 className="w-4 h-4" />Envoyer à un ami</button>
      </div>
    )}
  </div>
}

/* ═══════════════ DUAS TAB ═══════════════ */
function DuasTab() {
  const [open, setOpen] = useState(0)
  return <div>
    <header className="mb-6"><h1 className="heading text-2xl font-bold text-white">Invocations</h1>
      <p className="text-white/25 text-sm mt-1">La Citadelle du Musulman</p></header>
    {DUAS.map((s,i)=>(
      <div key={i} className="mb-2 anim-fade-up" style={{animationDelay:`${i*0.05}s`}}>
        <button onClick={()=>setOpen(open===i?-1:i)}
          className={`w-full glass p-4 flex items-center justify-between transition ${open===i?'glass-active':''} rounded-2xl`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{s.icon}</span>
            <span className="text-white/60 text-sm font-medium">{s.cat}</span>
          </div>
          <span className="text-white/15 text-xs">{s.items.length} duas</span>
        </button>
        {open===i && (
          <div className="mt-1.5 space-y-1.5 pl-3 anim-fade-up">
            {s.items.map((d,j)=>(
              <div key={j} className="glass p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="pill-emerald text-[10px]">{d.n}</span>
                  <span className="text-white/10 text-[10px]">{d.src}</span>
                </div>
                <p className="arabic text-[#c9a84c]/75 text-[16px] leading-[2] text-right mb-2">{d.ar}</p>
                <p className="text-[#34d399]/40 text-[13px] italic mb-1.5">{d.ph}</p>
                <p className="text-white/25 text-xs leading-relaxed">{d.fr}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
}

/* ═══════════════ RAPPELS TAB ═══════════════ */
function RappelsTab() {
  const [idx, setIdx] = useState(0); const r = REMINDERS[idx]
  return <div>
    <header className="mb-6"><h1 className="heading text-2xl font-bold text-white">Rappels</h1>
      <p className="text-white/25 text-sm mt-1">Versets et hadiths authentiques</p></header>
    <div className="glass p-6 mb-5 anim-fade-up">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{color:r.type==='hadith'?'rgba(201,168,76,0.5)':'rgba(52,211,153,0.5)'}}>{r.type==='hadith'?'Hadith':'Verset du Coran'}</span>
        <span className="text-white/10 text-[11px]">{idx+1}/{REMINDERS.length}</span>
      </div>
      <p className="arabic text-[#c9a84c] text-xl leading-[2.2] text-right mb-4">{r.ar}</p>
      <p className="text-white/40 text-sm italic leading-relaxed mb-2">{r.fr}</p>
      <p className="text-white/15 text-xs">{r.ref}</p>
      <div className="flex gap-2 mt-5">
        <button onClick={()=>setIdx((idx-1+REMINDERS.length)%REMINDERS.length)} className="btn-ghost text-xs py-2.5 px-5 flex-1">Précédent</button>
        <button onClick={()=>setIdx((idx+1)%REMINDERS.length)} className="btn-ghost text-xs py-2.5 px-5 flex-1">Suivant</button>
      </div>
    </div>
  </div>
}

/* ═══════════════ SETTINGS TAB ═══════════════ */
function SettingsTab({ rec, setRec, rules, setRules, username, isAdmin, stars, streak, logout }: any) {
  const allRules = getAvailableRules()
  const toggle = (id:string) => setRules(rules.includes(id)?rules.filter((r:string)=>r!==id):[...rules,id])

  return <div>
    <header className="mb-6"><h1 className="heading text-2xl font-bold text-white">Paramètres</h1></header>

    {/* Profile */}
    <div className="glass p-5 mb-5 flex items-center gap-4 anim-fade-up">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#34d399]/20 to-[#c9a84c]/10 flex items-center justify-center text-[#34d399] font-bold text-xl heading">
        {(username||'?')[0].toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="text-white font-semibold text-[15px]">{username}</p>
        <div className="flex gap-3 mt-1">
          <span className="text-[#c9a84c] text-xs font-medium flex items-center gap-1"><Star className="w-3 h-3 fill-current" />{stars}</span>
          <span className="text-orange-400 text-xs font-medium flex items-center gap-1"><Flame className="w-3 h-3" />{streak}j</span>
        </div>
      </div>
      {isAdmin && <Link href="/admin" className="pill-red text-[10px]"><Shield className="w-3 h-3" />Admin</Link>}
    </div>

    {/* Progress bar */}
    <div className="glass p-4 mb-6 anim-fade-up delay-1">
      <div className="flex justify-between mb-2"><span className="text-white/30 text-xs">Progression</span><span className="text-[#34d399] text-xs font-bold">{Math.round((stars/114)*100)}%</span></div>
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden"><div className="h-full rounded-full" style={{width:`${(stars/114)*100}%`,background:'linear-gradient(90deg,#059669,#34d399)'}} /></div>
    </div>

    <h3 className="text-white/20 text-[10px] font-semibold uppercase tracking-[0.2em] mb-3">Récitateur</h3>
    <div className="space-y-1.5 mb-6">
      {RECITERS.map(r=>(
        <button key={r.id} onClick={()=>setRec(r.id)} className={`w-full glass p-3.5 flex items-center gap-3 text-left transition rounded-2xl ${rec===r.id?'glass-active':''}`}>
          <Volume2 className={`w-4 h-4 ${rec===r.id?'text-[#34d399]':'text-white/8'}`} />
          <div className="flex-1"><span className="text-white/55 text-sm">{r.name}</span><p className="text-white/15 text-[11px]">{r.style}</p></div>
          {rec===r.id && <Check className="w-4 h-4 text-[#34d399]" />}
        </button>
      ))}
    </div>

    <h3 className="text-white/20 text-[10px] font-semibold uppercase tracking-[0.2em] mb-3">Tajwid actif</h3>
    <div className="space-y-1.5 mb-6">
      {allRules.map(r=>{
        const a=rules.includes(r.id)
        return <button key={r.id} onClick={()=>toggle(r.id)} className={`w-full glass p-3 flex items-center gap-3 text-left transition rounded-2xl ${a?'border-[#34d399]/15 bg-[#34d399]/[0.03]':''}`}>
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${a?'bg-[#34d399]/15 text-[#34d399]':'bg-white/[0.03] text-white/8'}`}>{a&&<Check className="w-3 h-3"/>}</div>
          <span className="text-white/45 text-sm flex-1">{r.name}</span>
        </button>
      })}
    </div>

    <button onClick={logout} className="w-full glass p-3.5 flex items-center justify-center gap-2 text-red-400/50 hover:text-red-400 transition rounded-2xl">
      <LogOut className="w-4 h-4" />Déconnexion
    </button>
  </div>
}
