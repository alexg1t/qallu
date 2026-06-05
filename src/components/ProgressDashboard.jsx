import { TYPE_LABELS } from '../data/exercises.js'

export default function ProgressDashboard({ data, onClear, onBack }) {
  const { sessions, exerciseStats } = data
  const hasData = sessions.length > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Mi progreso</h1>
      </div>

      {!hasData && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">📊</p>
          <p>Completa tu primer ejercicio para ver tu progreso aquí.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Sesiones" value={sessions.length} />
            <StatCard
              label="Precisión media"
              value={`${Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length * 100)}%`}
            />
            <StatCard
              label="Mejor precisión"
              value={`${Math.round(Math.max(...sessions.map(s => s.accuracy)) * 100)}%`}
            />
          </div>

          <div className="space-y-3 mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sesiones recientes</h2>
            {sessions.slice(0, 20).map(s => (
              <div key={s.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-3">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{s.exerciseId}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {TYPE_LABELS[s.exerciseType]} · {formatDate(s.completedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${s.accuracy >= 0.85 ? 'text-green-600' : s.accuracy >= 0.6 ? 'text-amber-500' : 'text-red-500'}`}>
                    {Math.round(s.accuracy * 100)}%
                  </p>
                  <p className="text-xs text-gray-400">{formatDuration(s.durationSeconds)}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => { if (confirm('¿Borrar todo el historial?')) onClear() }}
            className="text-sm text-red-400 hover:text-red-600 transition-colors"
          >
            Borrar historial
          </button>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatDuration(seconds) {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
