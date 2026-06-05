import { normalize } from './textNormalization.js'

const LOOKAHEAD = 2

/**
 * Match spoken tokens against target tokens starting from currentIndex.
 * Returns updated statuses and the new currentIndex.
 *
 * @param {string[]} spokenTokens - raw words from ASR
 * @param {string[]} normalizedTargets - pre-normalized target tokens
 * @param {string[]} statuses - current status array ('pending'|'active'|'correct'|'missed')
 * @param {number} currentIndex - pointer into target tokens
 * @param {boolean} isFinal - if false, only compute activeIndex without locking statuses
 * @returns {{ statuses: string[], currentIndex: number, activeIndex: number }}
 */
export function matchSpokenToTarget(spokenTokens, normalizedTargets, statuses, currentIndex, isFinal) {
  const newStatuses = [...statuses]
  let idx = currentIndex

  for (const spoken of spokenTokens) {
    if (idx >= normalizedTargets.length) break

    const norm = normalize(spoken)
    if (!norm) continue

    if (norm === normalizedTargets[idx]) {
      if (isFinal) newStatuses[idx] = 'correct'
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

    if (!foundAhead) {
      // word not matched anywhere nearby — don't advance
    }
  }

  // activeIndex: the next pending word (shown in yellow for interim)
  const activeIndex = idx < normalizedTargets.length ? idx : normalizedTargets.length - 1

  return { statuses: newStatuses, currentIndex: idx, activeIndex }
}
