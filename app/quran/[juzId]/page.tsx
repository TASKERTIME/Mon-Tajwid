'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useProgressStore } from '@/lib/store'
import { fetchSurahs, JUZ_SURAH_MAP, type Surah } from '@/services/quran-api'
import { ArrowLeft, Star, ChevronRight, Loader2 } from 'lucide-react'

export default function JuzPage() {
  const params = useParams()
  const juzId = parseInt(params.juzId as string)
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loading, setLoading] = useState(true)
  const { surahProgress } = useProgressStore()

  useEffect(() => {
    async function load() {
      try {
        const allSurahs = await fetchSurahs()
        const surahIds = JUZ_SURAH_MAP[juzId] || []
        setSurahs(allSurahs.filter((s) => surahIds.includes(s.id)))
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [juzId])

  const validatedCount = surahs.filter((s) => surahProgress[s.id]?.validated).length
  const pct = surahs.length > 0 ? Math.round((validatedCount / surahs.length) * 100) : 0

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <h1 className="font-heading text-xl font-bold text-white">Juz {juzId}</h1>
          <p className="text-white/40 text-sm">{surahs.length} sourates</p>
        </div>
        <span className="text-emerald-400 font-semibold">{pct}%</span>
      </div>

      <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-6">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {surahs.map((surah) => {
            const isVal = surahProgress[surah.id]?.validated || false
            return (
              <Link key={surah.id} href={`/quran/${juzId}/${surah.id}`}
                className="card-v2 p-4 flex items-center gap-4 hover:bg-white/[0.04] transition group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${
                  isVal ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                  {surah.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold truncate">{surah.name_simple}</h3>
                    {isVal && <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />}
                  </div>
                  <p className="text-white/30 text-xs mt-0.5">{surah.name_translation} &middot; {surah.verses_count} versets</p>
                </div>
                <span className="font-arabic text-emerald-200/25 text-lg">{surah.name_arabic}</span>
                <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/30" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
