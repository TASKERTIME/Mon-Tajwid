/**
 * Mon Tajwid — Moteur d'Analyse Tajwid
 * 
 * Moteur rule-based extensible : chaque regle est un module independant.
 * Phase 1: Analyse textuelle (comparaison attendu vs recite)
 * Phase 2: Analyse phonetique audio (a venir)
 */

// ===================== TYPES =====================

export interface TajwidRule {
  id: string
  name: string
  name_ar: string
  category: TajwidCategory
  description: string
  detect: (text: string, position: number) => TajwidOccurrence | null
}

export interface TajwidOccurrence {
  ruleId: string
  ruleName: string
  startIndex: number
  endIndex: number
  category: TajwidCategory
  severity: 'info' | 'warning' | 'error'
  description: string
}

export interface TajwidAnalysis {
  text: string
  occurrences: TajwidOccurrence[]
  score: number
  ruleBreakdown: Record<string, { found: number; errors: number }>
}

export type TajwidCategory =
  | 'noon_sakinah'
  | 'meem_sakinah'
  | 'madd'
  | 'qalqalah'
  | 'ghunnah'
  | 'idgham'
  | 'ikhfa'
  | 'iqlab'
  | 'general'

// ===================== ARABIC HELPERS =====================

const AR = {
  FATHA: '\u064E',
  DAMMA: '\u064F',
  KASRA: '\u0650',
  SUKUN: '\u0652',
  SHADDA: '\u0651',
  TANWEEN_FATH: '\u064B',
  TANWEEN_DAMM: '\u064C',
  TANWEEN_KASR: '\u064D',
  NOON: '\u0646',
  MEEM: '\u0645',
  BA: '\u0628',
  WAW: '\u0648',
  YA: '\u064A',
  RA: '\u0631',
  LAM: '\u0644',
  QALQALAH_LETTERS: ['\u0642', '\u0637', '\u0628', '\u062C', '\u062F'],
  IKHFA_LETTERS: [
    '\u062A', '\u062B', '\u062C', '\u062F', '\u0630',
    '\u0632', '\u0633', '\u0634', '\u0635', '\u0636',
    '\u0637', '\u0638', '\u0641', '\u0642', '\u0643',
  ],
  IDGHAM_GHUNNAH: ['\u064A', '\u0646', '\u0645', '\u0648'],
  IDGHAM_NO_GHUNNAH: ['\u0644', '\u0631'],
  MADD_LETTERS: ['\u0627', '\u0648', '\u064A'],
}

function isSukun(char: string): boolean {
  return char === AR.SUKUN
}

function isTanween(char: string): boolean {
  return [AR.TANWEEN_FATH, AR.TANWEEN_DAMM, AR.TANWEEN_KASR].includes(char)
}

function getNextLetter(text: string, pos: number): string | null {
  for (let i = pos + 1; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0x0621 && code <= 0x064A && code < 0x064B) return text[i]
  }
  return null
}

function getDiacriticAfter(text: string, pos: number): string | null {
  if (pos + 1 < text.length) {
    const next = text.charCodeAt(pos + 1)
    if (next >= 0x064B && next <= 0x0652) return text[pos + 1]
  }
  return null
}

// ===================== REGLES =====================

const noonSakinahIkhfa: TajwidRule = {
  id: 'noon_sakinah_ikhfa',
  name: 'Ikhfa (Noon Sakinah)',
  name_ar: '\u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u0646\u0648\u0646 \u0627\u0644\u0633\u0627\u0643\u0646\u0629',
  category: 'ikhfa',
  description: 'Noon sakinah/tanween suivi de 15 lettres Ikhfa — nasaliser et cacher',
  detect(text, pos) {
    if (text[pos] !== AR.NOON) return null
    const diac = getDiacriticAfter(text, pos)
    if (!diac || (!isSukun(diac) && !isTanween(diac))) return null
    const next = getNextLetter(text, pos)
    if (next && AR.IKHFA_LETTERS.includes(next)) {
      return {
        ruleId: this.id, ruleName: this.name, startIndex: pos, endIndex: pos + 2,
        category: this.category, severity: 'info',
        description: `Ikhfa: Noon sakinah avant ${next} — nasaliser et cacher`,
      }
    }
    return null
  },
}

