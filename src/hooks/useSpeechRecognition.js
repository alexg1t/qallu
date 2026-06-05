import { useState, useEffect, useRef, useCallback } from 'react'

const ERROR_MESSAGES = {
  'no-speech': 'No detectamos habla. Asegúrate de que el micrófono está activo.',
  'audio-capture': 'No se pudo acceder al micrófono.',
  'not-allowed': 'Permiso de micrófono denegado. Actívalo en la configuración del navegador.',
  'network': 'Error de red. El reconocimiento de voz requiere conexión a internet.',
  'aborted': null,
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useSpeechRecognition({ lang = 'es-ES' } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [permissionStatus, setPermissionStatus] = useState('unknown')
  const [error, setError] = useState(null)

  const recognitionRef = useRef(null)
  const isListeningRef = useRef(false)
  const isRestartingRef = useRef(false)

  const mediaStreamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const segmentResolverRef = useRef(null)
  // True when startSegmentRecording was called before the stream was ready
  const pendingRecordingRef = useRef(false)

  // Tracks how many results from event.results we've already committed.
  // Chrome accumulates all results within a session, so we must skip the ones
  // already processed. Each new recognition session resets to 0.
  const lastFinalIndexRef = useRef(0)
  // When true, the next onresult must skip all currently-accumulated finals
  // (used after resetTranscripts so a round/sentence boundary doesn't re-fire).
  const skipToCurrentRef = useRef(false)

  // Web Audio API — amplitude sampling for emphasis detection
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const amplitudeSamplesRef = useRef([]) // { time: Date.now(), rms: number }[]
  const sampleIntervalRef = useRef(null)
  // Timestamp of the first ASR result in the current utterance (more accurate
  // than startListening time because it excludes pre-speech silence).
  const firstResultTimeRef = useRef(null)

  const isSupported = Boolean(SpeechRecognition)

  useEffect(() => {
    if (!isSupported) return

    const rec = new SpeechRecognition()
    rec.lang = lang
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (event) => {
      // Mark the start of the utterance on the first result we process.
      // Using ASR event time (not startListening time) excludes pre-speech silence.
      if (firstResultTimeRef.current === null) {
        firstResultTimeRef.current = Date.now()
      }

      if (skipToCurrentRef.current) {
        // A boundary reset was requested. Skip every final result accumulated
        // so far and only expose fresh interim going forward.
        skipToCurrentRef.current = false
        // Also reset utterance timing for the new segment
        firstResultTimeRef.current = null
        let skipUntil = 0
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) skipUntil = i + 1
        }
        lastFinalIndexRef.current = skipUntil
        // Expose only interim from the fresh position
        let interim = ''
        for (let i = skipUntil; i < event.results.length; i++) {
          interim += event.results[i][0].transcript + ' '
        }
        setInterimTranscript(interim.trim())
        return
      }

      let interim = ''
      let final = ''
      for (let i = lastFinalIndexRef.current; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript + ' '
          lastFinalIndexRef.current = i + 1
        } else {
          interim += result[0].transcript + ' '
        }
      }
      if (final.trim()) setFinalTranscript(final.trim())
      setInterimTranscript(interim.trim())
    }

    rec.onerror = (event) => {
      const msg = ERROR_MESSAGES[event.error]
      if (msg !== null) {
        setError({ code: event.error, message: msg || `Error: ${event.error}` })
      }
      const fatal = ['not-allowed', 'network', 'audio-capture']
      if (fatal.includes(event.error)) {
        setIsListening(false)
        isListeningRef.current = false
      }
      if (event.error === 'not-allowed') {
        setPermissionStatus('denied')
      }
    }

    rec.onend = () => {
      isRestartingRef.current = false
      if (isListeningRef.current) {
        // Each new session starts with a fresh event.results list
        lastFinalIndexRef.current = 0
        isRestartingRef.current = true
        try {
          rec.start()
        } catch {
          isRestartingRef.current = false
        }
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = rec

    return () => {
      isListeningRef.current = false
      try { rec.stop() } catch { /* ignore */ }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        segmentResolverRef.current = null
        try { mediaRecorderRef.current.stop() } catch { /* ignore */ }
      }
    }
  }, [isSupported, lang])

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      clearInterval(sampleIntervalRef.current)
      audioContextRef.current?.close().catch(() => {})
    }
  }, [])

  function setupAudioAnalyser(stream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioContextRef.current = ctx
      analyserRef.current = analyser
    } catch { /* graceful degradation — emphasis detection falls back to manual */ }
  }

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissionStatus('granted')
      setError(null)
      mediaStreamRef.current = stream
      if (!analyserRef.current) setupAudioAnalyser(stream)
    } catch {
      setPermissionStatus('denied')
      setError({
        code: 'not-allowed',
        message: ERROR_MESSAGES['not-allowed'],
      })
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return
    setError(null)
    setInterimTranscript('')
    setFinalTranscript('')
    lastFinalIndexRef.current = 0
    skipToCurrentRef.current = false
    // Reset amplitude tracking for the new listening session
    amplitudeSamplesRef.current = []
    firstResultTimeRef.current = null
    // Lazy AudioContext + stream setup if permission was pre-granted (requestPermission skipped)
    if (!analyserRef.current) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaStreamRef.current = stream
          setupAudioAnalyser(stream)
          // startSegmentRecording may have been called before the stream was ready
          if (pendingRecordingRef.current) {
            pendingRecordingRef.current = false
            _startRecordingFromStream(stream)
          }
        })
        .catch(() => {})
    }
    // Start amplitude sampling
    clearInterval(sampleIntervalRef.current)
    sampleIntervalRef.current = setInterval(() => {
      if (!analyserRef.current) return
      const buffer = new Float32Array(analyserRef.current.fftSize)
      analyserRef.current.getFloatTimeDomainData(buffer)
      const rms = Math.sqrt(buffer.reduce((s, v) => s + v * v, 0) / buffer.length)
      amplitudeSamplesRef.current.push({ time: Date.now(), rms })
    }, 50)
    isListeningRef.current = true
    setIsListening(true)
    try {
      recognitionRef.current.start()
    } catch {
      // already running
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    isListeningRef.current = false
    setIsListening(false)
    clearInterval(sampleIntervalRef.current)
    try {
      recognitionRef.current.stop()
    } catch { /* ignore */ }
  }, [])

  const resetTranscripts = useCallback(() => {
    setInterimTranscript('')
    setFinalTranscript('')
    // Signal onresult to skip the currently-accumulated finals on next fire
    skipToCurrentRef.current = true
    // Clear amplitude data — new segment starts fresh
    amplitudeSamplesRef.current = []
    firstResultTimeRef.current = null
  }, [])

  // Returns the ratio of the target word's average amplitude vs. the full
  // utterance average. A ratio >= 1.25 indicates audible emphasis.
  // Returns null if there is insufficient audio data (falls back to manual confirm).
  const computeEmphasisScore = useCallback((targetIndex, tokenCount, endTime) => {
    const samples = amplitudeSamplesRef.current
    const startTime = firstResultTimeRef.current
    if (!startTime || !endTime || samples.length < 4) return null

    const duration = endTime - startTime
    // Utterance too short to split into reliable per-word windows
    if (duration < 600) return null

    const wordDuration = duration / tokenCount
    const targetStart = startTime + targetIndex * wordDuration
    const targetEnd = targetStart + wordDuration

    const windowSamples = samples.filter(s => s.time >= targetStart && s.time <= targetEnd)
    const utteranceSamples = samples.filter(s => s.time >= startTime && s.time <= endTime)

    if (windowSamples.length < 1 || utteranceSamples.length < 3) return null

    const avgTarget = windowSamples.reduce((sum, s) => sum + s.rms, 0) / windowSamples.length
    const avgFull = utteranceSamples.reduce((sum, s) => sum + s.rms, 0) / utteranceSamples.length

    return avgFull > 0.001 ? avgTarget / avgFull : null
  }, [])

  function _startRecordingFromStream(stream) {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      segmentResolverRef.current = null
      try { mediaRecorderRef.current.stop() } catch { /* ignore */ }
    }
    audioChunksRef.current = []
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : ''
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = () => {
        if (segmentResolverRef.current) {
          const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' })
          segmentResolverRef.current(URL.createObjectURL(blob))
          segmentResolverRef.current = null
        }
      }
      mediaRecorderRef.current = mr
      mr.start(1000)
    } catch { /* MediaRecorder not supported — playback unavailable */ }
  }

  const startSegmentRecording = useCallback(() => {
    if (!mediaStreamRef.current) {
      // Stream not ready yet (lazy getUserMedia in progress) — set flag so it
      // starts as soon as the stream arrives in startListening's .then()
      pendingRecordingRef.current = true
      return
    }
    pendingRecordingRef.current = false
    _startRecordingFromStream(mediaStreamRef.current)
  }, [])

  const stopSegmentRecording = useCallback(() => {
    return new Promise(resolve => {
      const mr = mediaRecorderRef.current
      if (!mr || mr.state === 'inactive') { resolve(null); return }
      segmentResolverRef.current = resolve
      try { mr.stop() } catch { resolve(null) }
    })
  }, [])

  const cancelSegmentRecording = useCallback(() => {
    segmentResolverRef.current = null
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      try { mr.stop() } catch { /* ignore */ }
    }
  }, [])

  return {
    isSupported,
    permissionStatus,
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    requestPermission,
    startListening,
    stopListening,
    resetTranscripts,
    computeEmphasisScore,
    startSegmentRecording,
    stopSegmentRecording,
    cancelSegmentRecording,
  }
}
