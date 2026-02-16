/**
 * Progression Service
 * Validation sourates, completion Juz, trophees, etoiles
 */

import { supabase } from '@/supabase/client'
import { JUZ_SURAH_MAP } from '@/services/quran-api'

export interface ValidationResult {
  surahValidated: boolean
  juzCompleted: boolean
  juzUnlocked: number | null
  trophyEarned: boolean
  newStars: number
  totalStars: number
}

export async function validateSurah(
  userId: string,
  surahId: number,
  juzId: number,
  score: number
): Promise<ValidationResult> {
  const isValidated = score >= 70

  const { error: surahError } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        surah_id: surahId,
        juz_id: juzId,
        is_validated: isValidated,
        best_score: score,
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
        ...(isValidated ? { validated_at: new Date().toISOString() } : {}),
      },
      { onConflict: 'user_id,surah_id' }
    )

  if (surahError) throw surahError

  let juzCompleted = false
  let nextJuzUnlocked: number | null = null
  let trophyEarned = false

  if (isValidated) {
    const surahsInJuz = JUZ_SURAH_MAP[juzId] || []

    const { data: progress } = await supabase
      .from('user_progress')
      .select('surah_id, is_validated')
      .eq('user_id', userId)
      .in('surah_id', surahsInJuz)

    const validatedSurahs = progress?.filter((p) => p.is_validated).length || 0
    juzCompleted = validatedSurahs >= surahsInJuz.length

    if (juzCompleted) {
      trophyEarned = true
      nextJuzUnlocked = juzId < 30 ? juzId + 1 : null

      await supabase.from('juz_progress').upsert(
        {
          user_id: userId,
          juz_id: juzId,
          is_completed: true,
          trophy_earned: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,juz_id' }
      )

      if (nextJuzUnlocked) {
        await supabase.from('juz_progress').upsert(
          { user_id: userId, juz_id: nextJuzUnlocked, is_unlocked: true },
          { onConflict: 'user_id,juz_id' }
        )
      }
    }
  }

  const { count } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_validated', true)

  return {
    surahValidated: isValidated,
    juzCompleted,
    juzUnlocked: nextJuzUnlocked,
    trophyEarned,
    newStars: isValidated ? 1 : 0,
    totalStars: count || 0,
  }
}

export async function loadUserProgress(userId: string) {
  const [surahRes, juzRes] = await Promise.all([
    supabase.from('user_progress').select('*').eq('user_id', userId),
    supabase.from('juz_progress').select('*').eq('user_id', userId),
  ])

  const surahProgress: Record<number, { validated: boolean; bestScore: number; attempts: number }> = {}
  surahRes.data?.forEach((p) => {
    surahProgress[p.surah_id] = {
      validated: p.is_validated,
      bestScore: p.best_score,
      attempts: p.attempts,
    }
  })

  const juzProgress: Record<number, { unlocked: boolean; completed: boolean; trophy: boolean }> = {}
  juzRes.data?.forEach((p) => {
    juzProgress[p.juz_id] = {
      unlocked: p.is_unlocked,
      completed: p.is_completed,
      trophy: p.trophy_earned,
    }
  })

  if (!juzProgress[1]) {
    juzProgress[1] = { unlocked: true, completed: false, trophy: false }
  }

  return { surahProgress, juzProgress }
}

export async function saveRecitationAttempt(
  userId: string,
  surahId: number,
  data: {
    audioUrl?: string
    transcription: string
    tajwidScore: number
    accuracyScore: number
    overallScore: number
    tajwidErrors: any[]
    durationSeconds: number
  }
) {
  return supabase.from('recitation_attempts').insert({
    user_id: userId,
    surah_id: surahId,
    audio_url: data.audioUrl,
    transcription: data.transcription,
    tajwid_score: data.tajwidScore,
    accuracy_score: data.accuracyScore,
    overall_score: data.overallScore,
    tajwid_errors: data.tajwidErrors,
    duration_seconds: data.durationSeconds,
  })
}
