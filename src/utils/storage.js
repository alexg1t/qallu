const KEY = 'qallu_progress_v1'
const VERSION = 1
const MAX_SESSIONS = 100

function empty() {
  return { version: VERSION, sessions: [], exerciseStats: {} }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const data = JSON.parse(raw)
    if (!data.version || data.version < VERSION) return empty()
    return data
  } catch {
    return empty()
  }
}

export function saveSession(session) {
  try {
    const data = loadProgress()
    data.sessions.unshift(session)
    if (data.sessions.length > MAX_SESSIONS) data.sessions = data.sessions.slice(0, MAX_SESSIONS)

    const prev = data.exerciseStats[session.exerciseId] || { timesCompleted: 0, bestAccuracy: 0, averageAccuracy: 0 }
    const times = prev.timesCompleted + 1
    data.exerciseStats[session.exerciseId] = {
      timesCompleted: times,
      lastCompletedAt: session.completedAt,
      bestAccuracy: Math.max(prev.bestAccuracy, session.accuracy),
      averageAccuracy: (prev.averageAccuracy * prev.timesCompleted + session.accuracy) / times,
    }

    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // QuotaExceededError or similar — fail silently
  }
}

export function clearProgress() {
  localStorage.removeItem(KEY)
}
