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
  const { surahId: sid } = useParams()
  const router = useRouter()
  const surahId = parseInt(sid as string)
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'learn'|'validate'>('learn')
  const { displayMode, setDisplay, currentVerse, setVerse, isPlaying, setPlaying } = useUIStore()
  const { preferredReciter } = useAuthStore()
  const { surahProgress, setSurahProgress, updateStreak, bookmarks, setBookmark, removeBookmark } = useProgressStore()
  const val = surahProgress[surahId]?.validated||false
  const hasBm = bookmarks[surahId]!==undefined
  const audioRef = useRef<HTMLAudioElement|null>(null)
  const cvRef = useRef<number|null>(null)
  const vRef = useRef<Verse[]>([])

  useEffect(()=>{cvRef.current=currentVerse},[currentVerse])
  useEffect(()=>{vRef.current=verses},[verses])

  useEffect(()=>{
    setLoading(true)
    fetchVerses(surahId, preferredReciter)
      .then(d=>{setVerses(d); setVerse(bookmarks[surahId]||(d.length>0?1:null))})
      .catch(console.error).finally(()=>setLoading(false))
    return()=>{setPlaying(false);setVerse(null)}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[surahId, preferredReciter])

  // Single audio element — refs prevent stale closures
  useEffect(()=>{
    const a=new Audio(); a.preload='auto'
    const onEnd=()=>{
      const cv=cvRef.current; const vv=vRef.current
      if(cv&&cv<vv.length) play(cv+1,vv); else setPlaying(false)
    }
    a.addEventListener('ended',onEnd)
    a.addEventListener('error',()=>setPlaying(false))
    audioRef.current=a
    return()=>{a.removeEventListener('ended',onEnd);a.pause();a.src=''}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  function play(n:number, list?:Verse[]) {
    const vv=list||vRef.current
    const v=vv.find(v=>v.verse_number===n)
    if(!v?.audio_url||!audioRef.current)return
    setVerse(n); cvRef.current=n
    audioRef.current.src=v.audio_url
    audioRef.current.play().catch(()=>{})
    setPlaying(true)
    setBookmark(surahId,n)
  }
  const toggle=()=>{if(!audioRef.current)return;if(isPlaying){audioRef.current.pause();setPlaying(false)}else if(currentVerse)play(currentVerse)}

  // Voice
  const [isRec, setIsRec] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const mrRef = useRef<MediaRecorder|null>(null)
  const chunks = useRef<Blob[]>([])
  const t0 = useRef(0)

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true})
      const mr = new MediaRecorder(stream, {mimeType: MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':'audio/mp4'})
      chunks.current=[]
      mr.ondataavailable=e=>{if(e.data.size>0)chunks.current.push(e.data)}
      mr.start(100); mrRef.current=mr; t0.current=Date.now(); setIsRec(true); setResult(null)
    } catch { alert("Microphone non disponible. Vérifie les permissions dans ton navigateur.") }
  }

  async function stopRec() {
    const mr=mrRef.current; if(!mr)return; setIsRec(false); setAnalyzing(true)
    await new Promise<void>(r=>{mr.onstop=()=>r();mr.stop()})
    mr.stream.getTracks().forEach(t=>t.stop())
    const dur=Math.round((Date.now()-t0.current)/1000)
    const blob=new Blob(chunks.current,{type:mr.mimeType})
    const expected=verses.map(v=>v.text_uthmani).join(' ')

    try {
      const fd=new FormData(); fd.append('audio',blob,'rec.webm'); fd.append('expected_text',expected); fd.append('duration',String(dur))
      const res=await fetch('/api/voice/analyze',{method:'POST',body:fd})
      const data=await res.json()
      if (!res.ok) {
        if (data.error === 'NO_API_KEY') throw { message: 'NO_API_KEY', status: 503 }
        throw new Error(data.error || 'Erreur')
      }
      finishResult(data)
    } catch (err: any) {
      // Check if it's a NO_API_KEY error
      if (err?.message === 'NO_API_KEY' || err?.status === 503) {
        setResult({ error: 'NO_API_KEY' })
      } else {
        setResult({ error: 'ANALYSIS_FAILED' })
      }
    } finally { setAnalyzing(false) }
  }

  function finishResult(data:any) {
    setResult(data)
    // Seuil minimum 30% pour ne pas induire en erreur
    // Validation à 70%+
    if (data.overallScore >= 70) {
      const prev=surahProgress[surahId]
      setSurahProgress(surahId,{validated:true,bestScore:Math.max(data.overallScore,prev?.bestScore||0),attempts:(prev?.attempts||0)+1})
      updateStreak(); removeBookmark(surahId)
    }
  }

  if(loading) return <div className="flex justify-center items-center min-h-dvh"><Loader2 className="w-6 h-6 text-[#34d399] animate-spin" /></div>

  return (
    <div className="max-w-lg mx-auto px-4 py-5 pb-36">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={()=>router.push('/')} className="p-2.5 rounded-xl glass hover:bg-white/[0.05] transition"><ArrowLeft className="w-5 h-5 text-white/60" /></button>
        <div className="flex-1">
          <h1 className="heading text-lg font-bold text-white flex items-center gap-2">Sourate {surahId}{val&&<Star className="w-4 h-4 text-[#c9a84c] fill-[#c9a84c]"/>}</h1>
          <p className="text-white/20 text-xs">{verses.length} versets</p>
        </div>
        <button onClick={()=>hasBm?removeBookmark(surahId):setBookmark(surahId,currentVerse||1)}
          className={`p-2.5 rounded-xl transition ${hasBm?'glass-active':'glass'}`}>
          {hasBm?<BookmarkCheck className="w-5 h-5 text-[#34d399]"/>:<Bookmark className="w-5 h-5 text-white/15"/>}
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 glass rounded-2xl mb-5">
        <button onClick={()=>setMode('learn')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5 ${mode==='learn'?'bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/15':'text-white/20'}`}>
          <BookOpen className="w-3.5 h-3.5"/>Apprendre</button>
        <button onClick={()=>{setMode('validate');audioRef.current?.pause();setPlaying(false)}} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5 ${mode==='validate'?'bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/15':'text-white/20'}`}>
          <Mic className="w-3.5 h-3.5"/>Valider</button>
      </div>

      {mode==='learn' && (
        <div className="flex gap-1 mb-4 p-0.5 rounded-xl bg-white/[0.015]">
          {([{k:'arabic' as const,l:'عربي'},{k:'phonetic' as const,l:'Phon.'},{k:'translation' as const,l:'FR'},{k:'all' as const,l:'Tout'}]).map(({k,l})=>(
            <button key={k} onClick={()=>setDisplay(k)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${displayMode===k?'bg-[#34d399]/8 text-[#34d399]':'text-white/15'}`}>{l}</button>
          ))}
        </div>
      )}

      {/* LEARN MODE */}
      {mode==='learn' && <>
        <div className="space-y-1.5">
          {verses.map(v=>{
            const active=currentVerse===v.verse_number
            return (
              <button key={v.verse_number} onClick={()=>play(v.verse_number)}
                className={`w-full text-left p-4 rounded-2xl transition ${active?'glass-active':'glass hover:bg-white/[0.04]'}`}>
                <div className="flex items-start justify-between mb-2">
                  <span className="w-7 h-7 rounded-lg bg-[#34d399]/8 flex items-center justify-center text-[11px] text-[#34d399] font-bold">{v.verse_number}</span>
                  {active&&isPlaying&&<div className="flex items-end gap-[2px] h-4">
                    {[1,2,3,4,5].map(i=><div key={i} className="w-[2px] bg-[#34d399] rounded-full" style={{animation:'bars 1s ease-in-out infinite',animationDelay:`${i*.1}s`,height:'40%'}}/>)}
                  </div>}
                </div>
                {(displayMode==='arabic'||displayMode==='all')&&<p className="arabic-verse mb-2">{v.text_uthmani}</p>}
                {(displayMode==='phonetic'||displayMode==='all')&&v.text_transliteration&&<p className="text-[#34d399]/25 text-sm italic mb-1">{v.text_transliteration}</p>}
                {(displayMode==='translation'||displayMode==='all')&&<p className="text-white/25 text-[13px] leading-relaxed">{v.translation_fr}</p>}
              </button>
            )
          })}
        </div>

        {/* Audio controls */}
        <div className="fixed bottom-0 inset-x-0 z-50 safe-b" style={{background:'linear-gradient(to top, #080d1a 85%, transparent)'}}>
          <div className="max-w-lg mx-auto pb-3 pt-2 px-4">
            <div className="glass rounded-2xl flex items-center justify-center gap-8 py-3 px-6">
              <button onClick={()=>currentVerse&&currentVerse>1&&play(currentVerse-1)} className="text-white/12 hover:text-white/30 transition"><SkipBack className="w-5 h-5"/></button>
              <button onClick={toggle} className="w-12 h-12 rounded-full btn-primary flex items-center justify-center">
                {isPlaying?<Pause className="w-5 h-5"/>:<Play className="w-5 h-5 ml-0.5"/>}
              </button>
              <button onClick={()=>currentVerse&&currentVerse<verses.length&&play(currentVerse+1)} className="text-white/12 hover:text-white/30 transition"><SkipForward className="w-5 h-5"/></button>
            </div>
            <p className="text-center text-white/8 text-[10px] mt-1.5">Verset {currentVerse||'-'} / {verses.length}</p>
          </div>
        </div>
      </>}

      {/* VALIDATE MODE */}
      {mode==='validate' && (
        <div className="text-center py-6">
          {!isRec&&!analyzing&&!result&&(
            <div className="space-y-6 anim-fade-up">
              <div className="w-24 h-24 mx-auto rounded-full glass flex items-center justify-center"><Mic className="w-10 h-10 text-white/8"/></div>
              <div><h2 className="heading text-white text-xl font-semibold mb-2">Prêt à réciter ?</h2>
                <p className="text-white/25 text-sm max-w-[260px] mx-auto">Récite la sourate. L&apos;IA analysera ta prononciation et ton Tajwid.</p></div>
              <button onClick={startRec} className="btn-gold text-[15px] px-12">Commencer</button>
            </div>
          )}
          {isRec&&(
            <div className="space-y-6 anim-fade-up">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-500/8 flex items-center justify-center" style={{animation:'glow 2s ease-in-out infinite'}}><Mic className="w-10 h-10 text-red-400"/></div>
              <div className="flex items-end gap-1 justify-center h-8">
                {Array.from({length:24}).map((_,i)=><div key={i} className="w-[3px] bg-red-400/40 rounded-full" style={{animation:'bars 1.2s ease-in-out infinite',animationDelay:`${i*.05}s`,height:`${20+Math.random()*80}%`}}/>)}
              </div>
              <p className="text-white text-sm font-medium">Récitation en cours...</p>
              <button onClick={stopRec} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-xl transition inline-flex items-center gap-2">
                <MicOff className="w-4 h-4"/>Arrêter
              </button>
            </div>
          )}
          {analyzing&&<div className="py-12 anim-fade-in"><Loader2 className="w-8 h-8 text-[#34d399] animate-spin mx-auto"/><p className="text-white/20 text-sm mt-4">Analyse en cours...</p></div>}

          {result&&(
            <div className="text-left space-y-5 anim-fade-up">
              {/* Error state — no API key */}
              {result.error === 'NO_API_KEY' && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#c9a84c]/8 flex items-center justify-center mb-4">
                    <Mic className="w-8 h-8 text-[#c9a84c]" />
                  </div>
                  <h3 className="heading text-lg font-bold text-white mb-2">Reconnaissance vocale IA</h3>
                  <p className="text-white/30 text-sm leading-relaxed mb-2">La clé API OpenAI n&apos;est pas encore configurée. La reconnaissance vocale nécessite un compte OpenAI (Whisper) pour transcrire et analyser ta récitation.</p>
                  <p className="text-white/15 text-xs mb-5">Ajoute la variable <code className="text-[#c9a84c]/50">OPENAI_API_KEY</code> dans Vercel pour activer cette fonctionnalité.</p>
                  <button onClick={()=>setResult(null)} className="btn-primary text-sm">Compris</button>
                </div>
              )}

              {/* Error state — analysis failed */}
              {result.error === 'ANALYSIS_FAILED' && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-500/8 flex items-center justify-center mb-4">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="heading text-lg font-bold text-white mb-2">Erreur d&apos;analyse</h3>
                  <p className="text-white/30 text-sm mb-5">Impossible d&apos;analyser ta récitation. Vérifie ton micro et réessaie.</p>
                  <button onClick={()=>setResult(null)} className="btn-primary text-sm">Réessayer</button>
                </div>
              )}

              {/* Real score result */}
              {!result.error && <>
              {/* Score */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="5"/>
                    <circle cx="60" cy="60" r="54" fill="none" stroke={result.overallScore>=70?'#34d399':result.overallScore>=30?'#c9a84c':'#ef4444'} strokeWidth="5"
                      strokeDasharray={`${(result.overallScore/100)*339.3} 339.3`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold heading ${result.overallScore>=70?'text-[#34d399]':result.overallScore>=30?'text-[#c9a84c]':'text-red-400'}`}>{result.overallScore}</span>
                    <span className="text-white/15 text-xs">/100</span>
                  </div>
                </div>

                {/* Score < 30% = rejet */}
                {result.overallScore < 30 && (
                  <div className="mt-3 bg-red-500/8 border border-red-500/10 rounded-xl p-3">
                    <div className="flex items-center justify-center gap-2 text-red-400 mb-1">
                      <XCircle className="w-5 h-5" /><span className="font-semibold text-sm">Récitation insuffisante</span>
                    </div>
                    <p className="text-red-400/50 text-xs leading-relaxed">Score en dessous de 30%. Réécoute la sourate en mode Apprendre avant de réessayer. Chaque mot compte pour ne pas induire en erreur pendant la prière.</p>
                  </div>
                )}

                {/* 30-69% = encouragement */}
                {result.overallScore >= 30 && result.overallScore < 70 && (
                  <div className="flex items-center justify-center gap-2 mt-3 text-[#c9a84c]">
                    <span className="font-semibold">Continue, tu y es presque !</span>
                  </div>
                )}

                {/* 70%+ = validé */}
                {result.overallScore >= 70 && (
                  <div className="flex items-center justify-center gap-2 mt-3 text-[#34d399]">
                    <CheckCircle2 className="w-5 h-5"/><span className="font-semibold">Sourate validée !</span><Star className="w-5 h-5 text-[#c9a84c] fill-[#c9a84c]"/>
                  </div>
                )}
              </div>

              {/* Scores breakdown */}
              <div className="glass p-4 space-y-3">
                <div className="flex justify-between"><span className="text-white/25 text-sm">Prononciation</span><span className="text-[#34d399] font-bold">{result.accuracy}%</span></div>
                <div className="flex justify-between"><span className="text-white/25 text-sm">Tajwid</span><span className="text-[#c9a84c] font-bold">{result.tajwidAnalysis?.score||'-'}%</span></div>
                <div className="h-px bg-white/[0.04]"/>
                <div className="flex justify-between"><span className="text-white font-medium">Score global</span><span className={`font-bold text-lg ${result.overallScore>=70?'text-[#34d399]':result.overallScore>=30?'text-[#c9a84c]':'text-red-400'}`}>{result.overallScore}%</span></div>
              </div>

              {/* Tajwid details */}
              {result.tajwidAnalysis?.details && (
                <div className="glass p-4">
                  <h4 className="text-white/25 text-[10px] font-semibold uppercase tracking-[0.2em] mb-4">Détail des règles de Tajwid</h4>
                  <div className="space-y-3">
                    {result.tajwidAnalysis.details.map((d:any,i:number)=>(
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${d.status==='correct'?'bg-[#34d399]/10 text-[#34d399]':'bg-[#c9a84c]/10 text-[#c9a84c]'}`}>
                          {d.status==='correct'?<Check className="w-3 h-3"/>:<span className="text-[10px] font-bold">!</span>}
                        </div>
                        <div>
                          <p className="text-sm"><span className="text-white/50 font-medium">{d.rule}</span>{' — '}<span className={d.status==='correct'?'text-[#34d399]':'text-[#c9a84c]'}>{d.status}</span></p>
                          {d.status!=='correct'&&<p className="text-white/20 text-xs mt-0.5 leading-relaxed">{d.tip}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={()=>setResult(null)} className="flex-1 btn-primary text-sm">Réessayer</button>
                <button onClick={()=>router.push('/')} className="flex-1 btn-ghost text-sm">Retour</button>
              </div>
              </>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
