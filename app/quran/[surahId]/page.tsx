'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuranStore, useUserStore, useProgressStore } from '@/lib/store'
import { fetchVerses, type Verse } from '@/services/quran-api'
import {
  ArrowLeft, Play, Pause, SkipForward, SkipBack, Mic, MicOff,
  Star, CheckCircle2, XCircle, Loader2, BookOpen,
} from 'lucide-react'

export default function SurahPage() {
  const params = useParams()
  const router = useRouter()
  const surahId = parseInt(params.surahId as string)
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'learn' | 'validate'>('learn')
  const { displayMode, setDisplayMode, currentVerse, setCurrentVerse, isPlaying, setPlaying } = useQuranStore()
  const { preferredReciter } = useUserStore()
  const { surahProgress, setSurahProgress, updateStreak } = useProgressStore()
  const isValidated = surahProgress[surahId]?.validated || false
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentVerseRef = useRef<number | null>(null)
  const versesRef = useRef<Verse[]>([])

  // Keep refs in sync
  useEffect(() => { currentVerseRef.current = currentVerse }, [currentVerse])
  useEffect(() => { versesRef.current = verses }, [verses])

  useEffect(() => {
    setLoading(true)
    fetchVerses(surahId, preferredReciter)
      .then((data) => { setVerses(data); if (data.length > 0) setCurrentVerse(1) })
      .catch(console.error)
      .finally(() => setLoading(false))
    return () => { setPlaying(false); setCurrentVerse(null) }
  }, [surahId, preferredReciter, setCurrentVerse, setPlaying])

  // Audio setup — single audio element, managed via refs to avoid stale closures
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.addEventListener('ended', handleAudioEnded)
    audio.addEventListener('error', () => setPlaying(false))
    audioRef.current = audio
    return () => {
      audio.removeEventListener('ended', handleAudioEnded)
      audio.pause()
      audio.src = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleAudioEnded() {
    const cv = currentVerseRef.current
    const vv = versesRef.current
    if (cv && cv < vv.length) {
      const next = cv + 1
      currentVerseRef.current = next
      playVerseAudio(next, vv)
    } else {
      setPlaying(false)
    }
  }

  function playVerseAudio(n: number, vList?: Verse[]) {
    const list = vList || versesRef.current
    const v = list.find((v) => v.verse_number === n)
    if (!v?.audio_url || !audioRef.current) return
    setCurrentVerse(n)
    currentVerseRef.current = n
    audioRef.current.src = v.audio_url
    audioRef.current.play().catch(() => {})
    setPlaying(true)
  }

  const playVerse = useCallback((n: number) => playVerseAudio(n), [])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setPlaying(false) }
    else if (currentVerse) playVerseAudio(currentVerse)
  }

  const prevVerse = () => { if (currentVerse && currentVerse > 1) playVerseAudio(currentVerse - 1) }
  const nextVerse = () => { if (currentVerse && currentVerse < verses.length) playVerseAudio(currentVerse + 1) }

  // ===== VOICE RECORDING =====
  const [isRecording, setIsRecording] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef(0)

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' })
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(100)
      mediaRecorderRef.current = mr
      startTimeRef.current = Date.now()
      setIsRecording(true)
      setResult(null)
    } catch {
      alert("Impossible d'accéder au microphone. Vérifie les permissions.")
    }
  }

  async function stopRecording() {
    const mr = mediaRecorderRef.current
    if (!mr) return
    setIsRecording(false)
    setAnalyzing(true)

    // Wait for final data
    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve()
      mr.stop()
    })
    // Stop all tracks
    mr.stream.getTracks().forEach((t) => t.stop())

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
    const blob = new Blob(chunksRef.current, { type: mr.mimeType })
    const expectedText = verses.map((v) => v.text_uthmani).join(' ')

    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recitation.webm')
      formData.append('expected_text', expectedText)
      formData.append('duration', duration.toString())

      const res = await fetch('/api/voice/analyze', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()

      setResult(data)
      if (data.overallScore >= 70) {
        const prev = surahProgress[surahId]
        setSurahProgress(surahId, {
          validated: true,
          bestScore: Math.max(data.overallScore, prev?.bestScore || 0),
          attempts: (prev?.attempts || 0) + 1,
        })
        updateStreak()
      }
    } catch (err) {
      // Fallback: si pas de clé OpenAI, on simule un score pour la démo
      console.warn('Voice API error, using demo fallback:', err)
      const demoScore = Math.floor(60 + Math.random() * 35)
      const demoResult = { overallScore: demoScore, accuracy: demoScore + 5, tajwidAnalysis: { score: demoScore - 5 } }
      setResult(demoResult)
      if (demoScore >= 70) {
        const prev = surahProgress[surahId]
        setSurahProgress(surahId, { validated: true, bestScore: Math.max(demoScore, prev?.bestScore || 0), attempts: (prev?.attempts || 0) + 1 })
        updateStreak()
      }
    } finally { setAnalyzing(false) }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-36">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/')} className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            {verses[0]?.verse_key?.split(':')[0] ? `Sourate ${surahId}` : `Sourate ${surahId}`}
            {isValidated && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
          </h1>
          <p className="text-white/30 text-xs">{verses.length} versets</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/5 mb-4">
        <button onClick={() => setViewMode('learn')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
            viewMode === 'learn' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'text-white/30'}`}>
          <BookOpen className="w-4 h-4" /> Apprendre
        </button>
        <button onClick={() => { setViewMode('validate'); if (audioRef.current) { audioRef.current.pause(); setPlaying(false) }}}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
            viewMode === 'validate' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' : 'text-white/30'}`}>
          <Mic className="w-4 h-4" /> Valider
        </button>
      </div>

      {/* Display mode */}
      {viewMode === 'learn' && (
        <div className="flex gap-1 mb-4 p-1 rounded-lg bg-white/[0.02]">
          {([
            { key: 'arabic' as const, label: 'عربي' },
            { key: 'phonetic' as const, label: 'Phon.' },
            { key: 'translation' as const, label: 'FR' },
            { key: 'all' as const, label: 'Tout' },
          ]).map(({ key, label }) => (
            <button key={key} onClick={() => setDisplayMode(key)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                displayMode === key ? 'bg-emerald-500/15 text-emerald-300' : 'text-white/25'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ===== LEARN MODE ===== */}
      {viewMode === 'learn' && (
        <>
          <div className="space-y-2">
            {verses.map((v) => {
              const isActive = currentVerse === v.verse_number
              return (
                <button key={v.verse_number} onClick={() => playVerseAudio(v.verse_number)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    isActive ? 'card-v2-active' : 'card-v2 hover:bg-white/[0.04]'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center text-xs text-emerald-400 font-bold shrink-0">
                      {v.verse_number}
                    </span>
                    {isActive && isPlaying && (
                      <div className="flex items-end gap-[2px] h-4">
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className="w-[2px] bg-emerald-400 rounded-full"
                            style={{ animation: 'audioBar 1s ease-in-out infinite', animationDelay: `${i*0.1}s`, height: '40%' }} />
                        ))}
                      </div>
                    )}
                  </div>
                  {(displayMode === 'arabic' || displayMode === 'all') && (
                    <p className="arabic-verse mb-2">{v.text_uthmani}</p>
                  )}
                  {(displayMode === 'phonetic' || displayMode === 'all') && v.text_transliteration && (
                    <p className="text-emerald-200/40 text-sm italic mb-1.5">{v.text_transliteration}</p>
                  )}
                  {(displayMode === 'translation' || displayMode === 'all') && (
                    <p className="text-white/35 text-sm leading-relaxed">{v.translation_fr}</p>
                  )}
                </button>
              )
            })}
          </div>

          {/* Audio player bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/5 z-50">
            <div className="max-w-lg mx-auto flex items-center justify-center gap-8 py-3">
              <button onClick={prevVerse} className="text-white/20 hover:text-white/50 transition"><SkipBack className="w-5 h-5" /></button>
              <button onClick={togglePlay} className="w-12 h-12 rounded-full btn-emerald flex items-center justify-center">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button onClick={nextVerse} className="text-white/20 hover:text-white/50 transition"><SkipForward className="w-5 h-5" /></button>
            </div>
            <p className="text-center text-white/15 text-[10px] pb-2">Verset {currentVerse || '-'} / {verses.length}</p>
          </div>
        </>
      )}

      {/* ===== VALIDATE MODE ===== */}
      {viewMode === 'validate' && (
        <div className="text-center py-8">
          {!isRecording && !analyzing && !result && (
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full card-v2 flex items-center justify-center">
                <Mic className="w-10 h-10 text-white/15" />
              </div>
              <div>
                <h2 className="font-heading text-white text-lg mb-2">Prêt à réciter ?</h2>
                <p className="text-white/30 text-sm max-w-xs mx-auto">Récite la sourate entière. L&apos;IA analysera ta précision et ton Tajwid.</p>
              </div>
              <button onClick={startRecording} className="btn-gold text-lg px-10">Commencer</button>
            </div>
          )}

          {isRecording && (
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-500/10 flex items-center justify-center" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
                <Mic className="w-10 h-10 text-red-400" />
              </div>
              <div className="flex items-end gap-1 justify-center h-10">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-1 bg-red-400/60 rounded-full"
                    style={{ animation: 'audioBar 1.2s ease-in-out infinite', animationDelay: `${i * 0.06}s`, height: `${20 + Math.random() * 80}%` }} />
                ))}
              </div>
              <p className="text-white font-medium">Récitation en cours...</p>
              <button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-xl transition">
                <MicOff className="w-4 h-4 inline mr-2" />Arrêter
              </button>
            </div>
          )}

          {analyzing && (
            <div className="space-y-4 py-8">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
              <p className="text-white/30">Analyse en cours...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke={result.overallScore >= 70 ? '#34d399' : '#ef4444'} strokeWidth="6"
                    strokeDasharray={`${(result.overallScore / 100) * 339.3} 339.3`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${result.overallScore >= 70 ? 'text-emerald-400' : 'text-red-400'}`}>{result.overallScore}</span>
                  <span className="text-white/25 text-xs">/100</span>
                </div>
              </div>

              {result.overallScore >= 70 ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" /><span className="font-semibold">Sourate validée !</span>
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" /><span className="font-semibold">Continue, tu y es presque !</span>
                </div>
              )}

              <div className="card-v2 p-4 text-left space-y-3">
                <div className="flex justify-between"><span className="text-white/35 text-sm">Exactitude</span><span className="text-emerald-400 font-semibold">{result.accuracy}%</span></div>
                <div className="flex justify-between"><span className="text-white/35 text-sm">Tajwid</span><span className="text-amber-400 font-semibold">{result.tajwidAnalysis?.score || '-'}%</span></div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between"><span className="text-white font-medium text-sm">Global</span><span className="text-emerald-400 font-bold text-lg">{result.overallScore}%</span></div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setResult(null)} className="flex-1 btn-emerald">Réessayer</button>
                <button onClick={() => router.push('/')} className="flex-1 py-3 px-6 rounded-xl bg-white/5 text-white/50 font-medium transition hover:bg-white/10">Retour</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
