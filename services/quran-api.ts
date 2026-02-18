// Mon Tajwid — Quran API (quran.com v4 + alquran.cloud)

export interface Surah {
  id: number; name_simple: string; name_arabic: string
  verses_count: number; revelation_place: string
}

export interface Verse {
  verse_number: number; text_uthmani: string
  text_transliteration?: string; translation_fr?: string; audio_url?: string
}

// Verified recitation IDs for verse-by-verse audio
export const RECITERS = [
  { id:'1',  name:'Abdul Basit', style:'Mujawwad (tajwid)' },
  { id:'2',  name:'Abdul Basit', style:'Murattal' },
  { id:'3',  name:'Abdur-Rahman as-Sudais', style:'Murattal' },
  { id:'4',  name:'Abu Bakr al-Shatri', style:'Murattal' },
  { id:'5',  name:'Hani ar-Rifai', style:'Murattal' },
  { id:'6',  name:'Mahmoud Khalil al-Hussary', style:'Murattal' },
  { id:'7',  name:'Mishari Rashid al-Afasy', style:'Murattal' },
  { id:'12', name:'Saad al-Ghamdi', style:'Murattal' },
]

const BASE = 'https://api.quran.com/api/v4'

export async function fetchSurahs(): Promise<Surah[]> {
  try {
    const res = await fetch(`${BASE}/chapters?language=fr`)
    const data = await res.json()
    return (data.chapters || []).map((c: any) => ({
      id: c.id, name_simple: c.name_simple, name_arabic: c.name_arabic,
      verses_count: c.verses_count, revelation_place: c.revelation_place,
    }))
  } catch (e) { console.error('fetchSurahs error', e); return [] }
}

/** Fetch all pages of a paginated endpoint */
async function fetchAllPages(url: string, key: string): Promise<any[]> {
  let all: any[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= 20) {
    const sep = url.includes('?') ? '&' : '?'
    const res = await fetch(`${url}${sep}per_page=50&page=${page}`)
    const data = await res.json()

    const items = data[key] || []
    all = all.concat(items)

    if (data.pagination) {
      totalPages = data.pagination.total_pages || 1
    } else {
      break // No pagination info = single page
    }
    page++
  }
  return all
}

export async function fetchVerses(surahId: number, reciterId: string = '7'): Promise<Verse[]> {
  try {
    // 1. Fetch ALL verses (text) with pagination
    const allVerses = await fetchAllPages(
      `${BASE}/verses/by_chapter/${surahId}?language=fr&fields=text_uthmani`,
      'verses'
    )

    // 2. French translation (Hamidullah)
    let translations: Record<number, string> = {}
    try {
      const trVerses = await fetchAllPages(
        `${BASE}/verses/by_chapter/${surahId}?language=fr&translations=136&fields=text_uthmani`,
        'verses'
      )
      for (const v of trVerses) {
        if (v.translations?.[0]?.text) {
          translations[v.verse_number] = v.translations[0].text.replace(/<[^>]*>/g, '')
        }
      }
    } catch {}

    // 3. Transliteration from alquran.cloud (no pagination needed)
    let translit: Record<number, string> = {}
    try {
      const tlRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/en.transliteration`)
      const tlData = await tlRes.json()
      if (tlData.data?.ayahs) {
        for (const a of tlData.data.ayahs) {
          translit[a.numberInSurah] = a.text
        }
      }
    } catch {}

    // 4. Fetch ALL audio files with pagination — THIS WAS THE BUG
    // The API paginates at per_page=10 by default, so long surahs got cut off
    let audioUrls: Record<number, string> = {}
    try {
      const audioFiles = await fetchAllPages(
        `${BASE}/recitations/${reciterId}/by_chapter/${surahId}`,
        'audio_files'
      )
      for (const af of audioFiles) {
        const vn = af.verse_key?.split(':')?.[1]
        if (vn && af.url) {
          audioUrls[parseInt(vn)] = af.url.startsWith('http') ? af.url : `https://audio.qurancdn.com/${af.url}`
        }
      }
    } catch {}

    return allVerses.map((v: any) => ({
      verse_number: v.verse_number,
      text_uthmani: v.text_uthmani || '',
      text_transliteration: translit[v.verse_number] || undefined,
      translation_fr: translations[v.verse_number] || undefined,
      audio_url: audioUrls[v.verse_number] || undefined,
    }))
  } catch (e) { console.error('fetchVerses error', e); return [] }
}
