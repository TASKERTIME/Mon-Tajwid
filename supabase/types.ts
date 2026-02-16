export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          preferred_reciter: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          preferred_reciter?: string
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
          preferred_reciter?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          surah_id: number
          juz_id: number
          is_validated: boolean
          best_score: number
          attempts: number
          last_attempt_at: string | null
          validated_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          surah_id: number
          juz_id: number
          is_validated?: boolean
          best_score?: number
          attempts?: number
        }
        Update: {
          is_validated?: boolean
          best_score?: number
          attempts?: number
          last_attempt_at?: string
          validated_at?: string
        }
      }
      juz_progress: {
        Row: {
          id: string
          user_id: string
          juz_id: number
          is_unlocked: boolean
          is_completed: boolean
          trophy_earned: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          juz_id: number
          is_unlocked?: boolean
          is_completed?: boolean
          trophy_earned?: boolean
        }
        Update: {
          is_unlocked?: boolean
          is_completed?: boolean
          trophy_earned?: boolean
          completed_at?: string
        }
      }
      recitation_attempts: {
        Row: {
          id: string
          user_id: string
          surah_id: number
          audio_url: string | null
          transcription: string | null
          tajwid_score: number
          accuracy_score: number
          overall_score: number
          tajwid_errors: Json
          duration_seconds: number
          created_at: string
        }
        Insert: {
          user_id: string
          surah_id: number
          audio_url?: string | null
          transcription?: string | null
          tajwid_score?: number
          accuracy_score?: number
          overall_score?: number
          tajwid_errors?: Json
          duration_seconds?: number
        }
        Update: {}
      }
    }
  }
}
