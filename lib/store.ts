import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  userId: string | null
  username: string | null
  displayName: string | null
  isAdmin: boolean
  isAuthenticated: boolean
  preferredReciter: string
  activeTajwidRules: string[]
  login: (userId: string, username: string, displayName: string | null, isAdmin?: boolean) => void
  logout: () => void
  setReciter: (r: string) => void
  setTajwidRules: (rules: string[]) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null, username: null, displayName: null, isAdmin: false, isAuthenticated: false,
      preferredReciter: '7',
      activeTajwidRules: ['noon_sakinah_ikhfa','noon_sakinah_idgham','noon_sakinah_iqlab','qalqalah','ghunnah','madd_natural','meem_sakinah_ikhfa'],
      login: (userId, username, displayName, isAdmin = false) =>
        set({ userId, username, displayName, isAdmin, isAuthenticated: true }),
      logout: () => set({ userId: null, username: null, displayName: null, isAdmin: false, isAuthenticated: false }),
      setReciter: (r) => set({ preferredReciter: r }),
      setTajwidRules: (rules) => set({ activeTajwidRules: rules }),
    }),
    { name: 'mon-tajwid-auth' }
  )
)

interface ProgressState {
  surahProgress: Record<number, { validated: boolean; bestScore: number; attempts: number }>
  bookmarks: Record<number, number> // surahId -> verseNumber
  streak: number
  lastPracticeDate: string | null
  setSurahProgress: (id: number, data: { validated: boolean; bestScore: number; attempts: number }) => void
  setBookmark: (surahId: number, verse: number) => void
  removeBookmark: (surahId: number) => void
  updateStreak: () => void
  getTotalStars: () => number
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      surahProgress: {}, bookmarks: {}, streak: 0, lastPracticeDate: null,
      setSurahProgress: (id, data) => set((s) => ({ surahProgress: { ...s.surahProgress, [id]: data } })),
      setBookmark: (surahId, verse) => set((s) => ({ bookmarks: { ...s.bookmarks, [surahId]: verse } })),
      removeBookmark: (surahId) => set((s) => { const b = { ...s.bookmarks }; delete b[surahId]; return { bookmarks: b } }),
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

type TabKey = 'quran' | 'duels' | 'invocations' | 'rappels' | 'settings'

interface UIState {
  activeTab: TabKey
  currentVerse: number | null
  displayMode: 'arabic' | 'phonetic' | 'translation' | 'all'
  isPlaying: boolean
  showInstallBanner: boolean
  setActiveTab: (t: TabKey) => void
  setCurrentVerse: (v: number | null) => void
  setDisplayMode: (m: 'arabic' | 'phonetic' | 'translation' | 'all') => void
  setPlaying: (p: boolean) => void
  dismissInstallBanner: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: 'quran', currentVerse: null, displayMode: 'arabic', isPlaying: false, showInstallBanner: true,
      setActiveTab: (t) => set({ activeTab: t }),
      setCurrentVerse: (v) => set({ currentVerse: v }),
      setDisplayMode: (m) => set({ displayMode: m }),
      setPlaying: (p) => set({ isPlaying: p }),
      dismissInstallBanner: () => set({ showInstallBanner: false }),
    }),
    { name: 'mon-tajwid-ui' }
  )
)
