import { useState, useCallback } from 'react'
import { loadProgress, saveSession, clearProgress } from '../utils/storage.js'

export function useProgress() {
  const [data, setData] = useState(() => loadProgress())

  const recordSession = useCallback((session) => {
    saveSession(session)
    setData(loadProgress())
  }, [])

  const clear = useCallback(() => {
    clearProgress()
    setData(loadProgress())
  }, [])

  return { data, recordSession, clear }
}
