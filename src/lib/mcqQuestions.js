/** Một câu trắc nghiệm lưu DB / dùng chung đề & bài tập: { text, options[], answer } */

export function emptyMcqDraft() {
  return { text: '', options: ['', '', '', ''], answer: '' }
}

/** Chuẩn hóa câu từ DB để đưa vào form (đủ 4 ô phương án). */
export function questionBankDraftsFromStored(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((q) => {
    const text = typeof q?.text === 'string' ? q.text : ''
    const answer = typeof q?.answer === 'string' ? q.answer : ''
    const o = Array.isArray(q?.options) ? q.options.map((x) => String(x ?? '')) : []
    const options = ['', '', '', '']
    for (let i = 0; i < 4; i++) options[i] = o[i] ?? ''
    return { text, options, answer }
  })
}

/** Chuẩn hóa và chỉ giữ câu hợp lệ (đủ nội dung, ≥2 phương án, đáp án thuộc phương án). */
export function sanitizeMcqBankForDatabase(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((q) => {
      const text = typeof q?.text === 'string' ? q.text.trim() : ''
      const rawOpts = Array.isArray(q?.options) ? q.options : []
      const options = rawOpts.map((o) => String(o ?? '').trim()).filter(Boolean)
      const answer = typeof q?.answer === 'string' ? q.answer.trim() : ''
      return { text, options, answer }
    })
    .filter((q) => q.text && q.options.length >= 2 && q.answer && q.options.includes(q.answer))
}

/** Ẩn đáp án đúng khi trả về cho học sinh. */
export function stripMcqAnswersForClient(questions) {
  if (!Array.isArray(questions)) return []
  return questions.map((q) => ({
    text: typeof q?.text === 'string' ? q.text : '',
    options: Array.isArray(q?.options) ? q.options.filter((x) => typeof x === 'string') : [],
  }))
}

/** Chấm theo thứ tự câu trong mảng; answers: { "0": "A", "1": "B" } hoặc { 0: "A" } */
/**
 * Câu hợp lệ để làm bài (không cần answer). sourceIndex = vị trí trong mảng gốc DB (để gửi/nộp đáp án).
 */
export function normalizeMcqForTaking(raw) {
  const arr = Array.isArray(raw) ? raw : []
  const out = []
  arr.forEach((q, sourceIndex) => {
    const text = typeof q?.text === 'string' ? q.text.trim() : ''
    const options = Array.isArray(q?.options) ? q.options.filter((x) => typeof x === 'string') : []
    if (!text || options.length < 2) return
    out.push({ id: out.length + 1, sourceIndex, text, options })
  })
  return out
}

export function allMcqSourceIndicesAnswered(takingList, answers) {
  if (!takingList?.length) return true
  if (!answers || typeof answers !== 'object') return false
  for (const t of takingList) {
    const v = answers[String(t.sourceIndex)] ?? answers[t.sourceIndex]
    if (v == null || String(v).trim() === '') return false
  }
  return true
}

export function gradeMcqAttempt(questions, answers) {
  const qs = Array.isArray(questions) ? questions : []
  if (qs.length === 0) return { correct: 0, total: 0, score: 0, maxScore: 10 }
  let correct = 0
  for (let i = 0; i < qs.length; i++) {
    const key = String(i)
    const picked =
      answers && typeof answers === 'object'
        ? answers[key] ?? answers[i]
        : undefined
    const exp = typeof qs[i]?.answer === 'string' ? qs[i].answer.trim() : ''
    const got = picked != null ? String(picked).trim() : ''
    if (exp && got === exp) correct += 1
  }
  const total = qs.length
  const maxScore = 10
  const score = total > 0 ? Math.round((correct / total) * maxScore * 10) / 10 : 0
  return { correct, total, score, maxScore }
}
