import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  userId: string | null
  displayName: string | null
  preferredReciter: string
  isAuthenticated: boolean
  activeTajwidRules: string[]
  setUser: (userId: string, displayName: string | null) => void
  setReciter: (reciterId: string) => void
  setTajwidRules: (rules: string[]) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null, displayName: null, preferredReciter: '7', isAuthenticated: false,
      activeTajwidRules: ['noon_sakinah_ikhfa','noon_sakinah_idgham','noon_sakinah_iqlab','qalqalah','ghunnah','madd_natural','meem_sakinah_ikhfa'],
      setUser: (userId, displayName) => set({ userId, displayName, isAuthenticated: true }),
      setReciter: (r) => set({ preferredReciter: r }),
      setTajwidRules: (rules) => set({ activeTajwidRules: rules }),
      logout: () => set({ userId: null, displayName: null, isAuthenticated: false }),
    }),
    { name: 'mon-tajwid-user' }
  )
)

interface ProgressState {
  // surahId -> { validated, bestScore, attempts }
  surahProgress: Record<number, { validated: boolean; bestScore: number; attempts: number }>
  streak: number
  lastPracticeDate: string | null
  setSurahProgress: (surahId: number, data: { validated: boolean; bestScore: number; attempts: number }) => void
  updateStreak: () => void
  getTotalStars: () => number
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      surahProgress: {},
      streak: 0,
      lastPracticeDate: null,
      setSurahProgress: (surahId, data) =>
        set((s) => ({ surahProgress: { ...s.surahProgress, [surahId]: data } })),
      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0]
        const { lastPracticeDate, streak } = get()
        if (lastPracticeDate === today) return
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        set({ streak: lastPracticeDate === yesterday ? streak + 1 : 1, lastPracticeDate: today })
      },
      getTotalStars: () => Object.values(get().surahProgress).filter((p) => p.validated).length,
    }),
    { name: 'mon-tajwid-progress' }
  )
)

interface QuranState {
  currentVerse: number | null
  displayMode: 'arabic' | 'phonetic' | 'translation' | 'all'
  isPlaying: boolean
  activeTab: 'quran' | 'rappels' | 'progress' | 'settings'
  setCurrentVerse: (v: number | null) => void
  setDisplayMode: (m: 'arabic' | 'phonetic' | 'translation' | 'all') => void
  setPlaying: (p: boolean) => void
  setActiveTab: (t: 'quran' | 'rappels' | 'progress' | 'settings') => void
}

export const useQuranStore = create<QuranState>()((set) => ({
  currentVerse: null,
  displayMode: 'arabic',
  isPlaying: false,
  activeTab: 'quran',
  setCurrentVerse: (v) => set({ currentVerse: v }),
  setDisplayMode: (m) => set({ displayMode: m }),
  setPlaying: (p) => set({ isPlaying: p }),
  setActiveTab: (t) => set({ activeTab: t }),
}))
