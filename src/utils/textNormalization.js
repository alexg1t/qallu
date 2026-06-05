export function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[.,;:¡!¿?"'"""()[\]]/g, '')
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .trim()
    .replace(/\s+/g, ' ')
}

export function tokenize(str) {
  return normalize(str).split(/\s+/).filter(Boolean)
}

export function normalizeTokens(tokens) {
  return tokens.map(normalize)
}
