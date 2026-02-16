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
        const juzSurahs = allSurahs.filter((s) => surahIds.includes(s.id))
        setSurahs(juzSurahs)
      } catch (err) {
        console.error('Failed to load surahs:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [juzId])

  const validatedCount = surahs.filter((s) => surahProgress[s.id]?.validated).length
  const progressPercent = surahs.length > 0 ? Math.round((validatedCount / surahs.length) * 100) : 0

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="p-2 rounded-xl bg-night-800 hover:bg-night-700 transition">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <h1 className="font-heading text-xl font-bold text-white">Juz {juzId}</h1>
          <p className="text-night-400 text-sm">{surahs.length} sourates</p>
        </div>
        <div className="text-right">
          <span className="text-sacred-400 font-semibold">{progressPercent}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-6">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Surah list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-sacred-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {surahs.map((surah) => {
            const progress = surahProgress[surah.id]
            const isValidated = progress?.validated || false

            return (
              <Link
                key={surah.id}
                href={`/quran/${juzId}/${surah.id}`}
                className="card-sacred p-4 flex items-center gap-4 hover:bg-night-700/40 transition-all group"
              >
                {/* Surah number */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${
                    isValidated ? 'bg-sacred-500/20 text-sacred-400' : 'bg-night-700/50 text-night-400'
                  }`}
                >
                  {surah.id}
                </div>

                {/* Surah info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold truncate">{surah.name_simple}</h3>
                    {isValidated && <Star className="w-4 h-4 text-gold-400 fill-gold-400 flex-shrink-0" />}
                  </div>
                  <p className="text-night-400 text-xs mt-0.5">
                    {surah.name_translation} &middot; {surah.verses_count} versets
                  </p>
                </div>

                {/* Arabic name */}
                <span className="font-arabic text-lg text-sacred-300/70 group-hover:text-sacred-300 transition">
                  {surah.name_arabic}
                </span>

                <ChevronRight className="w-4 h-4 text-night-600 group-hover:text-night-400 transition" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
