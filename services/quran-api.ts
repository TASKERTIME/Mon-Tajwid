/**
 * Quran Data Service
 * Source: api.quran.com v4 — texte Uthmani authentique
 */

const QURAN_API = 'https://api.quran.com/api/v4'

export interface Surah {
  id: number
  name_arabic: string
  name_simple: string
  name_translation: string
  revelation_place: string
  verses_count: number
}

export interface Verse {
  id: number
  verse_number: number
  verse_key: string
  text_uthmani: string
  text_transliteration: string
  translation_fr: string
  audio_url: string
  juz_number: number
  page_number: number
}

// ===================== JUZ → SURAH MAPPING =====================
// Mapping statique Juz → Sourates (IDs des sourates contenues dans chaque Juz)
export const JUZ_SURAH_MAP: Record<number, number[]> = {
  1: [1, 2],
  2: [2],
  3: [2, 3],
  4: [3, 4],
  5: [4],
  6: [4, 5],
  7: [5, 6],
  8: [6, 7],
  9: [7, 8],
  10: [8, 9],
  11: [9, 10, 11],
  12: [11, 12],
  13: [12, 13, 14],
  14: [15, 16],
  15: [17, 18],
  16: [18, 19, 20],
  17: [21, 22],
  18: [23, 24, 25],
  19: [25, 26, 27],
  20: [27, 28, 29],
  21: [29, 30, 31, 32, 33],
  22: [33, 34, 35, 36],
  23: [36, 37, 38, 39],
  24: [39, 40, 41],
  25: [41, 42, 43, 44, 45],
  26: [46, 47, 48, 49, 50, 51],
  27: [51, 52, 53, 54, 55, 56, 57],
  28: [58, 59, 60, 61, 62, 63, 64, 65, 66],
  29: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
  30: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114],
}

// ===================== RECITERS =====================
export const RECITERS = [
  { id: '7', name: 'Mishary Rashid Alafasy', name_ar: 'مشاري العفاسي' },
  { id: '1', name: 'Abdul Basit Abdul Samad', name_ar: 'عبد الباسط عبد الصمد' },
  { id: '5', name: 'Abu Bakr al-Shatri', name_ar: 'أبو بكر الشاطري' },
  { id: '6', name: 'Maher Al Muaiqly', name_ar: 'ماهر المعيقلي' },
  { id: '10', name: 'Saad Al-Ghamdi', name_ar: 'سعد الغامدي' },
  { id: '12', name: 'Yasser Ad-Dossari', name_ar: 'ياسر الدوسري' },
]

// ===================== API CALLS =====================

export async function fetchSurahs(): Promise<Surah[]> {
  const res = await fetch(`${QURAN_API}/chapters?language=fr`)
  if (!res.ok) throw new Error('Failed to fetch surahs')
  const data = await res.json()
  return data.chapters.map((ch: any) => ({
    id: ch.id,
    name_arabic: ch.name_arabic,
    name_simple: ch.name_simple,
    name_translation: ch.translated_name?.name || '',
    revelation_place: ch.revelation_place,
    verses_count: ch.verses_count,
  }))
}

export async function fetchVerses(
  surahId: number,
  reciterId: string = '7'
): Promise<Verse[]> {
  const [textRes, transRes, audioRes] = await Promise.all([
    fetch(`${QURAN_API}/verses/by_chapter/${surahId}?language=fr&words=false&per_page=300&fields=text_uthmani`),
    fetch(`${QURAN_API}/verses/by_chapter/${surahId}?language=fr&per_page=300&translations=136`),
    fetch(`${QURAN_API}/recitations/${reciterId}/by_chapter/${surahId}`),
  ])

  if (!textRes.ok) throw new Error('Failed to fetch verses')

  const textData = await textRes.json()
  const transData = await transRes.json()
  const audioData = await audioRes.json()

  const audioMap = new Map<number, string>()
  audioData.audio_files?.forEach((af: any) => {
    const verseNum = af.verse_key ? parseInt(af.verse_key.split(':')[1]) : af.verse_number
    audioMap.set(verseNum, `https://audio.qurancdn.com/${af.url}`)
  })

  return textData.verses.map((v: any, i: number) => ({
    id: v.id,
    verse_number: v.verse_number,
    verse_key: v.verse_key,
    text_uthmani: v.text_uthmani,
    text_transliteration: '',
    translation_fr: transData.verses?.[i]?.translations?.[0]?.text || '',
    audio_url: audioMap.get(v.verse_number) || '',
    juz_number: v.juz_number,
    page_number: v.page_number,
  }))
}

export async function fetchTransliteration(surahId: number): Promise<Map<number, string>> {
  const res = await fetch(
    `${QURAN_API}/verses/by_chapter/${surahId}?language=en&per_page=300&translations=57`
  )
  const data = await res.json()
  const map = new Map<number, string>()
  data.verses?.forEach((v: any) => {
    map.set(v.verse_number, v.translations?.[0]?.text || '')
  })
  return map
}
