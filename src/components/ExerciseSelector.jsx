import { exercises, TYPE_LABELS, DIFFICULTY_LABELS } from '../data/exercises.js'

const TYPE_COLORS = {
  'minimal-pairs': 'bg-blue-50 text-blue-700 border-blue-100',
  'visual-pacer': 'bg-purple-50 text-purple-700 border-purple-100',
  'emphasis-focus': 'bg-orange-50 text-orange-700 border-orange-100',
  'tongue-twister': 'bg-rose-50 text-rose-700 border-rose-100',
}

const DIFFICULTY_COLORS = {
  beginner: 'text-green-600',
  intermediate: 'text-amber-600',
  advanced: 'text-red-500',
}

export default function ExerciseSelector({ onSelect, exerciseStats, onProgressClick }) {
  const grouped = {
    'minimal-pairs': exercises.filter(e => e.type === 'minimal-pairs'),
    'visual-pacer': exercises.filter(e => e.type === 'visual-pacer'),
    'emphasis-focus': exercises.filter(e => e.type === 'emphasis-focus'),
    'tongue-twister': exercises.filter(e => e.type === 'tongue-twister'),
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Qallu</h1>
          <p className="text-gray-500 mt-1">Mejora tu dicción en español</p>
        </div>
        <button
          onClick={onProgressClick}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2"
        >
          Mi progreso →
        </button>
      </header>

      <div className="space-y-8">
        {Object.entries(grouped).map(([type, list]) => (
          <section key={type}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              {TYPE_LABELS[type]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map(ex => {
                const stats = exerciseStats[ex.id]
                return (
                  <button
                    key={ex.id}
                    onClick={() => onSelect(ex.id)}
                    className="text-left p-5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[ex.type]}`}>
                        {TYPE_LABELS[ex.type]}
                      </span>
                      {stats && (
                        <span className="text-xs text-green-600 font-medium">
                          ✓ {Math.round(stats.bestAccuracy * 100)}% mejor
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                      {ex.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ex.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span className={DIFFICULTY_COLORS[ex.difficulty]}>
                        {DIFFICULTY_LABELS[ex.difficulty]}
                      </span>
                      <span>·</span>
                      <span>~{ex.estimatedMinutes} min</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
