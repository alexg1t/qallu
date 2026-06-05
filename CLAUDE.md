# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at localhost:5173
npm run build    # production build to dist/
npm run preview  # serve dist/ locally
npm run lint     # ESLint on src/
```

No test suite exists yet. Verify logic in the browser console or by running the app.

**Browser requirement:** Chrome or Edge only — Web Speech API (`webkitSpeechRecognition`) is not supported in Firefox or Safari.

## Architecture

### Routing
`App.jsx` uses a `view` enum (`'home' | 'exercise' | 'progress'`) with `useState` — no router library. View transitions happen through callbacks passed down the tree.

### Exercise types
Three types defined in `src/data/exercises.js`, each with a different `content` schema:

| Type | Key field | Completion trigger |
|---|---|---|
| `minimal-pairs` | `sentences[]` with `tokens[]` per sentence | Speech matches all tokens in current sentence → advance to next |
| `visual-pacer` | `tokens[]`, `syllableCounts[]`, `targetSyllablesPerSecond` | Timer exhausts all words |
| `emphasis-focus` | `tokens[]`, `rounds[]` with `emphasizedIndex` | Speech matches all tokens → advance to next round |

### Speech recognition loop (`useSpeechRecognition`)
- Uses `window.SpeechRecognition || window.webkitSpeechRecognition` with `continuous: true`, `interimResults: true`.
- `onend` auto-restarts if `isListeningRef.current` is still true (Chrome stops after ~2–5s of silence).
- `onerror` for `network`, `not-allowed`, `audio-capture` sets `isListeningRef.current = false` to break the restart loop.
- `event.results` accumulates across the session — all results are iterated from index 0 every `onresult` event. `resetTranscripts()` only clears React state, not the browser's internal buffer.

### Word matching flow (`useExerciseSession` + `wordMatcher.js`)
1. `finalTranscript` change → `processTranscript(transcript, isFinal=true)` → `matchSpokenToTarget()`
2. `interimTranscript` change → `processTranscript(transcript, isFinal=false)` → only computes `activeIndex` (yellow highlight), never locks statuses
3. `matchSpokenToTarget` uses exact normalized match (lowercase, no punctuation, NFD diacritics stripped) with a lookahead of 2 words for skip detection. No fuzzy matching — intentional to avoid false positives on trained contrasts (e.g. `baca`/`vaca`).
4. **Critical invariant:** For `visual-pacer`, `activeIndex` is owned exclusively by the pacer timer. `processTranscript` must not update `activeIndex` for that exercise type — it would conflict with the timer.

### Session state machine
`useExerciseSession` owns the state: `idle → requesting-permission → active → paused → completed | error`.

- `sessionRef` mirrors session state as a ref so `useCallback` closures can read current values without stale captures.
- When `handleSentenceDone` is called, `finalStatuses` are passed as a parameter (not read from `sessionRef`) because `setSession` is async and the ref won't reflect the update yet.
- `segmentResults` accumulates one entry per sentence/round, captured at the moment a segment completes. The final segment is captured inside `completeSession`'s `setSession(prev => ...)` functional update.

### Persistence
`localStorage` key `qallu_progress_v1`. Schema: `{ version, sessions[], exerciseStats{} }`. Written only on session completion. Capped at 100 sessions. `storage.js` handles versioning and `QuotaExceededError`.

### Adding exercises
Add entries to the appropriate array in `src/data/exercises.js`. Use `makeTokens(text)` for `tokens`. For `visual-pacer`, wrap in `makePacerExercise({...})` which auto-computes `syllableCounts` via `syllableUtils.js`. IDs must be stable (used as localStorage keys).
