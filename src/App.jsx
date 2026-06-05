import { useState } from 'react'
import ExerciseSelector from './components/ExerciseSelector.jsx'
import ExercisePlayer from './components/ExercisePlayer.jsx'
import ProgressDashboard from './components/ProgressDashboard.jsx'
import { useProgress } from './hooks/useProgress.js'

export default function App() {
  const [view, setView] = useState('home')
  const [activeExerciseId, setActiveExerciseId] = useState(null)
  const { data: progressData, recordSession, clear } = useProgress()

  function handleSelectExercise(id) {
    setActiveExerciseId(id)
    setView('exercise')
  }

  function handleComplete(sessionResult) {
    recordSession(sessionResult)
    // ExercisePlayer handles the completed view internally; no view change needed here
  }

  function handleBackFromExercise() {
    setView('home')
    setActiveExerciseId(null)
  }

  if (view === 'progress') {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProgressDashboard
          data={progressData}
          onClear={clear}
          onBack={() => setView('home')}
        />
      </div>
    )
  }

  if (view === 'exercise' && activeExerciseId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ExercisePlayer
          exerciseId={activeExerciseId}
          onComplete={handleComplete}
          onBack={handleBackFromExercise}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ExerciseSelector
        onSelect={handleSelectExercise}
        exerciseStats={progressData.exerciseStats}
        onProgressClick={() => setView('progress')}
      />
    </div>
  )
}
