import { useState, useRef } from 'react'
import { TYPE_LABELS } from '../data/exercises.js'

export default function ResultsCard({ exercise, accuracy, elapsedSeconds, segmentResults, wpm, targetWpm, onRepeat, onHome }) {
  const pct = Math.round(accuracy * 100)
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
  const accuracyColor = pct >= 85 ? 'text-green-600' : pct >= 60 ? 'text-amber-500' : 'text-red-500'

  const hasProblems = segmentResults.some(s => s.accuracy < 1)
  const hasAudio = segmentResults.some(s => s.audioUrl)

  const wpmColor = targetWpm
    ? (wpm >= targetWpm * 0.9 ? 'text-green-600' : wpm >= targetWpm * 0.7 ? 'text-amber-500' : 'text-red-500')
    : 'text-indigo-600'

  return (
    <div className="flex flex-col items-center gap-8 p-8 max-w-lg mx-auto">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
          {TYPE_LABELS[exercise.type]}
        </p>
        <h2 className="text-2xl font-bold text-gray-800">{exercise.title}</h2>
      </div>

      <div className="flex gap-6 justify-center flex-wrap">
        <Stat label="Precisión" value={`${pct}%`} color={accuracyColor} />
        <Stat label="Tiempo" value={timeStr} color="text-gray-700" />
        {wpm > 0 && (
          <Stat
            label="Fluidez"
            value={`${wpm} ppm`}
            color={wpmColor}
            sub={targetWpm ? `objetivo: ${targetWpm} ppm` : null}
          />
        )}
      </div>

      {!hasProblems && !hasAudio && (
        <p className="text-green-600 font-medium text-center">
          ¡Perfecto! Todas las palabras reconocidas correctamente.
        </p>
      )}

      {(hasProblems || hasAudio) && segmentResults.length > 0 && (
        <div className="w-full space-y-3">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Desglose por {exercise.type === 'minimal-pairs' || exercise.type === 'tongue-twister' ? 'oración' : exercise.type === 'emphasis-focus' ? 'ronda' : 'ejercicio'}
          </p>
          {!hasProblems && (
            <p className="text-green-600 font-medium text-sm">
              ¡Perfecto! Todas las palabras reconocidas correctamente.
            </p>
          )}
          {segmentResults.map((seg, i) => (
            <SegmentCard key={i} segment={seg} />
          ))}
        </div>
      )}

      <div className="flex gap-3 w-full">
        <button
          onClick={onRepeat}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Repetir
        </button>
        <button
          onClick={onHome}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
        >
          Inicio
        </button>
      </div>
    </div>
  )
}

function AudioButton({ url }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setPlaying(false)
    }
    if (playing) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <button
      onClick={toggle}
      title={playing ? 'Detener' : 'Escuchar'}
      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors shrink-0"
    >
      <span className="text-base leading-none">{playing ? '⏹' : '▶'}</span>
      <span>{playing ? 'Detener' : 'Escuchar'}</span>
    </button>
  )
}

function SegmentCard({ segment }) {
  const pct = Math.round(segment.accuracy * 100)
  const perfect = segment.accuracy === 1
  const missedIndices = segment.statuses
    ? segment.statuses.map((st, i) => st === 'missed' ? i : -1).filter(i => i >= 0)
    : []

  return (
    <div className={`w-full rounded-xl border p-4 ${perfect ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{segment.label}</span>
        <div className="flex items-center gap-3">
          {segment.audioUrl && <AudioButton url={segment.audioUrl} />}
          <span className={`text-sm font-bold ${perfect ? 'text-green-600' : pct >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
            {pct}%
          </span>
        </div>
      </div>

      {segment.meaning && (
        <p className="text-xs text-indigo-600 mb-2 italic">{segment.meaning}</p>
      )}

      {segment.tokens && (
        <p className="text-base font-exercise leading-relaxed">
          {segment.tokens.map((word, i) => {
            const st = segment.statuses?.[i]
            const isMissed = st === 'missed'
            const isCorrect = st === 'correct'
            return (
              <span key={i}>
                <span className={
                  isMissed ? 'bg-red-200 text-red-700 rounded px-0.5' :
                  isCorrect ? 'text-green-700' :
                  'text-gray-500'
                }>
                  {word}
                </span>
                {i < segment.tokens.length - 1 ? ' ' : ''}
              </span>
            )
          })}
        </p>
      )}

      {missedIndices.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-red-500 font-medium mr-1">Con error:</span>
          {missedIndices.map(i => (
            <span key={i} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {segment.tokens[i]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color, sub }) {
  return (
    <div className="text-center">
      <p className={`text-4xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
