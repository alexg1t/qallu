import { normalize } from './textNormalization.js'

const LOOKAHEAD = 2
// How many wrong words at the same target position before it's forced to 'missed'.
// 1 wrong word is tolerated (self-correction, ASR noise). 3+ is clearly wrong.
const NOISE_THRESHOLD = 3

/**
 * Match spoken tokens against target tokens starting from currentIndex.
 *
 * @param {string[]} spokenTokens - raw words from ASR
 * @param {string[]} normalizedTargets - pre-normalized target tokens
 * @param {string[]} statuses - current status array ('pending'|'active'|'correct'|'missed')
 * @param {number} currentIndex - pointer into target tokens
 * @param {number[]} wrongCountAtIdx - wrong-word count per target position (persisted across calls)
 * @param {boolean} isFinal - if false, only compute activeIndex without locking statuses
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

    if (norm === normalizedTargets[idx]) {
      if (isFinal) {
        // If too many wrong words came before this match, it still counts as missed
        newStatuses[idx] = newWrongCount[idx] >= NOISE_THRESHOLD ? 'missed' : 'correct'
      }
      idx++
      continue
    }

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

    if (!foundAhead && isFinal) {
      newWrongCount[idx] = (newWrongCount[idx] || 0) + 1
      // Threshold exceeded: force this position to missed and move on
      if (newWrongCount[idx] >= NOISE_THRESHOLD) {
        newStatuses[idx] = 'missed'
        idx++
      }
    }
  }

  const activeIndex = idx < normalizedTargets.length ? idx : normalizedTargets.length - 1

  return { statuses: newStatuses, currentIndex: idx, activeIndex, wrongCountAtIdx: newWrongCount }
}
