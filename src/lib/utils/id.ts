/**
 * Stable id generator. Uses `crypto.randomUUID` when available (all modern
 * browsers + Node 14.17+) and falls back to a timestamp + random tail.
 */
export function createId(prefix = 'tpl'): string {
  const uuid =
    typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}_${uuid.replace(/-/g, '').slice(0, 16)}`
}
