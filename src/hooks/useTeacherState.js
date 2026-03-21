import { useCallback, useEffect, useState } from 'react'
import { loadTeacherState, saveTeacherState, subscribeTeacher } from '../utils/teacherStorage'

export function useTeacherState() {
  const [state, setState] = useState(loadTeacherState)

  useEffect(() => {
    return subscribeTeacher(() => setState(loadTeacherState()))
  }, [])

  const update = useCallback((updater) => {
    if (typeof updater === 'function') {
      const next = updater(loadTeacherState())
      saveTeacherState(next)
      setState(next)
    } else {
      const next = { ...loadTeacherState(), ...updater }
      saveTeacherState(next)
      setState(next)
    }
  }, [])

  const refresh = useCallback(() => setState(loadTeacherState()), [])

  return { state, update, refresh }
}
