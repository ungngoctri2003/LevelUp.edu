import { describe, expect, it } from 'vitest'
import { safePostAuthPath } from './authRedirect.js'

describe('safePostAuthPath', () => {
  it('returns null for unsafe or empty input', () => {
    expect(safePostAuthPath('', 'user')).toBeNull()
    expect(safePostAuthPath('https://evil.com', 'user')).toBeNull()
    expect(safePostAuthPath('//evil.com', 'user')).toBeNull()
    expect(safePostAuthPath('/admin', 'teacher')).toBeNull()
    expect(safePostAuthPath('/giao-vien/lop', 'user')).toBeNull()
  })

  it('allows internal paths for matching role', () => {
    expect(safePostAuthPath('/giao-vien/lop/1', 'teacher')).toBe('/giao-vien/lop/1')
    expect(safePostAuthPath('/hoc-vien/bai-tap', 'user')).toBe('/hoc-vien/bai-tap')
    expect(safePostAuthPath('/admin/hoc-vien', 'admin')).toBe('/admin/hoc-vien')
    expect(safePostAuthPath('/bai-giang', 'user')).toBe('/bai-giang')
  })

  it('allows query on safe path', () => {
    expect(safePostAuthPath('/bai-kiem-tra?exam=3', 'teacher')).toBe('/bai-kiem-tra?exam=3')
  })
})