const noonSakinahIdgham: TajwidRule = {
  id: 'noon_sakinah_idgham',
  name: 'Idgham (Noon Sakinah)',
  name_ar: '\u0625\u062F\u063A\u0627\u0645',
  category: 'idgham',
  description: 'Noon sakinah/tanween suivi de YMNWLR — fusionner',
  detect(text, pos) {
    if (text[pos] !== AR.NOON) return null
    const diac = getDiacriticAfter(text, pos)
    if (!diac || (!isSukun(diac) && !isTanween(diac))) return null
    const next = getNextLetter(text, pos)
    if (!next) return null
    const allIdgham = [...AR.IDGHAM_GHUNNAH, ...AR.IDGHAM_NO_GHUNNAH]
    if (allIdgham.includes(next)) {
      const withGhunnah = AR.IDGHAM_GHUNNAH.includes(next)
      return {
        ruleId: this.id, ruleName: this.name, startIndex: pos, endIndex: pos + 2,
        category: this.category, severity: 'info',
        description: `Idgham ${withGhunnah ? 'avec ghunnah' : 'sans ghunnah'}: fusionner noon dans ${next}`,
      }
    }
    return null
  },
}

const noonSakinahIqlab: TajwidRule = {
  id: 'noon_sakinah_iqlab',
  name: 'Iqlab',
  name_ar: '\u0625\u0642\u0644\u0627\u0628',
  category: 'iqlab',
  description: 'Noon sakinah/tanween suivi de Ba — transformer en son Meem',
  detect(text, pos) {
    if (text[pos] !== AR.NOON) return null
    const diac = getDiacriticAfter(text, pos)
    if (!diac || (!isSukun(diac) && !isTanween(diac))) return null
    const next = getNextLetter(text, pos)
    if (next === AR.BA) {
      return {
        ruleId: this.id, ruleName: this.name, startIndex: pos, endIndex: pos + 2,
        category: this.category, severity: 'info',
        description: 'Iqlab: Noon avant Ba — prononcer comme Meem avec ghunnah',
      }
    }
    return null
  },
}

const qalqalahRule: TajwidRule = {
  id: 'qalqalah',
  name: 'Qalqalah',
  name_ar: '\u0642\u0644\u0642\u0644\u0629',
  category: 'qalqalah',
  description: 'Lettres Qalqalah avec sukun — son rebondissant',
  detect(text, pos) {
    if (!AR.QALQALAH_LETTERS.includes(text[pos])) return null
    const diac = getDiacriticAfter(text, pos)
    if (diac && isSukun(diac)) {
      return {
        ruleId: this.id, ruleName: this.name, startIndex: pos, endIndex: pos + 1,
        category: this.category, severity: 'info',
        description: `Qalqalah sur ${text[pos]} — produire un son rebondissant`,
      }
    }
    return null
  },
}

const ghunnahRule: TajwidRule = {
  id: 'ghunnah',
  name: 'Ghunnah',
  name_ar: '\u063A\u0646\u0651\u0629',
  category: 'ghunnah',
  description: 'Noon ou Meem avec shadda — son nasal 2 temps',
  detect(text, pos) {
    if (text[pos] !== AR.NOON && text[pos] !== AR.MEEM) return null
    const diac = getDiacriticAfter(text, pos)
    if (diac === AR.SHADDA) {
      const letter = text[pos] === AR.NOON ? 'Noon' : 'Meem'
      return {
        ruleId: this.id, ruleName: this.name, startIndex: pos, endIndex: pos + 1,
        category: this.category, severity: 'info',
        description: `Ghunnah: ${letter} mushaddad — tenir le nasal 2 temps`,
      }
    }
    return null
  },
}

