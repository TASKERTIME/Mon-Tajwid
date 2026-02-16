'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuranStore, useUserStore, useProgressStore } from '@/lib/store'
import { fetchVerses, type Verse } from '@/services/quran-api'
import { VoiceRecorder, analyzeRecitation, type RecitationResult } from '@/features/voice-recognition'
import {
  ArrowLeft, Play, Pause, SkipForward, SkipBack, Mic, MicOff,
  Star, CheckCircle2, XCircle, Loader2, Eye, BookOpen, Languages, Type,
} from 'lucide-react'

type ViewMode = 'learn' | 'validate'

export default function SurahPage() {
  const params = useParams()
  const juzId = parseInt(params.juzId as string)
  const surahId = parseInt(params.surahId as string)
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('learn')
  const { displayMode, setDisplayMode, currentVerse, setCurrentVerse, isPlaying, setPlaying } = useQuranStore()
  const { preferredReciter } = useUserStore()
  const { surahProgress } = useProgressStore()
  const isValidated = surahProgress[surahId]?.validated || false
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recitationResult, setRecitationResult] = useState<RecitationResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const recorderRef = useRef<VoiceRecorder | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchVerses(surahId, preferredReciter)
        setVerses(data)
        if (data.length > 0) setCurrentVerse(1)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [surahId, preferredReciter, setCurrentVerse])

  const playVerse = (n: number) => {
    const v = verses.find((v) => v.verse_number === n)
    if (!v?.audio_url || !audioRef.current) return
    setCurrentVerse(n)
    audioRef.current.src = v.audio_url
    audioRef.current.play()
    setPlaying(true)
  }
  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setPlaying(false) }
    else if (currentVerse) playVerse(currentVerse)
  }

  const startRecording = async () => {
    try {
      recorderRef.current = new VoiceRecorder()
      await recorderRef.current.start()
      setIsRecording(true)
      setRecitationResult(null)
    } catch { alert("Impossible d'accéder au microphone.") }
  }

  const stopRecording = async () => {
    if (!recorderRef.current) return
    setIsRecording(false)
    setAnalyzing(true)
    try {
      const result = await recorderRef.current.stop()
      const { blob, duration } = result as any
      const expectedText = verses.map((v) => v.text_uthmani).join(' ')
      const analysisResult = await analyzeRecitation(blob, expectedText, duration)
      setRecitationResult(analysisResult)
    } catch { alert("Erreur lors de l'analyse.") }
    finally { setAnalyzing(false) }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-40">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/quran/${juzId}`} className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <h1 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            Sourate {surahId}
            {isValidated && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
          </h1>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/5 mb-5">
        <button onClick={() => setViewMode('learn')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
            viewMode === 'learn' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'text-white/30'}`}>
          <BookOpen className="w-4 h-4" /> Apprendre
        </button>
        <button onClick={() => setViewMode('validate')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
            viewMode === 'validate' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' : 'text-white/30'}`}>
          <Mic className="w-4 h-4" /> Valider
        </button>
      </div>

      {/* Display mode (learn only) */}
      {viewMode === 'learn' && (
        <div className="flex gap-1 mb-5 p-1 rounded-lg bg-white/[0.02]">
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

      {/* LEARN MODE */}
      {viewMode === 'learn' && (
        <div className="space-y-3">
          {verses.map((v) => (
            <button key={v.verse_number} onClick={() => playVerse(v.verse_number)}
              className={`w-full text-left p-5 rounded-2xl transition-all ${
                currentVerse === v.verse_number ? 'card-v2-active' : 'card-v2 hover:bg-white/[0.04]'}`}>
              <div className="flex items-start justify-between mb-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs text-emerald-400 font-bold">
                  {v.verse_number}
                </span>
                {currentVerse === v.verse_number && isPlaying && (
                  <div className="flex items-end gap-[3px] h-5">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className="w-[3px] bg-emerald-400 rounded-full"
                        style={{ animation: 'audioBar 1s ease-in-out infinite', animationDelay: `${i*0.1}s`, height: '40%' }} />
                    ))}
                  </div>
                )}
              </div>
              {(displayMode === 'arabic' || displayMode === 'all') && (
                <p className="arabic-verse mb-3">{v.text_uthmani}</p>
              )}
              {(displayMode === 'phonetic' || displayMode === 'all') && v.text_transliteration && (
                <p className="text-emerald-200/50 text-sm italic mb-2">{v.text_transliteration}</p>
              )}
              {(displayMode === 'translation' || displayMode === 'all') && (
                <p className="text-white/40 text-sm leading-relaxed">{v.translation_fr}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* VALIDATE MODE */}
      {viewMode === 'validate' && (
        <div className="text-center py-8">
          {!isRecording && !analyzing && !recitationResult && (
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full card-v2 flex items-center justify-center">
                <Mic className="w-10 h-10 text-white/20" />
              </div>
              <div>
                <h2 className="font-heading text-white text-lg mb-2">Prêt à réciter ?</h2>
                <p className="text-white/35 text-sm max-w-xs mx-auto">
                  L&apos;IA vérifiera la précision et le Tajwid.
                </p>
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
                {Array.from({length:20}).map((_,i) => (
                  <div key={i} className="w-1 bg-red-400/60 rounded-full" style={{ animation:'audioBar 1.2s ease-in-out infinite', animationDelay:`${i*0.06}s`, height:`${20+Math.random()*80}%` }}/>
                ))}
              </div>
              <p className="text-white font-medium">Récitation en cours...</p>
              <button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-xl transition">
                <MicOff className="w-4 h-4 inline mr-2" /> Arrêter
              </button>
            </div>
          )}
          {analyzing && (
            <div className="space-y-4 py-8">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
              <p className="text-white/40">Analyse en cours...</p>
            </div>
          )}
          {recitationResult && <ResultView result={recitationResult} onRetry={() => setRecitationResult(null)} />}
        </div>
      )}

      {/* Audio bar */}
      {viewMode === 'learn' && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/5 z-50">
          <div className="max-w-lg mx-auto flex items-center justify-center gap-8 py-4">
            <button onClick={() => currentVerse && currentVerse > 1 && playVerse(currentVerse-1)} className="text-white/25 hover:text-white/50">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={togglePlay} className="w-14 h-14 rounded-full btn-emerald flex items-center justify-center">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button onClick={() => currentVerse && currentVerse < verses.length && playVerse(currentVerse+1)} className="text-white/25 hover:text-white/50">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-white/20 text-xs pb-3">Verset {currentVerse || '–'} / {verses.length}</p>
        </div>
      )}

      <audio ref={audioRef}
        onEnded={() => { setPlaying(false); if (currentVerse && currentVerse < verses.length) setTimeout(() => playVerse(currentVerse+1), 500) }} />
    </div>
  )
}

function ResultView({ result, onRetry }: { result: RecitationResult; onRetry: () => void }) {
  const passed = result.overallScore >= 70
  return (
    <div className="space-y-6">
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={passed ? '#34d399' : '#ef4444'} strokeWidth="6"
            strokeDasharray={`${(result.overallScore/100)*339.3} 339.3`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>{result.overallScore}</span>
          <span className="text-white/30 text-xs">/100</span>
        </div>
      </div>
      {passed ? (
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
        <div className="flex justify-between"><span className="text-white/40 text-sm">Exactitude</span><span className="text-emerald-400 font-semibold">{result.accuracy}%</span></div>
        <div className="flex justify-between"><span className="text-white/40 text-sm">Tajwid</span><span className="text-amber-400 font-semibold">{result.tajwidAnalysis.score}%</span></div>
        <div className="h-px bg-white/5" />
        <div className="flex justify-between"><span className="text-white font-medium text-sm">Global</span><span className="text-emerald-400 font-bold text-lg">{result.overallScore}%</span></div>
      </div>
      <button onClick={onRetry} className="btn-emerald w-full">Réessayer</button>
    </div>
  )
}
