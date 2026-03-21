import { useCallback, useEffect, useState } from 'react'
import { loadAdminState, patchAdminState, saveAdminState, subscribeAdmin } from '../utils/adminStorage'

export function useAdminState() {
  const [state, setState] = useState(loadAdminState)

  useEffect(() => {
    return subscribeAdmin(() => setState(loadAdminState()))
  }, [])

  const update = useCallback((updater) => {
    if (typeof updater === 'function') {
      const next = updater(loadAdminState())
      saveAdminState(next)
      setState(next)
    } else {
      const next = { ...loadAdminState(), ...updater }
      saveAdminState(next)
      setState(next)
    }
  }, [])

  const refresh = useCallback(() => setState(loadAdminState()), [])

  return { state, update, refresh }
}
