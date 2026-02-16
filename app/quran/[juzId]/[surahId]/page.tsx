'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuranStore, useUserStore, useProgressStore } from '@/lib/store'
import { fetchVerses, type Verse } from '@/services/quran-api'
import { VoiceRecorder, analyzeRecitation, type RecitationResult } from '@/features/voice-recognition'
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Mic,
  MicOff,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  BookOpen,
  Languages,
  Type,
} from 'lucide-react'

type ViewMode = 'learn' | 'validate'

export default function SurahPage() {
  const params = useParams()
  const juzId = parseInt(params.juzId as string)
  const surahId = parseInt(params.surahId as string)

  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('learn')

  const { displayMode, setDisplayMode, currentVerse, setCurrentVerse, isPlaying, setPlaying } =
    useQuranStore()
  const { preferredReciter } = useUserStore()
  const { surahProgress } = useProgressStore()
  const isValidated = surahProgress[surahId]?.validated || false

  // Audio
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioLoading, setAudioLoading] = useState(false)

  // Validation mode state
  const [isRecording, setIsRecording] = useState(false)
  const [recitationResult, setRecitationResult] = useState<RecitationResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const recorderRef = useRef<VoiceRecorder | null>(null)

  // Load verses
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchVerses(surahId, preferredReciter)
        setVerses(data)
        if (data.length > 0) setCurrentVerse(1)
      } catch (err) {
        console.error('Failed to load verses:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [surahId, preferredReciter, setCurrentVerse])

  // Audio controls
  const playVerse = (verseNum: number) => {
    const verse = verses.find((v) => v.verse_number === verseNum)
    if (!verse?.audio_url || !audioRef.current) return
    setCurrentVerse(verseNum)
    audioRef.current.src = verse.audio_url
    audioRef.current.play()
    setPlaying(true)
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setPlaying(false)
    } else if (currentVerse) {
      playVerse(currentVerse)
    }
  }

  const nextVerse = () => {
    if (currentVerse && currentVerse < verses.length) playVerse(currentVerse + 1)
  }

  const prevVerse = () => {
    if (currentVerse && currentVerse > 1) playVerse(currentVerse - 1)
  }

  // Voice recording
  const startRecording = async () => {
    try {
      recorderRef.current = new VoiceRecorder()
      await recorderRef.current.start()
      setIsRecording(true)
      setRecitationResult(null)
    } catch (err) {
      console.error('Microphone error:', err)
      alert("Impossible d'accéder au microphone. Vérifie les permissions.")
    }
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
    } catch (err) {
      console.error('Analysis error:', err)
      alert("Erreur lors de l'analyse. Réessaie.")
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-sacred-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-40">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/quran/${juzId}`} className="p-2 rounded-xl bg-night-800 hover:bg-night-700 transition">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <h1 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            Sourate {surahId}
            {isValidated && <Star className="w-5 h-5 text-gold-400 fill-gold-400" />}
          </h1>
        </div>
      </div>

      {/* Mode toggle: Apprendre / Valider */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('learn')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            viewMode === 'learn'
              ? 'bg-sacred-500 text-white shadow-lg shadow-sacred-500/20'
              : 'bg-night-800 text-night-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-1.5" />
          Apprendre
        </button>
        <button
          onClick={() => setViewMode('validate')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            viewMode === 'validate'
              ? 'bg-gold-400 text-night-900 shadow-lg shadow-gold-400/20'
              : 'bg-night-800 text-night-400 hover:text-white'
          }`}
        >
          <Mic className="w-4 h-4 inline mr-1.5" />
          Valider
        </button>
      </div>

      {/* Display mode selector (learn only) */}
      {viewMode === 'learn' && (
        <div className="flex gap-1.5 mb-6 bg-night-800/50 p-1 rounded-xl">
          {[
            { mode: 'arabic' as const, icon: <Type className="w-3.5 h-3.5" />, label: 'عربي' },
            { mode: 'phonetic' as const, icon: <Languages className="w-3.5 h-3.5" />, label: 'Phon.' },
            { mode: 'translation' as const, icon: <BookOpen className="w-3.5 h-3.5" />, label: 'FR' },
            { mode: 'all' as const, icon: <Eye className="w-3.5 h-3.5" />, label: 'Tout' },
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setDisplayMode(mode)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${
                displayMode === mode
                  ? 'bg-sacred-500/20 text-sacred-400'
                  : 'text-night-500 hover:text-night-300'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      )}

      {/* ===================== LEARN MODE ===================== */}
      {viewMode === 'learn' && (
        <div className="space-y-4">
          {verses.map((verse) => (
            <div
              key={verse.verse_number}
              onClick={() => playVerse(verse.verse_number)}
              className={`card-sacred p-5 cursor-pointer transition-all ${
                currentVerse === verse.verse_number
                  ? 'glow-border bg-night-800/80'
                  : 'hover:bg-night-800/40'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="w-7 h-7 rounded-full bg-sacred-500/20 flex items-center justify-center text-xs text-sacred-400 font-semibold">
                  {verse.verse_number}
                </span>
              </div>

              {/* Arabic */}
              {(displayMode === 'arabic' || displayMode === 'all') && (
                <p className="arabic-verse mb-3">{verse.text_uthmani}</p>
              )}

              {/* Phonetic */}
              {(displayMode === 'phonetic' || displayMode === 'all') && verse.text_transliteration && (
                <p className="text-sacred-300/70 text-sm italic mb-2">{verse.text_transliteration}</p>
              )}

              {/* French translation */}
              {(displayMode === 'translation' || displayMode === 'all') && (
                <p className="text-night-300 text-sm leading-relaxed">{verse.translation_fr}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===================== VALIDATE MODE ===================== */}
      {viewMode === 'validate' && (
        <div className="text-center py-8">
          {/* Ready state */}
          {!isRecording && !analyzing && !recitationResult && (
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-night-800 flex items-center justify-center">
                <Mic className="w-10 h-10 text-night-500" />
              </div>
              <div>
                <h2 className="text-white font-heading text-lg mb-2">Prêt à réciter ?</h2>
                <p className="text-night-400 text-sm max-w-xs mx-auto">
                  Récite la sourate entière. L&apos;IA vérifiera l&apos;exactitude et le respect du Tajwid.
                </p>
              </div>
              <button onClick={startRecording} className="btn-gold text-lg px-10">
                Commencer
              </button>
            </div>
          )}

          {/* Recording state */}
          {isRecording && (
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-500/20 flex items-center justify-center animate-glow-pulse">
                <Mic className="w-10 h-10 text-red-400" />
              </div>
              <div className="audio-wave mx-auto justify-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} />
                ))}
              </div>
              <p className="text-white font-semibold">Récitation en cours...</p>
              <button
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-xl transition"
              >
                <MicOff className="w-4 h-4 inline mr-2" />
                Arrêter
              </button>
            </div>
          )}

          {/* Analyzing state */}
          {analyzing && (
            <div className="space-y-4 py-8">
              <Loader2 className="w-10 h-10 text-sacred-400 animate-spin mx-auto" />
              <p className="text-night-300">Analyse en cours...</p>
            </div>
          )}

          {/* Result state */}
          {recitationResult && (
            <ResultView result={recitationResult} onRetry={() => setRecitationResult(null)} />
          )}
        </div>
      )}

      {/* Audio player bar (learn mode) */}
      {viewMode === 'learn' && (
        <div className="fixed bottom-0 left-0 right-0 bg-night-900/95 backdrop-blur-lg border-t border-night-700/50 px-4 py-4 z-50">
          <div className="max-w-lg mx-auto flex items-center justify-center gap-6">
            <button onClick={prevVerse} className="p-2 text-night-400 hover:text-white transition">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-sacred-500 hover:bg-sacred-600 flex items-center justify-center transition shadow-lg shadow-sacred-500/30"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-0.5" />
              )}
            </button>
            <button onClick={nextVerse} className="p-2 text-night-400 hover:text-white transition">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-night-500 text-xs mt-2">
            Verset {currentVerse || '–'} / {verses.length}
          </p>
        </div>
      )}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setPlaying(false)
          if (currentVerse && currentVerse < verses.length) {
            setTimeout(() => playVerse(currentVerse + 1), 500)
          }
        }}
        onLoadStart={() => setAudioLoading(true)}
        onCanPlay={() => setAudioLoading(false)}
      />
    </div>
  )
}

