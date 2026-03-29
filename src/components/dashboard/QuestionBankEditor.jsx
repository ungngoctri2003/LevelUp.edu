import { emptyMcqDraft } from '../../lib/mcqQuestions.js'

const optLabels = ['A', 'B', 'C', 'D']

/**
 * Soạn bộ câu hỏi trắc nghiệm (text + 4 phương án + chọn đáp án đúng).
 * @param {{ value: object[], onChange: (next: object[]) => void, disabled?: boolean }} props
 */
export default function QuestionBankEditor({ value, onChange, disabled }) {
  const list = Array.isArray(value) ? value : []

  const updateAt = (idx, patch) => {
    const next = list.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    onChange(next)
  }

  const updateOption = (qIdx, optIdx, text) => {
    const q = list[qIdx] || emptyMcqDraft()
    const options = [...(Array.isArray(q.options) ? q.options : ['', '', '', ''])]
    while (options.length < 4) options.push('')
    options[optIdx] = text
    updateAt(qIdx, { options })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-400">
          Bộ câu hỏi trắc nghiệm ({list.length} câu). Chỉ câu đủ nội dung, ≥2 phương án và có đáp án trùng một phương án mới được lưu.
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...list, emptyMcqDraft()])}
          className="rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-40"
        >
          + Thêm câu
        </button>
      </div>

      {list.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center text-sm text-slate-500">
          Chưa có câu nào. Nhấn &quot;Thêm câu&quot; hoặc để trống nếu chỉ tạo khung đề (học viên sẽ thấy thông báo chưa có câu hỏi).
        </p>
      )}

      {list.map((q, qi) => (
        <div
          key={qi}
          className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">Câu {qi + 1}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(list.filter((_, i) => i !== qi))}
              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
            >
              Xóa câu
            </button>
          </div>
          <label className="block text-sm text-slate-400">
            Nội dung
            <textarea
              disabled={disabled}
              value={q.text || ''}
              onChange={(e) => updateAt(qi, { text: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-slate-100 placeholder:text-slate-600"
              placeholder="Nhập nội dung câu hỏi…"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {optLabels.map((label, oi) => (
              <label key={oi} className="block text-sm text-slate-400">
                Phương án {label}
                <input
                  disabled={disabled}
                  value={(q.options && q.options[oi]) || ''}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-slate-100"
                />
              </label>
            ))}
          </div>
          <label className="block text-sm text-slate-400">
            Đáp án đúng (trùng nội dung một trong các phương án)
            <select
              disabled={disabled}
              value={q.answer || ''}
              onChange={(e) => updateAt(qi, { answer: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-slate-100"
            >
              <option value="">— Chọn —</option>
              {(q.options || []).map((opt, oi) =>
                opt?.trim() ? (
                  <option key={oi} value={opt.trim()}>
                    {optLabels[oi] || String(oi + 1)}: {opt.trim()}
                  </option>
                ) : null,
              )}
            </select>
          </label>
        </div>
      ))}
    </div>
  )
}
