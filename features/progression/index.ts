/**
 * Progression Service
 * Validation sourates, etoiles, sauvegarde tentatives
 */

import { supabase } from '@/supabase/client'

export interface ValidationResult {
  surahValidated: boolean
  newStars: number
  totalStars: number
}

export async function validateSurah(
  userId: string,
  surahId: number,
  score: number
): Promise<ValidationResult> {
  const isValidated = score >= 70
  const now = new Date().toISOString()

  const upsertData: Record<string, any> = {
    user_id: userId,
    surah_id: surahId,
    juz_id: 1,
    is_validated: isValidated,
    best_score: score,
    attempts: 1,
    last_attempt_at: now,
  }
  if (isValidated) upsertData.validated_at = now

  const { error } = await supabase
    .from('user_progress')
    .upsert(upsertData, { onConflict: 'user_id,surah_id' })
  if (error) throw error

  const { count } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_validated', true)

  return { surahValidated: isValidated, newStars: isValidated ? 1 : 0, totalStars: count || 0 }
}

export async function loadUserProgress(userId: string) {
  const { data } = await supabase.from('user_progress').select('*').eq('user_id', userId)
  const surahProgress: Record<number, { validated: boolean; bestScore: number; attempts: number }> = {}
  ;(data as any[])?.forEach((p: any) => {
    surahProgress[p.surah_id] = { validated: p.is_validated, bestScore: p.best_score, attempts: p.attempts }
  })
  return { surahProgress }
}

export async function saveRecitationAttempt(
  userId: string,
  surahId: number,
  data: {
    audioUrl?: string; transcription: string; tajwidScore: number
    accuracyScore: number; overallScore: number; tajwidErrors: any[]; durationSeconds: number
  }
) {
  return supabase.from('recitation_attempts').insert({
    user_id: userId, surah_id: surahId, audio_url: data.audioUrl,
    transcription: data.transcription, tajwid_score: data.tajwidScore,
    accuracy_score: data.accuracyScore, overall_score: data.overallScore,
    tajwid_errors: data.tajwidErrors, duration_seconds: data.durationSeconds,
  })
}
