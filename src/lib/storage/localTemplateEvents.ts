/** Same-tab notification when localStorage template list changes (storage event is cross-tab only). */
export const EC_LOCAL_TEMPLATES_CHANGED = 'ec-local-templates-changed'

export type LocalTemplatesChangedDetail = { storageKey: string }

export function notifyLocalTemplatesChanged(storageKey: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(EC_LOCAL_TEMPLATES_CHANGED, {
      detail: { storageKey } as LocalTemplatesChangedDetail,
    }),
  )
}
