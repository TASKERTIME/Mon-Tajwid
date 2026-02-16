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
      userId: null,
      displayName: null,
      preferredReciter: '7',
      isAuthenticated: false,
      activeTajwidRules: [
        'noon_sakinah_ikhfa', 'noon_sakinah_idgham', 'noon_sakinah_iqlab',
        'qalqalah', 'ghunnah', 'madd_natural', 'meem_sakinah_ikhfa'
      ],
      setUser: (userId, displayName) => set({ userId, displayName, isAuthenticated: true }),
      setReciter: (reciterId) => set({ preferredReciter: reciterId }),
      setTajwidRules: (rules) => set({ activeTajwidRules: rules }),
      logout: () => set({ userId: null, displayName: null, isAuthenticated: false }),
    }),
    { name: 'mon-tajwid-user' }
  )
)

interface ProgressState {
  surahProgress: Record<number, { validated: boolean; bestScore: number; attempts: number }>
  juzProgress: Record<number, { unlocked: boolean; completed: boolean; trophy: boolean }>
  streak: number
  lastPracticeDate: string | null
  setSurahProgress: (surahId: number, data: { validated: boolean; bestScore: number; attempts: number }) => void
  setJuzProgress: (juzId: number, data: { unlocked: boolean; completed: boolean; trophy: boolean }) => void
  loadProgress: (surah: Record<number, any>, juz: Record<number, any>) => void
  updateStreak: () => void
  getTotalStars: () => number
  getTotalTrophies: () => number
}

// All 30 Juz unlocked by default
const defaultJuzProgress: Record<number, { unlocked: boolean; completed: boolean; trophy: boolean }> = {}
for (let i = 1; i <= 30; i++) {
  defaultJuzProgress[i] = { unlocked: true, completed: false, trophy: false }
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      surahProgress: {},
      juzProgress: defaultJuzProgress,
      streak: 0,
      lastPracticeDate: null,
      setSurahProgress: (surahId, data) =>
        set((state) => ({ surahProgress: { ...state.surahProgress, [surahId]: data } })),
      setJuzProgress: (juzId, data) =>
        set((state) => ({ juzProgress: { ...state.juzProgress, [juzId]: data } })),
      loadProgress: (surah, juz) => set({ surahProgress: surah, juzProgress: juz }),
      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0]
        const { lastPracticeDate, streak } = get()
        if (lastPracticeDate === today) return
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        if (lastPracticeDate === yesterday) {
          set({ streak: streak + 1, lastPracticeDate: today })
        } else {
          set({ streak: 1, lastPracticeDate: today })
        }
      },
      getTotalStars: () => Object.values(get().surahProgress).filter((p) => p.validated).length,
      getTotalTrophies: () => Object.values(get().juzProgress).filter((p) => p.trophy).length,
    }),
    { name: 'mon-tajwid-progress' }
  )
)

interface QuranState {
  currentJuz: number | null
  currentSurah: number | null
  currentVerse: number | null
  displayMode: 'arabic' | 'phonetic' | 'translation' | 'all'
  isPlaying: boolean
  activeTab: 'quran' | 'recite' | 'progress' | 'settings'
  setCurrentJuz: (juzId: number) => void
  setCurrentSurah: (surahId: number) => void
  setCurrentVerse: (verseNum: number | null) => void
  setDisplayMode: (mode: 'arabic' | 'phonetic' | 'translation' | 'all') => void
  setPlaying: (playing: boolean) => void
  setActiveTab: (tab: 'quran' | 'recite' | 'progress' | 'settings') => void
}

export const useQuranStore = create<QuranState>()((set) => ({
  currentJuz: null,
  currentSurah: null,
  currentVerse: null,
  displayMode: 'arabic',
  isPlaying: false,
  activeTab: 'quran',
  setCurrentJuz: (juzId) => set({ currentJuz: juzId }),
  setCurrentSurah: (surahId) => set({ currentSurah: surahId }),
  setCurrentVerse: (verseNum) => set({ currentVerse: verseNum }),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
