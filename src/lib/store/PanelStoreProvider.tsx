import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useStore } from 'zustand'
import type { PanelState, PanelStoreApi } from './panelStore'
import { createPanelStore } from './panelStore'
import type { StorageAdapter } from '../storage'

interface PanelStoreProviderProps {
  adapter: StorageAdapter
  defaultLanguage: string
  children: ReactNode
}

const PanelStoreContext = createContext<PanelStoreApi | null>(null)

/**
 * Per-panel store provider. Each `<EmailTemplatePanel>` instance gets its own
 * zustand store so two panels on the same page never leak state into each
 * other.
 */
export function PanelStoreProvider({
  adapter,
  defaultLanguage,
  children,
}: PanelStoreProviderProps) {
  // Ref so hot-reload doesn't wipe state. Deps of the store are captured once;
  // if `adapter` identity changes, spawn a new store.
  const storeRef = useRef<PanelStoreApi | null>(null)
  if (storeRef.current === null) {
    storeRef.current = createPanelStore({
      adapter,
      defaultLanguage,
    })
  }

  const store = storeRef.current

  useEffect(() => {
    void store.getState().load()
  }, [store])

  const value = useMemo(() => store, [store])
  return (
    <PanelStoreContext.Provider value={value}>
      {children}
    </PanelStoreContext.Provider>
  )
}

export function usePanelStore<T>(selector: (state: PanelState) => T): T {
  const store = useContext(PanelStoreContext)
  if (!store) {
    throw new Error(
      'usePanelStore must be used inside <EmailTemplatePanel>. The zustand ' +
        'store was not provided.',
    )
  }
  return useStore(store, selector)
}

export function usePanelStoreApi(): PanelStoreApi {
  const store = useContext(PanelStoreContext)
  if (!store) {
    throw new Error(
      'usePanelStoreApi must be used inside <EmailTemplatePanel>.',
    )
  }
  return store
}
