import { useState, useEffect, useRef, useCallback } from 'react'
import { getExercise } from '../data/exercises.js'
import { normalizeTokens } from '../utils/textNormalization.js'
import { matchSpokenToTarget } from '../utils/wordMatcher.js'
import { useSpeechRecognition } from './useSpeechRecognition.js'

const COUNTDOWN_START = 3
// Ratio threshold: target word's avg RMS must exceed full-utterance avg by this
// factor to be considered emphasized. Calibrated for clear prosodic stress.
const EMPHASIS_THRESHOLD = 1.25

function makeInitialState(exercise) {
  const tokens = getCurrentTokens(exercise, 0)
  return {
    status: 'idle',
    countdownValue: 0,
    // null = no check pending; 'detected' = auto-detected; 'weak' = insufficient;
    // 'manual' = audio data unavailable, fallback to user self-report
    emphasisCheck: null,
    // null | 'correct' | 'wrong'
    intonationCheck: null,
    sentenceIndex: 0,
    roundIndex: 0,
    wordStatuses: tokens.map(() => 'pending'),
    wrongCountAtIdx: tokens.map(() => 0),
    currentWordIndex: 0,
    activeIndex: 0,
    startedAt: null,
    correctWords: 0,
    totalWords: 0,
    problemWords: {},
    pacerTimings: [],
    segmentResults: [],
    error: null,
  }
}

function getCurrentTokens(exercise, sentenceIndex) {
  if (exercise.type === 'minimal-pairs' || exercise.type === 'tongue-twister') {
    return exercise.content.sentences[sentenceIndex]?.tokens ?? []
  }
  if (exercise.type === 'visual-pacer') {
    return exercise.content.tokens
  }
  if (exercise.type === 'emphasis-focus') {
    return exercise.content.tokens
  }
  if (exercise.type === 'intonation-focus') {
    return exercise.content.items[sentenceIndex]?.tokens ?? []
  }
  return []
}

