import { describe, expect, it } from 'vitest'
import { postAuthPathFromLocation, safePostAuthPath } from './authRedirect.js'

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
    expect(safePostAuthPath('/hoc-vien/khoa-hoc#student-section-bai-tap', 'user')).toBe(
      '/hoc-vien/khoa-hoc#student-section-bai-tap',
    )
    expect(safePostAuthPath('/admin/hoc-vien', 'admin')).toBe('/admin/hoc-vien')
    expect(safePostAuthPath('/bai-giang', 'user')).toBe('/bai-giang')
  })

  it('allows query on safe path', () => {
    expect(safePostAuthPath('/bai-kiem-tra?exam=3', 'teacher')).toBe('/bai-kiem-tra?exam=3')
  })
})

describe('postAuthPathFromLocation', () => {
  it('strips auth from query and keeps other params', () => {
    expect(postAuthPathFromLocation('/khoa-hoc', '?auth=login&utm=1', '', 'user')).toBe('/khoa-hoc?utm=1')
  })

  it('allows public path for any role', () => {
    expect(postAuthPathFromLocation('/bai-giang', '', '', 'teacher')).toBe('/bai-giang')
  })

  it('returns null when pathname requires different role', () => {
    expect(postAuthPathFromLocation('/admin', '', '', 'user')).toBeNull()
    expect(postAuthPathFromLocation('/admin/hoc-vien', '?tab=1', '', 'teacher')).toBeNull()
  })

  it('preserves hash', () => {
    expect(postAuthPathFromLocation('/lop-hoc', '?x=1', '#phan-1', 'user')).toBe('/lop-hoc?x=1#phan-1')
  })
})