const maddRule: TajwidRule = {
  id: 'madd_natural',
  name: 'Madd Tabii (Naturel)',
  name_ar: '\u0645\u062F \u0637\u0628\u064A\u0639\u064A',
  category: 'madd',
  description: 'Elongation naturelle — alif apres fatha, waw apres damma, ya apres kasra',
  detect(text, pos) {
    if (!AR.MADD_LETTERS.includes(text[pos])) return null
    if (pos < 1) return null
    if (text[pos] === '\u0627') {
      const prevDiac = getDiacriticAfter(text, pos - 1) || (pos >= 2 ? text[pos - 1] : null)
      if (prevDiac === AR.FATHA || text[pos - 1] === AR.FATHA) {
        return {
          ruleId: this.id, ruleName: this.name, startIndex: pos - 1, endIndex: pos + 1,
          category: this.category, severity: 'info',
          description: 'Madd Tabii: Allonger de 2 temps',
        }
      }
    }
    return null
  },
}

const meemSakinahIkhfa: TajwidRule = {
  id: 'meem_sakinah_ikhfa',
  name: 'Ikhfa Shafawi',
  name_ar: '\u0625\u062E\u0641\u0627\u0621 \u0634\u0641\u0648\u064A',
  category: 'meem_sakinah',
  description: 'Meem sakinah suivi de Ba — nasaliser aux levres',
  detect(text, pos) {
    if (text[pos] !== AR.MEEM) return null
    const diac = getDiacriticAfter(text, pos)
    if (!diac || !isSukun(diac)) return null
    const next = getNextLetter(text, pos)
    if (next === AR.BA) {
      return {
        ruleId: this.id, ruleName: this.name, startIndex: pos, endIndex: pos + 2,
        category: this.category, severity: 'info',
        description: 'Ikhfa Shafawi: Meem sakinah avant Ba — nasaliser aux levres',
      }
    }
    return null
  },
}

// ===================== ENGINE =====================

const ALL_RULES: TajwidRule[] = [
  noonSakinahIkhfa,
  noonSakinahIdgham,
  noonSakinahIqlab,
  qalqalahRule,
  ghunnahRule,
  maddRule,
  meemSakinahIkhfa,
]

export function analyzeTajwid(text: string, activeRules?: string[]): TajwidAnalysis {
  const rules = activeRules
    ? ALL_RULES.filter((r) => activeRules.includes(r.id))
    : ALL_RULES

  const occurrences: TajwidOccurrence[] = []

  for (let i = 0; i < text.length; i++) {
    for (const rule of rules) {
      const result = rule.detect(text, i)
      if (result) occurrences.push(result)
    }
  }

  const ruleBreakdown: Record<string, { found: number; errors: number }> = {}
  for (const occ of occurrences) {
    if (!ruleBreakdown[occ.ruleId]) ruleBreakdown[occ.ruleId] = { found: 0, errors: 0 }
    ruleBreakdown[occ.ruleId].found++
    if (occ.severity === 'error') ruleBreakdown[occ.ruleId].errors++
  }

  const totalRules = occurrences.length
  const errors = occurrences.filter((o) => o.severity === 'error').length
  const score = totalRules > 0 ? Math.round(((totalRules - errors) / totalRules) * 100) : 100

  return { text, occurrences, score, ruleBreakdown }
}

export function compareRecitation(
  expected: string,
  recited: string
): { accuracy: number; differences: string[] } {
  const normalize = (t: string) =>
    t.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, '').replace(/\s+/g, ' ').trim()

  const expectedNorm = normalize(expected)
  const recitedNorm = normalize(recited)

  if (expectedNorm === recitedNorm) return { accuracy: 100, differences: [] }

  const expectedWords = expectedNorm.split(' ')
  const recitedWords = recitedNorm.split(' ')
  const differences: string[] = []
  let matches = 0

  const maxLen = Math.max(expectedWords.length, recitedWords.length)
  for (let i = 0; i < maxLen; i++) {
    if (expectedWords[i] === recitedWords[i]) {
      matches++
    } else {
      differences.push(
        `Mot ${i + 1}: attendu "${expectedWords[i] || '(manquant)'}" recu "${recitedWords[i] || '(manquant)'}"`
      )
    }
  }

  const accuracy = maxLen > 0 ? Math.round((matches / maxLen) * 100) : 0
  return { accuracy, differences }
}

export function getAvailableRules(): Pick<TajwidRule, 'id' | 'name' | 'name_ar' | 'category' | 'description'>[] {
  return ALL_RULES.map(({ id, name, name_ar, category, description }) => ({
    id, name, name_ar, category, description,
  }))
}