export function useExerciseSession(exerciseId) {
  const exercise = getExercise(exerciseId)

  const [session, setSession] = useState(() => makeInitialState(exercise))
  const sessionRef = useRef(session)
  sessionRef.current = session

  const pacerTimerRef = useRef(null)
  const pacerWordRef = useRef(0)
  // Timer that auto-advances after a 'detected' emphasis result
  const emphasisAdvanceTimerRef = useRef(null)
  // Prevents double-completion when the pacer timer fires while handleSentenceDone is awaiting
  const completionStartedRef = useRef(false)

  const speech = useSpeechRecognition({ lang: 'es' })

  // ── PROCESS SPEECH ──────────────────────────────────────────────────────────

  const processTranscript = useCallback((transcript, isFinal) => {
    const s = sessionRef.current
    if (s.status !== 'active') return

    const tokens = getCurrentTokens(exercise, s.sentenceIndex)
    const normalizedTargets = normalizeTokens(tokens)
    const spokenTokens = transcript.trim().split(/\s+/).filter(Boolean)

    if (!spokenTokens.length) return

    const { statuses, currentIndex, activeIndex, wrongCountAtIdx } = matchSpokenToTarget(
      spokenTokens,
      normalizedTargets,
      s.wordStatuses,
      s.currentWordIndex,
      s.wrongCountAtIdx,
      isFinal
    )

    if (isFinal) {
      const newProblems = { ...s.problemWords }
      statuses.forEach((st, i) => {
        if (st === 'missed') {
          const w = tokens[i]
          newProblems[w] = (newProblems[w] || 0) + 1
        }
      })

      const allDone = currentIndex >= tokens.length
      // Visual-pacer: timer owns activeIndex — speech only updates wordStatuses/currentWordIndex
      const isVisualPacer = exercise.type === 'visual-pacer'
      const correctWordsDelta = statuses.filter(st => st === 'correct').length - s.wordStatuses.filter(st => st === 'correct').length

      if (allDone && exercise.type === 'emphasis-focus') {
        // For emphasis-focus completion, compute the emphasis score and do a
        // single setSession that includes both the word results and emphasisCheck.
        const round = exercise.content.rounds[s.roundIndex]
        const endTime = Date.now()
        const score = speech.computeEmphasisScore(round.emphasizedIndex, tokens.length, endTime)
        speech.stopListening()

        const emphasisCheck = score === null ? 'manual'
          : score >= EMPHASIS_THRESHOLD ? 'detected'
          : 'weak'

        setSession(prev => ({
          ...prev,
          wordStatuses: statuses,
          wrongCountAtIdx,
          currentWordIndex: currentIndex,
          activeIndex,
          problemWords: newProblems,
          correctWords: prev.correctWords + correctWordsDelta,
          emphasisCheck,
        }))

        if (emphasisCheck === 'detected') {
          emphasisAdvanceTimerRef.current = setTimeout(() => {
            handleSentenceDone(sessionRef.current.wordStatuses)
          }, 1500)
        }
      } else if (allDone && exercise.type === 'intonation-focus') {
        const item = exercise.content.items[s.sentenceIndex]
        const endTime = Date.now()
        const pattern = speech.computeIntonationPattern(endTime)
        speech.stopListening()

        const intonationCheck = pattern !== null && pattern !== item.targetPattern
          ? 'wrong'
          : 'correct'

        setSession(prev => ({
          ...prev,
          wordStatuses: statuses,
          wrongCountAtIdx,
          currentWordIndex: currentIndex,
          activeIndex,
          problemWords: newProblems,
          correctWords: prev.correctWords + correctWordsDelta,
          intonationCheck,
        }))

        if (intonationCheck === 'correct') {
          emphasisAdvanceTimerRef.current = setTimeout(() => {
            handleSentenceDone(sessionRef.current.wordStatuses)
          }, 1500)
        }
      } else {
        setSession(prev => ({
          ...prev,
          wordStatuses: statuses,
          wrongCountAtIdx,
          currentWordIndex: currentIndex,
          ...(isVisualPacer ? {} : { activeIndex }),
          problemWords: newProblems,
          correctWords: prev.correctWords + correctWordsDelta,
        }))

        if (allDone) {
          handleSentenceDone(statuses)
        }
      }
    } else {
      // Visual-pacer: don't let interim results displace the timer's position
      if (exercise.type !== 'visual-pacer') {
        setSession(prev => ({ ...prev, activeIndex }))
      }
    }
  }, [exercise])

  useEffect(() => {
    if (speech.finalTranscript) {
      processTranscript(speech.finalTranscript, true)
      speech.resetTranscripts()
    }
  }, [speech.finalTranscript])

  useEffect(() => {
    if (speech.interimTranscript) {
      processTranscript(speech.interimTranscript, false)
    }
  }, [speech.interimTranscript])

  // ── SEGMENT CAPTURE ─────────────────────────────────────────────────────────

  function buildSegment(finalStatuses, audioUrl = null) {
    const s = sessionRef.current
    const ex = exercise
    const tokens = getCurrentTokens(ex, s.sentenceIndex)
    const correctCount = finalStatuses.filter(st => st === 'correct').length

    if (ex.type === 'minimal-pairs' || ex.type === 'tongue-twister') {
      return {
        label: `Oración ${s.sentenceIndex + 1}`,
        tokens,
        statuses: finalStatuses,
        accuracy: tokens.length > 0 ? correctCount / tokens.length : 1,
        meaning: null,
        audioUrl,
      }
    }
    if (ex.type === 'emphasis-focus') {
      const round = ex.content.rounds[s.roundIndex]
      return {
        label: `Ronda ${s.roundIndex + 1}`,
        tokens,
        statuses: finalStatuses,
        accuracy: tokens.length > 0 ? correctCount / tokens.length : 1,
        meaning: round?.meaning ?? null,
        audioUrl,
      }
    }
    if (ex.type === 'intonation-focus') {
      const item = ex.content.items[s.sentenceIndex]
      const arrow = item?.targetPattern === 'rising' ? '↗' : '↘'
      return {
        label: `Frase ${s.sentenceIndex + 1}`,
        tokens,
        statuses: finalStatuses,
        accuracy: tokens.length > 0 ? correctCount / tokens.length : 1,
        meaning: item ? `${arrow} ${item.hint}` : null,
        audioUrl,
      }
    }
    // visual-pacer: single segment, built in completeSession using prev state
    return null
  }

  // ── SENTENCE / ROUND COMPLETION ─────────────────────────────────────────────

  const handleSentenceDone = useCallback(async (finalStatuses) => {
    const s = sessionRef.current
    const ex = exercise
    const audioUrl = await speech.stopSegmentRecording()
    const segment = buildSegment(finalStatuses, audioUrl)

    if (ex.type === 'minimal-pairs' || ex.type === 'tongue-twister') {
      const nextSentence = s.sentenceIndex + 1
      if (nextSentence < ex.content.sentences.length) {
        const nextTokens = ex.content.sentences[nextSentence].tokens
        speech.resetTranscripts()
        speech.startSegmentRecording()
        setSession(prev => ({
          ...prev,
          sentenceIndex: nextSentence,
          wordStatuses: nextTokens.map(() => 'pending'),
          wrongCountAtIdx: nextTokens.map(() => 0),
          currentWordIndex: 0,
          activeIndex: 0,
          totalWords: prev.totalWords + nextTokens.length,
          segmentResults: segment ? [...prev.segmentResults, segment] : prev.segmentResults,
        }))
      } else {
        completeSession(segment)
      }
    } else if (ex.type === 'emphasis-focus') {
      const nextRound = s.roundIndex + 1
      if (nextRound < ex.content.rounds.length) {
        const tokens = ex.content.tokens
        speech.resetTranscripts()
        speech.startListening()
        speech.startSegmentRecording()
        setSession(prev => ({
          ...prev,
          roundIndex: nextRound,
          emphasisCheck: null,
          wordStatuses: tokens.map(() => 'pending'),
          wrongCountAtIdx: tokens.map(() => 0),
          currentWordIndex: 0,
          activeIndex: 0,
          totalWords: prev.totalWords + tokens.length,
          segmentResults: segment ? [...prev.segmentResults, segment] : prev.segmentResults,
        }))
      } else {
        completeSession(segment)
      }
    } else if (ex.type === 'intonation-focus') {
      const nextIndex = s.sentenceIndex + 1
      if (nextIndex < ex.content.items.length) {
        const nextTokens = ex.content.items[nextIndex].tokens
        speech.resetTranscripts()
        speech.startListening()
        speech.startSegmentRecording()
        setSession(prev => ({
          ...prev,
          sentenceIndex: nextIndex,
          intonationCheck: null,
          wordStatuses: nextTokens.map(() => 'pending'),
          wrongCountAtIdx: nextTokens.map(() => 0),
          currentWordIndex: 0,
          activeIndex: 0,
          totalWords: prev.totalWords + nextTokens.length,
          segmentResults: segment ? [...prev.segmentResults, segment] : prev.segmentResults,
        }))
      } else {
        completeSession(segment)
      }
    } else {
      // visual-pacer: buildSegment returns null, so pass audioUrl directly to
      // completeSession — calling stopSegmentRecording() again would find the
      // recorder already inactive and return null.
      completeSession(null, audioUrl)
    }
  }, [exercise, speech])

  // preRecordedUrl: for visual-pacer when handleSentenceDone already captured
  // the audio (user finished all words before the timer). Pass it through so
  // the second stopSegmentRecording() call (on an already-inactive recorder)
  // doesn't produce null.
  const completeSession = useCallback(async (finalSegment, preRecordedUrl) => {
    if (completionStartedRef.current) return
    completionStartedRef.current = true
    stopPacer()
    // Stop recording BEFORE stopping ASR: Chrome may release the audio track
    // when SpeechRecognition.stop() fires, which would kill the MediaRecorder.
    let pacerAudioUrl = null
    if (!finalSegment && exercise.type === 'visual-pacer') {
      pacerAudioUrl = preRecordedUrl !== undefined
        ? preRecordedUrl
        : await speech.stopSegmentRecording()
    }
    speech.stopListening()
    setSession(prev => {
      const pacerSegment = !finalSegment && exercise.type === 'visual-pacer' ? {
        label: 'Texto completo',
        tokens: exercise.content.tokens,
        statuses: prev.wordStatuses,
        accuracy: prev.totalWords > 0 ? prev.correctWords / prev.totalWords : 1,
        meaning: null,
        audioUrl: pacerAudioUrl,
      } : null

      const seg = finalSegment || pacerSegment
      return {
        ...prev,
        status: 'completed',
        segmentResults: seg ? [...prev.segmentResults, seg] : prev.segmentResults,
      }
    })
  }, [speech, exercise])

  // ── PACER TIMER (visual-pacer only) ─────────────────────────────────────────

  function startPacer() {
    if (exercise.type !== 'visual-pacer') return
    const { syllableCounts, targetSyllablesPerSecond } = exercise.content
    let wordIdx = 0
    pacerWordRef.current = 0

    function scheduleNext() {
      const count = syllableCounts[wordIdx] || 1
      const delay = (count / targetSyllablesPerSecond) * 1000

      pacerTimerRef.current = setTimeout(() => {
        wordIdx++
        pacerWordRef.current = wordIdx

        if (wordIdx >= syllableCounts.length) {
          // All words shown. Keep session active briefly so Chrome can flush
          // any pending ASR results before the score is calculated.
          // activeIndex beyond array length means no word shows yellow.
          setSession(prev => ({ ...prev, activeIndex: syllableCounts.length }))
          pacerTimerRef.current = setTimeout(() => completeSession(null), 2000)
          return
        }

        setSession(prev => ({ ...prev, activeIndex: wordIdx }))
        scheduleNext()
      }, delay)
    }

    scheduleNext()
  }

  function stopPacer() {
    if (pacerTimerRef.current) {
      clearTimeout(pacerTimerRef.current)
      pacerTimerRef.current = null
    }
  }

  // ── COUNTDOWN ───────────────────────────────────────────────────────────────

  // Updated every render so the countdown effect always calls the fresh version
  // without needing it as a dep (avoids clearing the timer on each re-render).
  const activateRef = useRef(null)
  activateRef.current = () => {
    completionStartedRef.current = false
    const tokens = getCurrentTokens(exercise, 0)
    setSession(prev => ({
      ...prev,
      status: 'active',
      countdownValue: 0,
      startedAt: Date.now(),
      emphasisCheck: null,
      intonationCheck: null,
      wordStatuses: tokens.map(() => 'pending'),
      wrongCountAtIdx: tokens.map(() => 0),
      currentWordIndex: 0,
      activeIndex: 0,
      sentenceIndex: 0,
      roundIndex: 0,
      correctWords: 0,
      totalWords: tokens.length,
      problemWords: {},
      pacerTimings: [],
      segmentResults: [],
      error: null,
    }))
    speech.resetTranscripts()
    speech.startListening()
    speech.startSegmentRecording()
    startPacer()
  }

  useEffect(() => {
    if (session.status !== 'countdown') return
    if (session.countdownValue <= 0) {
      activateRef.current()
      return
    }
    const t = setTimeout(
      () => setSession(prev => ({ ...prev, countdownValue: prev.countdownValue - 1 })),
      1000
    )
    return () => clearTimeout(t)
  }, [session.status, session.countdownValue])

  // ── CONTROLS ────────────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    if (speech.permissionStatus !== 'granted') {
      setSession(prev => ({ ...prev, status: 'requesting-permission' }))
      await speech.requestPermission()
      if (speech.permissionStatus === 'denied') {
        setSession(prev => ({ ...prev, status: 'error', error: speech.error }))
        return
      }
    }
    setSession(prev => ({ ...prev, status: 'countdown', countdownValue: COUNTDOWN_START }))
  }, [exercise, speech])

  const pause = useCallback(() => {
    speech.stopListening()
    stopPacer()
    setSession(prev => ({ ...prev, status: 'paused' }))
  }, [speech])

  const resume = useCallback(() => {
    setSession(prev => ({ ...prev, status: 'active' }))
    speech.startListening()
    if (exercise.type === 'visual-pacer') startPacer()
  }, [exercise, speech])

  const stop = useCallback(() => {
    completionStartedRef.current = false
    speech.stopListening()
    speech.cancelSegmentRecording()
    stopPacer()
    clearTimeout(emphasisAdvanceTimerRef.current)
    setSession(makeInitialState(exercise))
  }, [exercise, speech])

  // 'manual' fallback: user confirmed they did emphasize the word → advance round
  const confirmRound = useCallback(() => {
    handleSentenceDone(sessionRef.current.wordStatuses)
  }, [])

  // Reset current round to try again (used for 'weak' and 'manual' results)
  const repeatRound = useCallback(() => {
    clearTimeout(emphasisAdvanceTimerRef.current)
    const tokens = exercise.type === 'intonation-focus'
      ? exercise.content.items[sessionRef.current.sentenceIndex]?.tokens ?? []
      : exercise.content.tokens
    speech.resetTranscripts()
    speech.startListening()
    setSession(prev => ({
      ...prev,
      emphasisCheck: null,
      intonationCheck: null,
      wordStatuses: tokens.map(() => 'pending'),
      wrongCountAtIdx: tokens.map(() => 0),
      currentWordIndex: 0,
      activeIndex: 0,
    }))
  }, [exercise, speech])

  useEffect(() => {
    const transient = ['no-speech', 'aborted', 'network-retrying']
    if (speech.error &&
        !transient.includes(speech.error.code) &&
        (session.status === 'requesting-permission' || session.status === 'active')) {
      stopPacer()
      setSession(prev => ({ ...prev, status: 'error', error: speech.error }))
    }
  }, [speech.error])

  useEffect(() => {
    if (session.status === 'requesting-permission' && speech.permissionStatus === 'granted') {
      setSession(prev => ({ ...prev, status: 'countdown', countdownValue: COUNTDOWN_START }))
    }
  }, [speech.permissionStatus, session.status])

  const currentTokens = getCurrentTokens(exercise, session.sentenceIndex)
  const currentRound = exercise?.type === 'emphasis-focus'
    ? exercise.content.rounds[session.roundIndex]
    : null
  const currentItem = exercise?.type === 'intonation-focus'
    ? exercise.content.items[session.sentenceIndex]
    : null

  const accuracy = session.totalWords > 0
    ? Math.round((session.correctWords / session.totalWords) * 100) / 100
    : 0

  const elapsedSeconds = session.startedAt
    ? Math.round((Date.now() - session.startedAt) / 1000)
    : 0

  return {
    session,
    exercise,
    currentTokens,
    currentRound,
    currentItem,
    speech,
    accuracy,
    elapsedSeconds,
    controls: { start, pause, resume, stop, confirmRound, repeatRound },
  }
}
