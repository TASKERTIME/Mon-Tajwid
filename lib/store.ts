import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ===================== USER STORE =====================
interface UserState {
  userId: string | null
  displayName: string | null
  preferredReciter: string
  isAuthenticated: boolean
  setUser: (userId: string, displayName: string | null) => void
  setReciter: (reciterId: string) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      displayName: null,
      preferredReciter: '7', // Mishary Alafasy par defaut
      isAuthenticated: false,
      setUser: (userId, displayName) => set({ userId, displayName, isAuthenticated: true }),
      setReciter: (reciterId) => set({ preferredReciter: reciterId }),
      logout: () => set({ userId: null, displayName: null, isAuthenticated: false }),
    }),
    { name: 'mon-tajwid-user' }
  )
)

// ===================== PROGRESS STORE =====================
interface ProgressState {
  surahProgress: Record<number, { validated: boolean; bestScore: number; attempts: number }>
  juzProgress: Record<number, { unlocked: boolean; completed: boolean; trophy: boolean }>
  setSurahProgress: (surahId: number, data: { validated: boolean; bestScore: number; attempts: number }) => void
  setJuzProgress: (juzId: number, data: { unlocked: boolean; completed: boolean; trophy: boolean }) => void
  loadProgress: (surah: Record<number, any>, juz: Record<number, any>) => void
  getTotalStars: () => number
  getTotalTrophies: () => number
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      surahProgress: {},
      juzProgress: { 1: { unlocked: true, completed: false, trophy: false } },
      setSurahProgress: (surahId, data) =>
        set((state) => ({ surahProgress: { ...state.surahProgress, [surahId]: data } })),
      setJuzProgress: (juzId, data) =>
        set((state) => ({ juzProgress: { ...state.juzProgress, [juzId]: data } })),
      loadProgress: (surah, juz) => set({ surahProgress: surah, juzProgress: juz }),
      getTotalStars: () => Object.values(get().surahProgress).filter((p) => p.validated).length,
      getTotalTrophies: () => Object.values(get().juzProgress).filter((p) => p.trophy).length,
    }),
    { name: 'mon-tajwid-progress' }
  )
)

// ===================== QURAN NAV STORE =====================
interface QuranState {
  currentJuz: number | null
  currentSurah: number | null
  currentVerse: number | null
  displayMode: 'arabic' | 'phonetic' | 'translation' | 'all'
  isPlaying: boolean
  setCurrentJuz: (juzId: number) => void
  setCurrentSurah: (surahId: number) => void
  setCurrentVerse: (verseNum: number | null) => void
  setDisplayMode: (mode: 'arabic' | 'phonetic' | 'translation' | 'all') => void
  setPlaying: (playing: boolean) => void
}

export const useQuranStore = create<QuranState>()((set) => ({
  currentJuz: null,
  currentSurah: null,
  currentVerse: null,
  displayMode: 'arabic',
  isPlaying: false,
  setCurrentJuz: (juzId) => set({ currentJuz: juzId }),
  setCurrentSurah: (surahId) => set({ currentSurah: surahId }),
  setCurrentVerse: (verseNum) => set({ currentVerse: verseNum }),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  setPlaying: (playing) => set({ isPlaying: playing }),
}))
