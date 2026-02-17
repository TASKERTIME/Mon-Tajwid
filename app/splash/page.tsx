'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function Splash() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 200),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1800),
      setTimeout(() => {
        // After splash, go to auth or home
        if (isAuthenticated) {
          router.replace('/')
        } else {
          router.replace('/auth')
        }
      }, 2800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [router, isAuthenticated])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-30"
        style={{ background:'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)' }} />

      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white/20 rounded-full anim-pulse"
            style={{ top: `${10 + Math.random()*80}%`, left: `${5 + Math.random()*90}%`, animationDelay: `${Math.random()*3}s`, animationDuration: `${2+Math.random()*3}s` }} />
        ))}
      </div>

      {/* Moon */}
      <div className={`transition-all duration-1000 ease-out ${step>=1?'opacity-100 scale-100':'opacity-0 scale-50'}`}>
        <div className="w-32 h-32 anim-float">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_40px_rgba(201,168,76,0.3)]">
            <defs><linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2c76a"/><stop offset="100%" stopColor="#a6862f"/>
            </linearGradient></defs>
            <circle cx="50" cy="50" r="42" fill="url(#mg)" opacity="0.95"/>
            <circle cx="64" cy="40" r="34" fill="#080d1a"/>
            <circle cx="74" cy="26" r="2.5" fill="#c9a84c" opacity="0.5"/>
            <circle cx="84" cy="38" r="1.5" fill="#c9a84c" opacity="0.3"/>
            <circle cx="78" cy="52" r="2" fill="#c9a84c" opacity="0.4"/>
          </svg>
        </div>
      </div>

      {/* Title */}
      <div className={`mt-10 text-center transition-all duration-700 ${step>=2?'opacity-100 translate-y-0':'opacity-0 translate-y-6'}`}>
        <h1 className="heading text-5xl font-bold text-white tracking-tight">Mon Tajwid</h1>
        <p className="arabic text-[#c9a84c]/70 text-2xl mt-3">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
      </div>

      {/* Ramadan */}
      <div className={`mt-10 transition-all duration-700 ${step>=3?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
        <div className="glass-gold px-8 py-4 text-center">
          <p className="text-[#c9a84c] text-base font-semibold">Profite du Ramadan</p>
          <p className="text-[#c9a84c]/50 text-sm mt-0.5">pour mémoriser le Coran</p>
        </div>
      </div>

      {/* Loading */}
      <div className={`mt-12 flex gap-2 transition-opacity duration-500 ${step>=2?'opacity-100':'opacity-0'}`}>
        {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[#c9a84c]/40 anim-pulse" style={{animationDelay:`${i*0.3}s`}} />)}
      </div>
    </div>
  )
}
