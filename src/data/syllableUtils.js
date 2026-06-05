// Approximate Spanish syllable count using vowel groups as nuclei.
// Good enough for pacer timing in MVP; Spanish syllabification is phoneme-based,
// but vowel counting gives reliable estimates for common words.
export function countSyllables(word) {
  const clean = word.toLowerCase().replace(/[^a-záéíóúüñ]/g, '')
  const vowels = clean.match(/[aeiouáéíóúü]+/g)
  return vowels ? vowels.length : 1
}

export function countTokenSyllables(tokens) {
  return tokens.map(countSyllables)
}
