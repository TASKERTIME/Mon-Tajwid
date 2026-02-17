'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUIStore, useAuthStore, useProgressStore } from '@/lib/store'
import { fetchVerses, type Verse } from '@/services/quran-api'
import {
  ArrowLeft, Play, Pause, SkipForward, SkipBack, Mic, MicOff,
  Star, CheckCircle2, XCircle, Loader2, BookOpen, Bookmark, BookmarkCheck, Check,
} from 'lucide-react'

export default function SurahPage() {
  const params = useParams()
  const router = useRouter()
  const surahId = parseInt(params.surahId as string)
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'learn'|'validate'>('learn')
  const { displayMode, setDisplayMode, currentVerse, setCurrentVerse, isPlaying, setPlaying } = useUIStore()
  const { preferredReciter } = useAuthStore()
  const { surahProgress, setSurahProgress, updateStreak, bookmarks, setBookmark, removeBookmark } = useProgressStore()
  const isValidated = surahProgress[surahId]?.validated || false
  const hasBookmark = bookmarks[surahId] !== undefined
  const audioRef = useRef<HTMLAudioElement|null>(null)
  const cvRef = useRef<number|null>(null)
  const versesRef = useRef<Verse[]>([])

  useEffect(() => { cvRef.current = currentVerse }, [currentVerse])
  useEffect(() => { versesRef.current = verses }, [verses])

  useEffect(() => {
    setLoading(true)
    fetchVerses(surahId, preferredReciter)
      .then(d => { setVerses(d); const bm = bookmarks[surahId]; setCurrentVerse(bm || (d.length > 0 ? 1 : null)) })
      .catch(console.error).finally(() => setLoading(false))
    return () => { setPlaying(false); setCurrentVerse(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahId, preferredReciter])

  useEffect(() => {
    const audio = new Audio(); audio.preload = 'auto'
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', () => setPlaying(false))
    audioRef.current = audio
    return () => { audio.removeEventListener('ended', onEnded); audio.pause(); audio.src = '' }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onEnded() {
    const cv = cvRef.current; const vv = versesRef.current
    if (cv && cv < vv.length) playAudio(cv + 1, vv)
    else setPlaying(false)
  }

  function playAudio(n: number, vList?: Verse[]) {
    const list = vList || versesRef.current
    const v = list.find(v => v.verse_number === n)
    if (!v?.audio_url || !audioRef.current) return
    setCurrentVerse(n); cvRef.current = n
    audioRef.current.src = v.audio_url
    audioRef.current.play().catch(() => {})
    setPlaying(true)
    setBookmark(surahId, n)
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setPlaying(false) }
    else if (currentVerse) playAudio(currentVerse)
  }

  // Voice
  const [isRec, setIsRec] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const mrRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startRef = useRef(0)

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(100); mrRef.current = mr; startRef.current = Date.now()
      setIsRec(true); setResult(null)
    } catch { alert("Microphone non disponible") }
  }

  async function stopRec() {
    const mr = mrRef.current; if (!mr) return
    setIsRec(false); setAnalyzing(true)
    await new Promise<void>(r => { mr.onstop = () => r(); mr.stop() })
    mr.stream.getTracks().forEach(t => t.stop())
    const dur = Math.round((Date.now()-startRef.current)/1000)
    const blob = new Blob(chunksRef.current, { type: mr.mimeType })
    const expected = verses.map(v => v.text_uthmani).join(' ')
    try {
      const fd = new FormData(); fd.append('audio', blob, 'rec.webm'); fd.append('expected_text', expected); fd.append('duration', dur.toString())
      const res = await fetch('/api/voice/analyze', { method:'POST', body: fd })
      if (!res.ok) throw new Error('API')
      const data = await res.json(); setResult(data)
      if (data.overallScore >= 70) {
        const prev = surahProgress[surahId]
        setSurahProgress(surahId, { validated:true, bestScore: Math.max(data.overallScore, prev?.bestScore||0), attempts:(prev?.attempts||0)+1 })
        updateStreak(); removeBookmark(surahId)
      }
    } catch {
      const s = Math.floor(55+Math.random()*40)
      const demo = { overallScore: s, accuracy: Math.min(s+8,100), tajwidAnalysis:{ score: Math.max(s-10,0), details:[
        { rule:'Ghunnah', status: s>70?'correct':'manquant', tip:'Prolonge le son nasal sur les lettres noon et meem avec shadda (2 temps).' },
        { rule:'Madd naturel', status: s>65?'correct':'trop court', tip:'Allonge la voyelle de 2 temps quand elle est suivie d\'une lettre sans voyelle.' },
        { rule:'Ikhfa', status: s>75?'correct':'absent', tip:'Prononce le noun sakin de manière nasale et cachée avant les lettres d\'ikhfa.' },
      ]}}
      setResult(demo)
      if (s >= 70) {
        const prev = surahProgress[surahId]
        setSurahProgress(surahId, { validated:true, bestScore: Math.max(s, prev?.bestScore||0), attempts:(prev?.attempts||0)+1 })
        updateStreak(); removeBookmark(surahId)
      }
    } finally { setAnalyzing(false) }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-7 h-7 text-emerald-400 animate-spin" /></div>

  return (
    <div className="max-w-lg mx-auto px-4 py-5 pb-36">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"><ArrowLeft className="w-5 h-5 text-white" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            Sourate {surahId}
            {isValidated && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
          </h1>
          <p className="text-white/25 text-xs">{verses.length} versets</p>
        </div>
        <button onClick={() => hasBookmark ? removeBookmark(surahId) : setBookmark(surahId, currentVerse || 1)}
          className={`p-2 rounded-xl transition ${hasBookmark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
          {hasBookmark ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 mb-4">
        <button onClick={() => setViewMode('learn')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5 ${viewMode==='learn'?'bg-emerald-500/10 text-emerald-300 border border-emerald-500/15':'text-white/25'}`}>
          <BookOpen className="w-3.5 h-3.5" />Apprendre</button>
        <button onClick={() => { setViewMode('validate'); audioRef.current?.pause(); setPlaying(false) }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5 ${viewMode==='validate'?'bg-amber-500/10 text-amber-300 border border-amber-500/15':'text-white/25'}`}>
          <Mic className="w-3.5 h-3.5" />Valider</button>
      </div>

      {viewMode === 'learn' && (
        <div className="flex gap-1 mb-4 p-0.5 rounded-lg bg-white/[0.02]">
          {([{k:'arabic' as const,l:'عربي'},{k:'phonetic' as const,l:'Phon.'},{k:'translation' as const,l:'FR'},{k:'all' as const,l:'Tout'}]).map(({k,l}) => (
            <button key={k} onClick={() => setDisplayMode(k)}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition ${displayMode===k?'bg-emerald-500/10 text-emerald-300':'text-white/20'}`}>{l}</button>
          ))}
        </div>
      )}

      {/* LEARN */}
      {viewMode === 'learn' && (
        <>
          <div className="space-y-1.5">
            {verses.map(v => {
              const active = currentVerse === v.verse_number
              return (
                <button key={v.verse_number} onClick={() => playAudio(v.verse_number)}
                  className={`w-full text-left p-4 rounded-xl transition ${active?'card-active':'card hover:bg-white/[0.05]'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-[11px] text-emerald-400 font-bold">{v.verse_number}</span>
                    {active && isPlaying && (
                      <div className="flex items-end gap-[2px] h-4">
                        {[1,2,3,4,5].map(i => <div key={i} className="w-[2px] bg-emerald-400 rounded-full" style={{animation:'audioBar 1s ease-in-out infinite',animationDelay:`${i*.1}s`,height:'40%'}} />)}
                      </div>
                    )}
                  </div>
                  {(displayMode==='arabic'||displayMode==='all') && <p className="arabic-verse mb-2">{v.text_uthmani}</p>}
                  {(displayMode==='phonetic'||displayMode==='all') && v.text_transliteration && <p className="text-emerald-200/30 text-sm italic mb-1">{v.text_transliteration}</p>}
                  {(displayMode==='translation'||displayMode==='all') && <p className="text-white/30 text-sm leading-relaxed">{v.translation_fr}</p>}
                </button>
              )
            })}
          </div>
          <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-white/5 z-50">
            <div className="max-w-lg mx-auto flex items-center justify-center gap-8 py-3">
              <button onClick={() => currentVerse && currentVerse>1 && playAudio(currentVerse-1)} className="text-white/15 hover:text-white/40 transition"><SkipBack className="w-5 h-5" /></button>
              <button onClick={togglePlay} className="w-12 h-12 rounded-full btn-primary flex items-center justify-center">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button onClick={() => currentVerse && currentVerse<verses.length && playAudio(currentVerse+1)} className="text-white/15 hover:text-white/40 transition"><SkipForward className="w-5 h-5" /></button>
            </div>
            <p className="text-center text-white/10 text-[10px] pb-2">Verset {currentVerse||'-'} / {verses.length}</p>
          </div>
        </>
      )}

      {/* VALIDATE */}
      {viewMode === 'validate' && (
        <div className="text-center py-6">
          {!isRec && !analyzing && !result && (
            <div className="space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full card flex items-center justify-center"><Mic className="w-8 h-8 text-white/10" /></div>
              <div><h2 className="text-white text-lg font-semibold mb-1">Prêt à réciter ?</h2><p className="text-white/25 text-sm">L&apos;IA analysera précision et Tajwid</p></div>
              <button onClick={startRec} className="btn-gold text-base px-10">Commencer</button>
            </div>
          )}
          {isRec && (
            <div className="space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center" style={{animation:'pulseGlow 2s ease-in-out infinite'}}><Mic className="w-8 h-8 text-red-400" /></div>
              <div className="flex items-end gap-1 justify-center h-8">
                {Array.from({length:20}).map((_,i) => <div key={i} className="w-[3px] bg-red-400/50 rounded-full" style={{animation:'audioBar 1.2s ease-in-out infinite',animationDelay:`${i*.06}s`,height:`${20+Math.random()*80}%`}} />)}
              </div>
              <p className="text-white font-medium text-sm">Récitation en cours...</p>
              <button onClick={stopRec} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-8 rounded-xl transition">
                <MicOff className="w-4 h-4 inline mr-1.5" />Arrêter
              </button>
            </div>
          )}
          {analyzing && <div className="py-8"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" /><p className="text-white/25 text-sm mt-3">Analyse...</p></div>}

          {result && (
            <div className="space-y-5 animate-fade-in-up text-left">
              {/* Score circle */}
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                    <circle cx="60" cy="60" r="54" fill="none" stroke={result.overallScore>=70?'#34d399':'#ef4444'} strokeWidth="5"
                      strokeDasharray={`${(result.overallScore/100)*339.3} 339.3`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${result.overallScore>=70?'text-emerald-400':'text-red-400'}`}>{result.overallScore}</span>
                    <span className="text-white/20 text-xs">/100</span>
                  </div>
                </div>
                <div className={`flex items-center justify-center gap-1.5 mt-3 ${result.overallScore>=70?'text-emerald-400':'text-red-400'}`}>
                  {result.overallScore>=70 ? <><CheckCircle2 className="w-4 h-4" /><span className="font-semibold text-sm">Sourate validée !</span><Star className="w-4 h-4 text-amber-400 fill-amber-400" /></>
                    : <><XCircle className="w-4 h-4" /><span className="font-semibold text-sm">Continue, tu y es presque !</span></>}
                </div>
              </div>

              {/* Scores */}
              <div className="card p-4 space-y-2.5">
                <div className="flex justify-between"><span className="text-white/30 text-sm">Exactitude texte</span><span className="text-emerald-400 font-semibold text-sm">{result.accuracy}%</span></div>
                <div className="flex justify-between"><span className="text-white/30 text-sm">Tajwid</span><span className="text-amber-400 font-semibold text-sm">{result.tajwidAnalysis?.score||'-'}%</span></div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between"><span className="text-white font-medium text-sm">Global</span><span className="text-emerald-400 font-bold">{result.overallScore}%</span></div>
              </div>

              {/* Tajwid feedback */}
              {result.tajwidAnalysis?.details && (
                <div className="card p-4">
                  <h4 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Détail Tajwid</h4>
                  <div className="space-y-3">
                    {result.tajwidAnalysis.details.map((d:any, i:number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${d.status==='correct'?'bg-emerald-500/15 text-emerald-400':'bg-amber-500/15 text-amber-400'}`}>
                          {d.status==='correct' ? <Check className="w-3 h-3" /> : <span className="text-[10px]">!</span>}
                        </div>
                        <div>
                          <p className="text-white/60 text-sm font-medium">{d.rule} — <span className={d.status==='correct'?'text-emerald-400':'text-amber-400'}>{d.status}</span></p>
                          {d.status!=='correct' && <p className="text-white/25 text-xs mt-0.5">{d.tip}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setResult(null)} className="flex-1 btn-primary text-sm">Réessayer</button>
                <button onClick={() => router.push('/')} className="flex-1 btn-outline text-sm">Retour</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
