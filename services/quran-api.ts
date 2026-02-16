/**
 * Quran Data Service
 * Main: api.quran.com v4 (text + translation FR + audio)
 * Transliteration: api.alquran.cloud (edition en.transliteration)
 */

const QURAN_API = 'https://api.quran.com/api/v4'
const ALQURAN_API = 'https://api.alquran.cloud/v1'

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

export const JUZ_SURAH_MAP: Record<number, number[]> = {
  1: [1, 2], 2: [2, 3], 3: [3, 4], 4: [4, 5], 5: [4, 5],
  6: [5, 6], 7: [6, 7], 8: [7, 8], 9: [7, 8], 10: [8, 9],
  11: [9, 10], 12: [11, 12], 13: [12, 13], 14: [15, 16], 15: [17, 18],
  16: [18, 19], 17: [21, 22], 18: [23, 24], 19: [25, 26], 20: [27, 28],
  21: [29, 30], 22: [33, 34], 23: [36, 37], 24: [39, 40], 25: [41, 42],
  26: [46, 47], 27: [51, 52], 28: [58, 59], 29: [67, 68], 30: [78, 79],
}

export const RECITERS = [
  { id: '7', name: 'Mishary Rashid Alafasy', name_ar: 'مشاري العفاسي', style: 'Murattal lent et melodieux' },
  { id: '1', name: 'Abdul Basit Abdul Samad', name_ar: 'عبد الباسط عبد الصمد', style: 'Classique egyptien' },
  { id: '5', name: 'Abu Bakr al-Shatri', name_ar: 'أبو بكر الشاطري', style: 'Recitation de Makkah' },
  { id: '6', name: 'Maher Al Muaiqly', name_ar: 'ماهر المعيقلي', style: 'Imam Masjid al-Haram' },
  { id: '10', name: 'Saad Al-Ghamdi', name_ar: 'سعد الغامدي', style: 'Clair et distinct' },
  { id: '12', name: 'Yasser Ad-Dossari', name_ar: 'ياسر الدوسري', style: 'Emouvant et spirituel' },
]

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

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

async function fetchTransliteration(surahId: number): Promise<Map<number, string>> {
  const map = new Map<number, string>()
  try {
    const res = await fetch(`${ALQURAN_API}/surah/${surahId}/en.transliteration`)
    if (!res.ok) return map
    const data = await res.json()
    const ayahs = data?.data?.ayahs
    if (Array.isArray(ayahs)) {
      ayahs.forEach((a: any) => {
        map.set(a.numberInSurah, a.text || '')
      })
    }
  } catch {
    // Silently fail — phonetic will just be empty
  }
  return map
}

export async function fetchVerses(
  surahId: number,
  reciterId: string = '7'
): Promise<Verse[]> {
  const [textRes, frRes, translitMap, audioRes] = await Promise.all([
    fetch(`${QURAN_API}/verses/by_chapter/${surahId}?language=fr&words=false&per_page=300&fields=text_uthmani`),
    fetch(`${QURAN_API}/verses/by_chapter/${surahId}?language=fr&per_page=300&translations=136`),
    fetchTransliteration(surahId),
    fetch(`${QURAN_API}/recitations/${reciterId}/by_chapter/${surahId}`),
  ])

  if (!textRes.ok) throw new Error('Failed to fetch verses')

  const textData = await textRes.json()
  const frData = await frRes.json()
  const audioData = await audioRes.json()

  const audioMap = new Map<number, string>()
  audioData.audio_files?.forEach((af: any) => {
    const verseNum = af.verse_key ? parseInt(af.verse_key.split(':')[1]) : af.verse_number
    audioMap.set(verseNum, `https://audio.qurancdn.com/${af.url}`)
  })

  return textData.verses.map((v: any, i: number) => {
    const rawFr = frData.verses?.[i]?.translations?.[0]?.text || ''

    return {
      id: v.id,
      verse_number: v.verse_number,
      verse_key: v.verse_key,
      text_uthmani: v.text_uthmani,
      text_transliteration: translitMap.get(v.verse_number) || '',
      translation_fr: stripHtml(rawFr),
      audio_url: audioMap.get(v.verse_number) || '',
      juz_number: v.juz_number,
      page_number: v.page_number,
    }
  })
}
