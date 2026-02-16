/**
 * Tournament Module — Phase 2
 * 
 * Fonctionnalites prevues :
 * - Matchmaking entre amis via WhatsApp deep links
 * - Tracking competition en temps reel (Supabase Realtime)
 * - Temps de validation par sourate
 * - Historique des matchs
 * - Classement
 */

export interface Tournament {
  id: string
  challenger_id: string
  opponent_id: string
  surah_id: number
  status: 'pending' | 'active' | 'completed'
  challenger_score: number | null
  opponent_score: number | null
  challenger_time: number | null
  opponent_time: number | null
  winner_id: string | null
  created_at: string
}

// A implementer en Phase 2
export function createTournamentChallenge() {
  throw new Error('Phase 2 — not yet implemented')
}

export function acceptChallenge() {
  throw new Error('Phase 2 — not yet implemented')
}

export function getTournamentHistory() {
  throw new Error('Phase 2 — not yet implemented')
}
