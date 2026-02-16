/**
 * Quran Data Service
 * Source: api.quran.com v4
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

// 30 Juz — 2 premieres sourates de chaque Juz (toutes debloquees)
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

// Strip HTML tags from translations (fix <sup foot_note=xxx>...</sup>)
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

export async function fetchVerses(
  surahId: number,
  reciterId: string = '7'
): Promise<Verse[]> {
  // Fetch text, translation FR, transliteration EN, and audio in parallel
  const [textRes, transRes, translitRes, audioRes] = await Promise.all([
    fetch(`${QURAN_API}/verses/by_chapter/${surahId}?language=fr&words=false&per_page=300&fields=text_uthmani`),
    fetch(`${QURAN_API}/verses/by_chapter/${surahId}?language=fr&per_page=300&translations=136`),
    fetch(`${QURAN_API}/verses/by_chapter/${surahId}?language=en&per_page=300&fields=text_transliteration`),
    fetch(`${QURAN_API}/recitations/${reciterId}/by_chapter/${surahId}`),
  ])

  if (!textRes.ok) throw new Error('Failed to fetch verses')

  const textData = await textRes.json()
  const transData = await transRes.json()
  const translitData = await translitRes.json()
  const audioData = await audioRes.json()

  const audioMap = new Map<number, string>()
  audioData.audio_files?.forEach((af: any) => {
    const verseNum = af.verse_key ? parseInt(af.verse_key.split(':')[1]) : af.verse_number
    audioMap.set(verseNum, `https://audio.qurancdn.com/${af.url}`)
  })

  return textData.verses.map((v: any, i: number) => {
    const rawTranslation = transData.verses?.[i]?.translations?.[0]?.text || ''
    const transliteration = translitData.verses?.[i]?.text_transliteration || ''

    return {
      id: v.id,
      verse_number: v.verse_number,
      verse_key: v.verse_key,
      text_uthmani: v.text_uthmani,
      text_transliteration: transliteration,
      translation_fr: stripHtml(rawTranslation),
      audio_url: audioMap.get(v.verse_number) || '',
      juz_number: v.juz_number,
      page_number: v.page_number,
    }
  })
}
