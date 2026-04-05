import { describe, expect, it } from 'vitest'
import { sanitizeMcqBankForDatabase } from './mcqQuestions.js'

describe('sanitizeMcqBankForDatabase', () => {
  it('drops invalid items and keeps valid MCQs', () => {
    const out = sanitizeMcqBankForDatabase([
      { text: '  ', options: ['A', 'B'], answer: 'A' },
      { text: 'Câu 1', options: [' A ', ' B '], answer: 'A' },
      { text: 'Câu 2', options: ['X'], answer: 'X' },
    ])
    expect(out).toHaveLength(1)
    expect(out[0].text).toBe('Câu 1')
    expect(out[0].options).toEqual(['A', 'B'])
    expect(out[0].answer).toBe('A')
  })
})
