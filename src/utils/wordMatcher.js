import { normalize } from './textNormalization.js'

const LOOKAHEAD = 2

/**
 * Match spoken tokens against target tokens starting from currentIndex.
 *
 * Wrong-word handling:
 * - Any word that doesn't match the current position OR the lookahead window,
 *   AND isn't a word that already appeared earlier in the target (prior-target skip),
 *   is counted as a wrong word at the current position.
 * - The first wrong word at a position immediately marks it as 'missed' and
 *   advances the pointer — self-correction after an error gives no credit.
 * - Prior-target skip: if the spoken word matches a target word already consumed
 *   (index < currentIndex), it is skipped silently so repeated target words don't
 *   cascade-fail the rest of the sentence.
 * - wrongCountAtIdx is persisted across calls so cross-utterance errors accumulate.
 *
 * @param {string[]} spokenTokens
 * @param {string[]} normalizedTargets
 * @param {string[]} statuses
 * @param {number}   currentIndex
 * @param {number[]} wrongCountAtIdx - persisted across calls
 * @param {boolean}  isFinal
 * @returns {{ statuses, currentIndex, activeIndex, wrongCountAtIdx }}
 */
export function matchSpokenToTarget(
  spokenTokens, normalizedTargets, statuses, currentIndex, wrongCountAtIdx, isFinal
) {
  const newStatuses = [...statuses]
  const newWrongCount = [...wrongCountAtIdx]
  let idx = currentIndex

  for (const spoken of spokenTokens) {
    if (idx >= normalizedTargets.length) break

    const norm = normalize(spoken)
    if (!norm) continue

    // ── exact match at current position ────────────────────────────────────
    if (norm === normalizedTargets[idx]) {
      if (isFinal) {
        // A prior wrong word at this position means it was already failed
        newStatuses[idx] = newWrongCount[idx] > 0 ? 'missed' : 'correct'
      }
      idx++
      continue
    }

    // ── lookahead: user skipped a word (within LOOKAHEAD window) ───────────
    let foundAhead = false
    const limit = Math.min(idx + LOOKAHEAD, normalizedTargets.length - 1)
    for (let ahead = idx + 1; ahead <= limit; ahead++) {
      if (norm === normalizedTargets[ahead]) {
        if (isFinal) {
          for (let m = idx; m < ahead; m++) newStatuses[m] = 'missed'
          newStatuses[ahead] = 'correct'
        }
        idx = ahead + 1
        foundAhead = true
        break
      }
    }
    if (foundAhead) continue

    // ── prior-target skip: word appears earlier in the sentence ────────────
    // Handles sentences like "pues la vaca…" where "la" echoes a prior target.
    if (normalizedTargets.slice(0, idx).includes(norm)) continue

    // ── genuinely wrong word ────────────────────────────────────────────────
    if (isFinal) {
      newWrongCount[idx] = (newWrongCount[idx] || 0) + 1
      // First wrong word is enough — mark missed and advance immediately.
      // Self-correction after an error does not give credit.
      newStatuses[idx] = 'missed'
      idx++
    }
  }

  const activeIndex = idx < normalizedTargets.length ? idx : normalizedTargets.length - 1

  return { statuses: newStatuses, currentIndex: idx, activeIndex, wrongCountAtIdx: newWrongCount }
}
