import { useEffect } from 'react'
import { useExerciseSession } from '../hooks/useExerciseSession.js'
import WordHighlighter from './WordHighlighter.jsx'
import ControlBar from './ControlBar.jsx'
import PermissionScreen from './PermissionScreen.jsx'
import ResultsCard from './ResultsCard.jsx'
import { TYPE_LABELS } from '../data/exercises.js'

export default function ExercisePlayer({ exerciseId, onComplete, onBack }) {
  const {
    session,
    exercise,
    currentTokens,
    currentRound,
    currentItem,
    speech,
    accuracy,
    elapsedSeconds,
    controls,
  } = useExerciseSession(exerciseId)

  useEffect(() => {
    if (session.status === 'completed') {
      onComplete({
        id: `sess_${Date.now()}`,
        exerciseId: exercise.id,
        exerciseType: exercise.type,
        completedAt: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
        accuracy,
        problemWords: Object.keys(session.problemWords),
        totalWords: session.totalWords,
        correctWords: session.correctWords,
      })
    }
  }, [session.status])

  if (!speech.isSupported) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <BackButton onBack={onBack} />
        <ControlBar isSupported={false} status="idle" />
      </div>
    )
  }

  if (session.status === 'completed') {
    const wpm = elapsedSeconds > 0 ? Math.round((session.correctWords / elapsedSeconds) * 60) : 0

    let targetWpm = null
    if (exercise.type === 'visual-pacer') {
      const { syllableCounts, targetSyllablesPerSecond } = exercise.content
      const totalSyllables = syllableCounts.reduce((a, b) => a + b, 0)
      const totalSeconds = totalSyllables / targetSyllablesPerSecond
      targetWpm = Math.round((syllableCounts.length / totalSeconds) * 60)
    }

    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <ResultsCard
          exercise={exercise}
          accuracy={accuracy}
          elapsedSeconds={elapsedSeconds}
          segmentResults={session.segmentResults}
          wpm={wpm}
          targetWpm={targetWpm}
          onRepeat={controls.stop}
          onHome={onBack}
        />
      </div>
    )
  }

  const needsPermission =
    session.status === 'idle' &&
    speech.permissionStatus !== 'granted'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <BackButton onBack={() => { controls.stop(); onBack() }} />
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            {TYPE_LABELS[exercise.type]}
          </p>
          <h1 className="text-xl font-bold text-gray-800">{exercise.title}</h1>
        </div>
        {(exercise.type === 'minimal-pairs' || exercise.type === 'tongue-twister') && (
          <span className="ml-auto text-sm text-gray-400">
            {session.sentenceIndex + 1} / {exercise.content.sentences.length}
          </span>
        )}
        {exercise.type === 'emphasis-focus' && (
          <span className="ml-auto text-sm text-gray-400">
            Ronda {session.roundIndex + 1} / {exercise.content.rounds.length}
          </span>
        )}
        {exercise.type === 'intonation-focus' && (
          <span className="ml-auto text-sm text-gray-400">
            {session.sentenceIndex + 1} / {exercise.content.items.length}
          </span>
        )}
      </div>

      {needsPermission ? (
        <PermissionScreen
          status={speech.permissionStatus}
          onRequest={controls.start}
        />
      ) : (
        <div className="flex flex-col items-center gap-10">
          {session.status === 'countdown' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm text-gray-400 uppercase tracking-widest">Prepárate</p>
              <div className="flex items-center justify-center w-28 h-28 rounded-full bg-indigo-600 shadow-lg">
                <span className="text-white text-6xl font-bold tabular-nums">
                  {session.countdownValue}
                </span>
              </div>
            </div>
          )}

          {session.status !== 'countdown' && (
            <>
              {exercise.type === 'emphasis-focus' && currentRound && session.status === 'active' && !session.emphasisCheck && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-6 py-3 text-center">
                  <p className="text-sm text-indigo-600 font-medium">{currentRound.meaning}</p>
                </div>
              )}

              {exercise.type === 'intonation-focus' && currentItem && session.status === 'active' && !session.intonationCheck && (
                <div className="bg-violet-50 border border-violet-100 rounded-xl px-6 py-3 text-center">
                  <p className="text-4xl leading-none mb-1">
                    {currentItem.targetPattern === 'rising' ? '↗' : '↘'}
                  </p>
                  <p className="text-sm text-violet-600 font-medium">{currentItem.hint}</p>
                </div>
              )}

              {exercise.type === 'visual-pacer' && session.status === 'idle' && (
                <div className="text-center text-gray-500 text-sm max-w-xs">
                  El pacer irá resaltando cada palabra al ritmo objetivo. Habla siguiendo el ritmo.
                </div>
              )}

              {exercise.type === 'visual-pacer' &&
               session.status === 'active' &&
               session.activeIndex >= currentTokens.length && (
                <div className="text-sm text-indigo-500 animate-pulse">
                  Procesando reconocimiento…
                </div>
              )}
            </>
          )}

          <WordHighlighter
            tokens={currentTokens}
            statuses={session.wordStatuses}
            activeIndex={session.activeIndex}
            emphasizedIndex={currentRound?.emphasizedIndex}
          />

          {session.emphasisCheck && currentRound ? (
            <EmphasisFeedback
              check={session.emphasisCheck}
              round={currentRound}
              tokens={currentTokens}
              onConfirm={controls.confirmRound}
              onRepeat={controls.repeatRound}
            />
          ) : session.intonationCheck && currentItem ? (
            <IntonationFeedback
              check={session.intonationCheck}
              item={currentItem}
              onConfirm={controls.confirmRound}
              onRepeat={controls.repeatRound}
            />
          ) : (
            <ControlBar
              status={session.status}
              isListening={speech.isListening}
              audioDetected={speech.audioDetected}
              error={session.error || speech.error}
              isSupported={speech.isSupported}
              onStart={controls.start}
              onPause={controls.pause}
              onResume={controls.resume}
              onStop={() => { controls.stop(); onBack() }}
            />
          )}

          {session.status === 'active' && session.totalWords > 0 && (
            <div className="text-sm text-gray-400">
              Precisión actual: {Math.round(accuracy * 100)}%
            </div>
          )}

          {session.status === 'active' && (
            <div className="w-full max-w-md bg-gray-100 border border-gray-200 rounded-lg p-3 text-xs space-y-1">
              <p className="text-gray-400 font-medium">Debug</p>
              <p className="text-gray-600">
                escuchando: {speech.isListening ? 'SÍ' : 'NO'}
                {' · '}audio: {speech.audioDetected ? 'SÍ' : 'NO'}
              </p>
              {speech.finalTranscript && (
                <p className="text-green-700 break-words">
                  final: {speech.finalTranscript}
                </p>
              )}
              {speech.interimTranscript && (
                <p className="text-amber-600 break-words">
                  interim: {speech.interimTranscript}
                </p>
              )}
              {!speech.finalTranscript && !speech.interimTranscript && (
                <p className="text-red-500">
                  Sin transcripcion — el reconocedor no produce texto
                </p>
              )}
              {speech.error && (
                <p className="text-red-600 font-medium">
                  error: {speech.error.code} — {speech.error.message}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BackButton({ onBack }) {
  return (
    <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
      ←
    </button>
  )
}

function EmphasisFeedback({ check, round, tokens, onConfirm, onRepeat }) {
  const emphasized = tokens[round.emphasizedIndex]

  if (check === 'detected') {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 text-center w-full">
          <p className="text-sm text-green-600 font-semibold mb-1">¡Énfasis detectado!</p>
          <p className="text-2xl font-exercise font-bold text-green-800 tracking-wide">
            {emphasized}
          </p>
          <p className="text-xs text-green-500 mt-2 italic">{round.meaning}</p>
        </div>
        <p className="text-xs text-gray-400">Avanzando al siguiente round…</p>
      </div>
    )
  }

  if (check === 'weak') {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 text-center w-full">
          <p className="text-sm text-amber-700 font-semibold mb-1">No se detectó énfasis suficiente</p>
          <p className="text-2xl font-exercise font-bold text-amber-900 tracking-wide">
            {emphasized}
          </p>
          <p className="text-xs text-amber-600 mt-2">Habla más fuerte y alarga esa palabra</p>
        </div>
        <button
          onClick={onRepeat}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // 'manual' fallback — audio data unavailable, ask the user
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 text-center w-full">
        <p className="text-sm text-amber-700 font-semibold mb-1">¿Enfatizaste esta palabra?</p>
        <p className="text-2xl font-exercise font-bold text-amber-900 tracking-wide">
          {emphasized}
        </p>
        <p className="text-xs text-amber-600 mt-2 italic">{round.meaning}</p>
      </div>
      <div className="flex gap-3 w-full">
        <button
          onClick={onConfirm}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Sí, lo logré
        </button>
        <button
          onClick={onRepeat}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
        >
          Repetir
        </button>
      </div>
    </div>
  )
}

function IntonationFeedback({ check, item, onConfirm, onRepeat }) {
  const arrow = item.targetPattern === 'rising' ? '↗' : '↘'
  const label = item.targetPattern === 'rising' ? 'ascendente' : 'descendente'

  if (check === 'correct') {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 text-center w-full">
          <p className="text-sm text-green-600 font-semibold mb-1">¡Entonación correcta!</p>
          <p className="text-4xl leading-none my-2">{arrow}</p>
          <p className="text-xs text-green-500 italic">{item.hint}</p>
        </div>
        <p className="text-xs text-gray-400">Avanzando…</p>
      </div>
    )
  }

  if (check === 'wrong') {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 text-center w-full">
          <p className="text-sm text-amber-700 font-semibold mb-1">
            Se esperaba entonación {label}
          </p>
          <p className="text-4xl leading-none my-2">{arrow}</p>
          <p className="text-xs text-amber-600">{item.hint}</p>
        </div>
        <button
          onClick={onRepeat}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return null
}
