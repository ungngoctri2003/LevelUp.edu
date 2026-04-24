import { describe, expect, it } from 'vitest'
import {
  countByStudentStatus,
  countByTeacherStatus,
  countPaymentStatusByKind,
  examAttemptPerStudentBuckets,
  topClassesByEnrollment,
  countCoursesVisibility,
  countByField,
  summarizeExamsMetrics,
  countStudentsBySource,
  countPaymentsBySource,
  teacherClassLoadBuckets,
} from './adminStatsHelpers.js'

describe('countByStudentStatus', () => {
  it('groups by status and sorts by count desc', () => {
    const out = countByStudentStatus([
      { status: 'active' },
      { status: 'trial' },
      { status: 'active' },
      { status: 'inactive' },
    ])
    expect(out.find((x) => x.key === 'active')?.value).toBe(2)
    expect(out.find((x) => x.key === 'trial')?.value).toBe(1)
    expect(out.find((x) => x.key === 'inactive')?.value).toBe(1)
    expect(out[0].key).toBe('active')
  })

  it('defaults missing status to active', () => {
    const out = countByStudentStatus([{}, { status: 'trial' }])
    expect(out.find((x) => x.key === 'active')?.value).toBe(1)
    expect(out.find((x) => x.key === 'trial')?.value).toBe(1)
  })
})

describe('countByTeacherStatus', () => {
  it('groups teachers by approval status', () => {
    const out = countByTeacherStatus([{ status: 'approved' }, { status: 'pending' }, { status: 'approved' }])
    expect(out.find((x) => x.key === 'approved')?.value).toBe(2)
    expect(out.find((x) => x.key === 'pending')?.value).toBe(1)
  })
})

describe('topClassesByEnrollment', () => {
  it('sorts by student_count and respects limit', () => {
    const out = topClassesByEnrollment(
      [
        { id: 1, name: 'A', student_count: 3 },
        { id: 2, name: 'B', student_count: 10 },
        { id: 3, name: 'C', student_count: 5 },
      ],
      2,
    )
    expect(out).toHaveLength(2)
    expect(out[0].label).toBe('B')
    expect(out[0].value).toBe(10)
    expect(out[1].value).toBe(5)
  })
})

describe('countPaymentStatusByKind', () => {
  it('stacks class vs course per status in fixed order', () => {
    const out = countPaymentStatusByKind([
      { payment_status: 'pending', payment_kind: 'class' },
      { payment_status: 'pending', payment_kind: 'course' },
      { payment_status: 'paid', payment_kind: 'class' },
      { payment_status: 'cancelled', payment_kind: 'course' },
    ])
    expect(out.map((r) => r.status)).toEqual(['pending', 'paid', 'cancelled'])
    const pend = out.find((r) => r.status === 'pending')
    expect(pend.class).toBe(1)
    expect(pend.course).toBe(1)
    expect(out.find((r) => r.status === 'paid').class).toBe(1)
    expect(out.find((r) => r.status === 'cancelled').course).toBe(1)
  })

  it('treats non-course as class kind', () => {
    const out = countPaymentStatusByKind([{ payment_status: 'paid' }])
    expect(out.find((r) => r.status === 'paid').class).toBe(1)
    expect(out.find((r) => r.status === 'paid').course).toBe(0)
  })
})

describe('examAttemptPerStudentBuckets', () => {
  it('buckets attempt counts and computes zero from totalStudents', () => {
    const out = examAttemptPerStudentBuckets({ a: 1, b: 2, c: 4, d: 7 }, 10)
    const byLabel = Object.fromEntries(out.map((x) => [x.label, x.value]))
    expect(byLabel['0 lượt']).toBe(6)
    expect(byLabel['1–2 lượt']).toBe(2)
    expect(byLabel['3–5 lượt']).toBe(1)
    expect(byLabel['6+ lượt']).toBe(1)
  })

  it('handles empty attempt map', () => {
    const out = examAttemptPerStudentBuckets({}, 5)
    expect(out.find((x) => x.label === '0 lượt')?.value).toBe(5)
    expect(out.filter((x) => x.label !== '0 lượt').every((x) => x.value === 0)).toBe(true)
  })
})

describe('countCoursesVisibility', () => {
  it('counts visible vs hidden', () => {
    const out = countCoursesVisibility([{ visible: true }, { visible: false }, {}])
    expect(out.find((x) => x.key === 'visible')?.value).toBe(2)
    expect(out.find((x) => x.key === 'hidden')?.value).toBe(1)
  })
})

describe('countByField', () => {
  it('aggregates and merges tail into Khác when over limit', () => {
    const items = [
      { s: 'A' },
      { s: 'A' },
      { s: 'B' },
      { s: 'C' },
      { s: 'D' },
    ]
    const out = countByField(items, 's', { limit: 3, otherLabel: 'Khác' })
    expect(out.find((x) => x.label === 'A')?.value).toBe(2)
    expect(out.find((x) => x.label === 'Khác')?.value).toBe(2)
  })
})

describe('summarizeExamsMetrics', () => {
  it('computes published and assigned counts', () => {
    const out = summarizeExamsMetrics([
      { published: true, assigned: true },
      { published: false, assigned: false },
    ])
    const byLabel = Object.fromEntries(out.map((x) => [x.label, x.value]))
    expect(byLabel['Đã xuất bản']).toBe(1)
    expect(byLabel['Chưa xuất bản']).toBe(1)
    expect(byLabel['Đã giao bài']).toBe(1)
    expect(byLabel['Chưa giao bài']).toBe(1)
  })
})

describe('countStudentsBySource', () => {
  it('groups by source with default registered', () => {
    const out = countStudentsBySource([{ source: 'admin' }, {}])
    expect(out.find((x) => x.key === 'admin')?.value).toBe(1)
    expect(out.find((x) => x.key === 'registered')?.value).toBe(1)
  })
})

describe('countPaymentsBySource', () => {
  it('labels known sources', () => {
    const out = countPaymentsBySource([{ payment_source: 'momo' }, {}])
    expect(out.find((x) => x.key === 'momo')?.label).toBe('MoMo')
    expect(out.find((x) => x.key === 'other')?.value).toBe(1)
  })
})

describe('teacherClassLoadBuckets', () => {
  it('buckets by class count', () => {
    const out = teacherClassLoadBuckets([{ classes: 0 }, { classes: 1 }, { classes: 2 }, { classes: 5 }])
    const byLabel = Object.fromEntries(out.map((x) => [x.label, x.value]))
    expect(byLabel['0 lớp']).toBe(1)
    expect(byLabel['1 lớp']).toBe(1)
    expect(byLabel['2 lớp']).toBe(1)
    expect(byLabel['3+ lớp']).toBe(1)
  })
})

