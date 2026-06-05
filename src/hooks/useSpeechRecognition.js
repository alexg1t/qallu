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
  const [audioDetected, setAudioDetected] = useState(false)

  const recognitionRef = useRef(null)
  const isListeningRef = useRef(false)
  const isRestartingRef = useRef(false)
  const restartFailCountRef = useRef(0)
  const networkRetryCountRef = useRef(0)
  const MAX_RESTART_FAILS = 3
  const MAX_NETWORK_RETRIES = 3
  const NETWORK_RETRY_DELAY = 2000

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

  // Web Audio API — amplitude + spectral feature sampling
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sampleIntervalRef = useRef(null)
  // Each sample: { time: number, rms: number, spectralCentroid: number }
  const amplitudeSamplesRef = useRef([])
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

      if (event.error === 'network') {
        networkRetryCountRef.current++
        if (networkRetryCountRef.current <= MAX_NETWORK_RETRIES) {
          setError({
            code: 'network-retrying',
            message: `Reconectando... (intento ${networkRetryCountRef.current}/${MAX_NETWORK_RETRIES})`,
          })
          setTimeout(() => {
            if (isListeningRef.current) {
              try { rec.start() } catch { /* will retry on next onend */ }
            }
          }, NETWORK_RETRY_DELAY)
          return
        }
        networkRetryCountRef.current = 0
      }

      if (msg !== null && event.error !== 'network') {
        setError({ code: event.error, message: msg })
      } else if (msg !== null) {
        setError({ code: event.error, message: msg || `Error de red. Verifica tu conexión a internet.` })
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
        lastFinalIndexRef.current = 0
        isRestartingRef.current = true
        try {
          rec.start()
          restartFailCountRef.current = 0
        } catch {
          isRestartingRef.current = false
          restartFailCountRef.current++
          if (restartFailCountRef.current >= MAX_RESTART_FAILS) {
            isListeningRef.current = false
            setIsListening(false)
            restartFailCountRef.current = 0
            setError({
              code: 'restart-failed',
              message: 'El reconocimiento se detuvo. Verifica tu conexión e inténtalo de nuevo.',
            })
          }
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

  // Must be called synchronously inside a user gesture (tap/click) so Android
  // Chrome allows the AudioContext to start in 'running' state. Creating or
  // resuming AudioContext asynchronously (e.g. inside a .then() callback) loses
  // the gesture context and the context stays 'suspended' on mobile.
  function ensureAudioContext() {
    if (audioContextRef.current) {
      audioContextRef.current.resume().catch(() => {})
      return
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    audioContextRef.current = ctx
    ctx.resume().catch(() => {})
  }

  function setupAudioAnalyser(stream) {
    try {
      const ctx = audioContextRef.current
      if (!ctx) return
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser
    } catch { /* graceful degradation */ }
  }

  const requestPermission = useCallback(async () => {
    ensureAudioContext()
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
    ensureAudioContext()
    setError(null)
    setInterimTranscript('')
    setFinalTranscript('')
    setAudioDetected(false)
    lastFinalIndexRef.current = 0
    skipToCurrentRef.current = false
    restartFailCountRef.current = 0
    networkRetryCountRef.current = 0
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
    isListeningRef.current = true
    setIsListening(true)
    // Resume AudioContext in case Chrome auto-suspended it (happens for input-only
    // contexts that have no audio output connected to destination).
    audioContextRef.current?.resume().catch(() => {})

    // Sample RMS + fundamental frequency (F0) from the AnalyserNode every 50 ms.
    // F0 is estimated via autocorrelation — the most direct measure of pitch,
    // which rises for questions and falls for statements in Spanish.
    clearInterval(sampleIntervalRef.current)
    sampleIntervalRef.current = setInterval(() => {
      const analyser = analyserRef.current
      const ctx = audioContextRef.current
      if (!analyser || !ctx) return

      // If context is still suspended, try again and skip this frame
      if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); return }

      const timeBuf = new Float32Array(analyser.fftSize)
      analyser.getFloatTimeDomainData(timeBuf)

      // RMS from full buffer
      const n = timeBuf.length
      let ss = 0
      for (let i = 0; i < n; i++) ss += timeBuf[i] * timeBuf[i]
      const rms = Math.sqrt(ss / n)

      // Autocorrelation-based F0 estimation (75–600 Hz range).
      // Using the first 700 samples as the correlation window (~16ms at 44100 Hz):
      // fast enough at ~360K multiplications per call, accurate enough for voice.
      let f0 = 0
      let bestNormCorr = 0
      if (rms > 0.003) {
        const sampleRate = ctx.sampleRate
        const minLag = Math.floor(sampleRate / 600)   // ~73 samples → 600 Hz
        const maxLag = Math.ceil(sampleRate / 75)     // ~588 samples → 75 Hz
        const searchN = Math.min(700, n - maxLag)     // correlation window
        if (searchN > 0) {
          let mean = 0
          for (let i = 0; i < searchN; i++) mean += timeBuf[i]
          mean /= searchN
          let ss0 = 0
          for (let i = 0; i < searchN; i++) { const v = timeBuf[i] - mean; ss0 += v * v }
          if (ss0 > 1e-8) {
            let bestLag = 0, bestCorr = -Infinity
            for (let lag = minLag; lag <= maxLag; lag++) {
              let corr = 0
              for (let i = 0; i < searchN; i++) {
                corr += (timeBuf[i] - mean) * (timeBuf[i + lag] - mean)
              }
              if (corr > bestCorr) { bestCorr = corr; bestLag = lag }
            }
            bestNormCorr = bestCorr / ss0
            // 0.15 is lenient on purpose — borderline frames still contribute to
            // the F0 average, and the ratio comparison smooths individual noise.
            if (bestNormCorr > 0.15 && bestLag > 0) f0 = sampleRate / bestLag
          }
        }
      }

      // DEV DIAGNOSTIC — remove after confirming detection works
      if (amplitudeSamplesRef.current.length % 20 === 0) {
        console.log('[F0 sample]', { rms: rms.toFixed(4), f0: Math.round(f0), bestNormCorr: bestNormCorr.toFixed(3), ctxState: ctx.state, totalSamples: amplitudeSamplesRef.current.length })
      }

      amplitudeSamplesRef.current.push({ time: Date.now(), rms, f0 })

      if (!audioDetected && rms > 0.01) {
        setAudioDetected(true)
      }
    }, 50)
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

  // Returns a combined score (rms + F0 ratio) for the target word vs. the full
  // utterance. A ratio >= 1.25 indicates audible emphasis.
  // Returns null when there is insufficient audio data (falls back to manual).
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

    // Only voiced frames (RMS above silence floor)
    const utteranceSamples = samples.filter(s => s.time >= startTime && s.time <= endTime && s.rms > 0.002)
    const windowSamples = samples.filter(s => s.time >= targetStart && s.time <= targetEnd && s.rms > 0.002)

    if (windowSamples.length < 1 || utteranceSamples.length < 3) return null

    const avgTargetRms = windowSamples.reduce((a, s) => a + s.rms, 0) / windowSamples.length
    const avgFullRms = utteranceSamples.reduce((a, s) => a + s.rms, 0) / utteranceSamples.length
    if (avgFullRms < 0.001) return null
    const rmsRatio = avgTargetRms / avgFullRms

    // F0 pitch — stressed syllables carry higher pitch.
    // Blend only when autocorrelation found clear F0 in both windows (f0 > 0).
    const fullVoiced = utteranceSamples.filter(s => s.f0 > 0)
    const winVoiced = windowSamples.filter(s => s.f0 > 0)
    if (fullVoiced.length >= 3 && winVoiced.length >= 1) {
      const avgTargetF0 = winVoiced.reduce((a, s) => a + s.f0, 0) / winVoiced.length
      const avgFullF0 = fullVoiced.reduce((a, s) => a + s.f0, 0) / fullVoiced.length
      return 0.6 * rmsRatio + 0.4 * (avgTargetF0 / avgFullF0)
    }

    return rmsRatio
  }, [])

  // Detects whether pitch (F0) rises or falls towards the end of the utterance.
  // Rising F0 = question intonation, falling F0 = statement intonation in Spanish.
  // Returns 'rising' | 'falling' | 'neutral' | null.
  const computeIntonationPattern = useCallback((endTime) => {
    const samples = amplitudeSamplesRef.current
    const startTime = firstResultTimeRef.current

    // DEV DIAGNOSTIC — remove after confirming detection works
    console.log('[computeIntonationPattern] total samples:', samples.length, '| startTime:', startTime, '| endTime:', endTime)

    if (!startTime || !endTime) {
      console.log('[computeIntonationPattern] → null: missing startTime or endTime')
      return null
    }

    const inWindow = samples.filter(s => s.time >= startTime && s.time <= endTime)
    const voiced = inWindow.filter(s => s.f0 > 0)
    console.log('[computeIntonationPattern] in window:', inWindow.length, '| voiced (f0>0):', voiced.length, '| sample f0s:', inWindow.slice(-10).map(s => Math.round(s.f0)))

    if (voiced.length < 5) {
      console.log('[computeIntonationPattern] → null: voiced.length < 5')
      return null
    }

    const n = voiced.length
    // Compare onset (first 40%) to tail (last 30%)
    const earlySlice = voiced.slice(0, Math.floor(n * 0.4))
    const lateSlice = voiced.slice(Math.floor(n * 0.7))

    if (earlySlice.length < 2 || lateSlice.length < 2) {
      console.log('[computeIntonationPattern] → null: slices too small')
      return null
    }

    const avgEarlyF0 = earlySlice.reduce((a, s) => a + s.f0, 0) / earlySlice.length
    const avgLateF0 = lateSlice.reduce((a, s) => a + s.f0, 0) / lateSlice.length
    const ratio = avgLateF0 / avgEarlyF0
    console.log('[computeIntonationPattern] avgEarlyF0:', Math.round(avgEarlyF0), '| avgLateF0:', Math.round(avgLateF0), '| ratio:', ratio.toFixed(3))

    if (avgEarlyF0 < 75) {
      console.log('[computeIntonationPattern] → null: avgEarlyF0 < 75')
      return null
    }

    if (ratio > 1.10) { console.log('[computeIntonationPattern] → rising'); return 'rising' }
    if (ratio < 0.90) { console.log('[computeIntonationPattern] → falling'); return 'falling' }
    console.log('[computeIntonationPattern] → neutral')
    return 'neutral'
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
    audioDetected,
    interimTranscript,
    finalTranscript,
    error,
    requestPermission,
    startListening,
    stopListening,
    resetTranscripts,
    computeEmphasisScore,
    computeIntonationPattern,
    startSegmentRecording,
    stopSegmentRecording,
    cancelSegmentRecording,
  }
}
