import { analyzeTajwid, compareRecitation, getAvailableRules } from '@/features/tajwid-engine'

describe('Tajwid Engine', () => {
  describe('getAvailableRules', () => {
    it('devrait retourner toutes les regles', () => {
      const rules = getAvailableRules()
      expect(rules.length).toBeGreaterThanOrEqual(7)
      expect(rules.map((r) => r.id)).toContain('noon_sakinah_ikhfa')
      expect(rules.map((r) => r.id)).toContain('qalqalah')
      expect(rules.map((r) => r.id)).toContain('ghunnah')
    })

    it('chaque regle doit avoir les champs requis', () => {
      const rules = getAvailableRules()
      rules.forEach((rule) => {
        expect(rule.id).toBeTruthy()
        expect(rule.name).toBeTruthy()
        expect(rule.name_ar).toBeTruthy()
        expect(rule.category).toBeTruthy()
      })
    })
  })

  describe('analyzeTajwid', () => {
    it('detecter qalqalah sur lettre avec sukun', () => {
      const text = '\u0628\u0652' // ba + sukun
      const result = analyzeTajwid(text)
      const qalqalah = result.occurrences.filter((o) => o.ruleId === 'qalqalah')
      expect(qalqalah.length).toBeGreaterThanOrEqual(1)
    })

    it('detecter ghunnah sur noon mushaddad', () => {
      const text = '\u0646\u0651' // noon + shadda
      const result = analyzeTajwid(text)
      const ghunnah = result.occurrences.filter((o) => o.ruleId === 'ghunnah')
      expect(ghunnah.length).toBe(1)
    })

    it('detecter ghunnah sur meem mushaddad', () => {
      const text = '\u0645\u0651' // meem + shadda
      const result = analyzeTajwid(text)
      const ghunnah = result.occurrences.filter((o) => o.ruleId === 'ghunnah')
      expect(ghunnah.length).toBe(1)
    })

    it('score 100 sans erreurs', () => {
      const result = analyzeTajwid('hello')
      expect(result.score).toBe(100)
    })

    it('filtrer par regles actives', () => {
      const text = '\u0646\u0651'
      const result = analyzeTajwid(text, ['qalqalah'])
      const ghunnah = result.occurrences.filter((o) => o.ruleId === 'ghunnah')
      expect(ghunnah.length).toBe(0)
    })
  })

  describe('compareRecitation', () => {
    it('100% pour textes identiques', () => {
      const text = '\u0628\u0633\u0645 \u0627\u0644\u0644\u0647'
      const result = compareRecitation(text, text)
      expect(result.accuracy).toBe(100)
      expect(result.differences).toHaveLength(0)
    })

    it('detecter les differences', () => {
      const expected = '\u0628\u0633\u0645 \u0627\u0644\u0644\u0647'
      const recited = '\u0628\u0633\u0645 \u0627\u0644\u0631\u062D\u0645\u0646'
      const result = compareRecitation(expected, recited)
      expect(result.accuracy).toBeLessThan(100)
      expect(result.differences.length).toBeGreaterThan(0)
    })

    it('ignorer les diacritiques', () => {
      const withDiac = '\u0628\u0650\u0633\u0652\u0645\u0650'
      const withoutDiac = '\u0628\u0633\u0645'
      const result = compareRecitation(withDiac, withoutDiac)
      expect(result.accuracy).toBe(100)
    })
  })
})