/* ===================== RESULT COMPONENT ===================== */
function ResultView({ result, onRetry }: { result: RecitationResult; onRetry: () => void }) {
  const passed = result.overallScore >= 70

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Score circle */}
      <div
        className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center ${
          passed ? 'bg-sacred-500/20' : 'bg-red-500/20'
        }`}
      >
        <div className="text-center">
          <span className={`text-3xl font-bold ${passed ? 'text-sacred-400' : 'text-red-400'}`}>
            {result.overallScore}
          </span>
          <span className={`text-sm block ${passed ? 'text-sacred-500' : 'text-red-500'}`}>/ 100</span>
        </div>
      </div>

      {/* Status message */}
      {passed ? (
        <div className="flex items-center justify-center gap-2 text-sacred-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold">Sourate validée !</span>
          <Star className="w-5 h-5 text-gold-400 fill-gold-400 animate-star-pop" />
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-red-400">
          <XCircle className="w-5 h-5" />
          <span className="font-semibold">Pas encore... Continue !</span>
        </div>
      )}

      {/* Score breakdown */}
      <div className="card-sacred p-4 text-left space-y-3">
        <ScoreRow label="Exactitude du texte" value={result.accuracy} />
        <ScoreRow label="Tajwid" value={result.tajwidAnalysis.score} />
        <div className="divider-geometric !my-2" />
        <ScoreRow label="Score global" value={result.overallScore} bold />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onRetry} className="flex-1 btn-primary">
          Réessayer
        </button>
      </div>
    </div>
  )
}

function ScoreRow({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  const color = value >= 80 ? 'text-sacred-400' : value >= 60 ? 'text-gold-400' : 'text-red-400'
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'text-white font-semibold' : 'text-night-300'}`}>{label}</span>
      <span className={`font-semibold ${color} ${bold ? 'text-lg' : ''}`}>{value}%</span>
    </div>
  )
}
