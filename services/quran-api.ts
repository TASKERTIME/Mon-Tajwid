// Mon Tajwid — Quran API (quran.com v4 + alquran.cloud)

export interface Surah {
  id: number; name_simple: string; name_arabic: string
  verses_count: number; revelation_place: string
}

export interface Verse {
  verse_number: number; text_uthmani: string
  text_transliteration?: string; translation_fr?: string; audio_url?: string
}

// Recitation IDs verified on quran.com v4 /recitations endpoint
// These are for VERSE-BY-VERSE audio (not chapter recitations)
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

export async function fetchVerses(surahId: number, reciterId: string = '7'): Promise<Verse[]> {
  try {
    // 1. Arabic text + audio (all pages)
    const textRes = await fetch(
      `${BASE}/verses/by_chapter/${surahId}?language=fr&fields=text_uthmani&per_page=300&recitation_id=${reciterId}`
    )
    const textData = await textRes.json()
    const verses = textData.verses || []

    // If we got less than total, fetch remaining pages
    const total = textData.pagination?.total_records || verses.length
    if (verses.length < total) {
      let page = 2
      while (verses.length < total && page <= 10) {
        const more = await fetch(`${BASE}/verses/by_chapter/${surahId}?language=fr&fields=text_uthmani&per_page=300&recitation_id=${reciterId}&page=${page}`)
        const moreData = await more.json()
        if (!moreData.verses?.length) break
        verses.push(...moreData.verses)
        page++
      }
    }

    // 2. French translation (Hamidullah)
    let translations: Record<number, string> = {}
    try {
      const trRes = await fetch(`${BASE}/verses/by_chapter/${surahId}?language=fr&translations=136&per_page=300&fields=text_uthmani`)
      const trData = await trRes.json()
      for (const v of (trData.verses || [])) {
        if (v.translations?.[0]?.text) {
          translations[v.verse_number] = v.translations[0].text.replace(/<[^>]*>/g, '')
        }
      }
    } catch {}

    // 3. Transliteration from alquran.cloud
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

    // 4. Audio URLs from recitations endpoint
    let audioUrls: Record<number, string> = {}
    try {
      const audioRes = await fetch(`${BASE}/recitations/${reciterId}/by_chapter/${surahId}`)
      const audioData = await audioRes.json()
      for (const af of (audioData.audio_files || [])) {
        const vn = af.verse_key?.split(':')?.[1]
        if (vn && af.url) {
          audioUrls[parseInt(vn)] = af.url.startsWith('http') ? af.url : `https://audio.qurancdn.com/${af.url}`
        }
      }
    } catch {}

    return verses.map((v: any) => ({
      verse_number: v.verse_number,
      text_uthmani: v.text_uthmani || '',
      text_transliteration: translit[v.verse_number] || undefined,
      translation_fr: translations[v.verse_number] || undefined,
      audio_url: audioUrls[v.verse_number] || undefined,
    }))
  } catch (e) { console.error('fetchVerses error', e); return [] }
}
