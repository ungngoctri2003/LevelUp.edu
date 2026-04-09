/** Class Tailwind dùng chung cho khu vực dashboard — đồng bộ sáng/tối với ThemeContext (html.dark) */

/** Viền/nền/focus — ghép với rounded + padding (vd. QuestionBankEditor dùng rounded-lg py-2) */
export const inputAdminField =
  'w-full border border-slate-400 bg-white text-sm text-gray-900 shadow-sm placeholder:text-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-white/15 dark:bg-black/35 dark:shadow-none dark:text-white dark:placeholder:text-slate-500'

export const inputTeacherField =
  'w-full border border-slate-400 bg-white text-sm text-gray-900 shadow-sm placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/15 dark:bg-black/35 dark:shadow-none dark:text-white dark:placeholder:text-slate-500'

export const inputStudentField =
  'w-full border border-slate-400 bg-white text-sm text-gray-900 shadow-sm placeholder:text-slate-500 focus:border-sky-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-black/35 dark:shadow-none dark:text-white dark:placeholder:text-slate-500'

export const inputAdmin = `rounded-xl px-3 py-2.5 ${inputAdminField}`

export const inputTeacher = `rounded-xl px-3 py-2.5 ${inputTeacherField}`

export const inputStudent = `rounded-xl px-3 py-2.5 ${inputStudentField}`

export const tableHeadAdmin =
  'border-b border-slate-300 bg-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-800 dark:border-white/10 dark:bg-black/20 dark:text-slate-400'

export const tableHeadTeacher =
  'border-b border-slate-300 bg-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-800 dark:border-white/10 dark:bg-black/20 dark:text-slate-400'

export const tableBodyAdmin =
  'divide-y divide-slate-200 text-slate-900 dark:divide-white/5 dark:text-slate-200'

export const tableBodyTeacher =
  'divide-y divide-slate-200 text-slate-900 dark:divide-white/5 dark:text-slate-200'

export const tableRowHover = 'hover:bg-slate-100 dark:hover:bg-white/5'

/** Bọc bảng — khung rõ trên nền dashboard sáng */
export const tableShell =
  'overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none'

export const modalBackdrop =
  'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md dark:bg-black/75'

export const modalPanelAdmin =
  'w-full max-w-lg rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl ring-1 ring-slate-300/70 dark:border-white/15 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 dark:shadow-cyan-500/10 dark:ring-white/10'

export const modalPanelTeacher =
  'w-full max-w-lg rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl ring-1 ring-slate-300/70 dark:border-white/15 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 dark:shadow-emerald-500/10 dark:ring-white/10'

export const btnPrimaryAdmin =
  'rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/15 transition hover:opacity-95'

export const btnPrimaryTeacher =
  'rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:opacity-95'

export const btnPrimaryStudent =
  'rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:opacity-95'

/** Nút phụ / hủy — viền + chữ theo theme */
export const btnSecondaryAdmin =
  'rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/5'

export const modalTitle = 'text-lg font-semibold text-gray-900 dark:text-white'

export const labelAdmin = 'block text-sm font-medium text-slate-700 dark:text-slate-400'
