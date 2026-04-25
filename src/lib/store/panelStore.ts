import { createStore, type StoreApi } from 'zustand/vanilla'
import type {
  Template,
  TemplateLanguageVariant,
  TemplateStatus,
  TemplateVersion,
  VersionType,
} from '../../types'
import type { StorageAdapter } from '../storage'
import { createId } from '../utils/id'
import { nowIso } from '../utils/date'
import { createEmptyDocument, migrateEditorJson } from '../types/editorDocument'
import type { EmailBlock } from '../types/editorDocument'
import type { SavedBlock } from '../types/savedBlock'

export type PanelView = 'library' | 'editor'

export interface PanelState {
  // library
  templates: Template[]
  loading: boolean
  error: string | null

  // navigation
  view: PanelView
  activeTemplateId: string | null

  // dialog targets
  renameTargetId: string | null
  deleteTargetId: string | null

  // defaults captured at panel mount
  defaultLanguage: string

  /** Selected block in the visual editor (Slice B+). */
  selectedBlockId: string | null
  /**
   * Which text block editor last received focus — used to insert variables
   * from the side panel.
   */
  activeTextBlockId: string | null
  versions: TemplateVersion[]
  versionCursor: number
  savedBlocks: SavedBlock[]

  // actions
  load: () => Promise<void>
  createBlank: () => Promise<string>
  duplicate: (id: string) => Promise<string>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>

  openEditor: (id: string) => void
  backToLibrary: () => void

  setSelectedBlockId: (id: string | null) => void
  setActiveTextBlockId: (id: string | null) => void

  setRenameTarget: (id: string | null) => void
  setDeleteTarget: (id: string | null) => void

  patchTemplate: (id: string, patch: Partial<Template>) => Promise<void>
  patchLanguageVariant: (
    id: string,
    lang: string,
    patch: Partial<TemplateLanguageVariant>,
  ) => Promise<void>
  setStatus: (id: string, status: TemplateStatus, note?: string) => Promise<void>
  loadVersions: (templateId: string, language: string) => Promise<void>
  saveVersion: (args: {
    templateId: string
    language: string
    type: VersionType
    editorJson: unknown
    html: string
    note?: string
  }) => Promise<TemplateVersion | null>
  restoreVersion: (versionId: string) => Promise<void>
  undo: () => Promise<void>
  redo: () => Promise<void>
  loadSavedBlocks: () => Promise<void>
  saveSavedBlock: (args: {
    name: string
    visibility: 'personal' | 'shared'
    snapshot: EmailBlock
    description?: string
  }) => Promise<void>
  deleteSavedBlock: (savedBlockId: string) => Promise<void>
}

export interface CreatePanelStoreArgs {
  adapter: StorageAdapter
  defaultLanguage: string
}

export type PanelStoreApi = StoreApi<PanelState>

const makeBlankVariant = (): TemplateLanguageVariant => ({
  subject: '',
  preheader: '',
  editorJson: createEmptyDocument(),
  html: '',
  updatedAt: nowIso(),
})

const makeBlankTemplate = (defaultLanguage: string, name: string): Template => {
  const id = createId('tpl')
  const now = nowIso()
  return {
    id,
    name,
    defaultLanguage,
    languages: { [defaultLanguage]: makeBlankVariant() },
    tags: [],
    folderIds: [],
    status: 'draft' satisfies TemplateStatus,
    createdAt: now,
    updatedAt: now,
  }
}

export function createPanelStore(args: CreatePanelStoreArgs): PanelStoreApi {
  const { adapter, defaultLanguage } = args

  return createStore<PanelState>((set, get) => {
    const getTemplateById = (id: string): Template | undefined =>
      get().templates.find((t) => t.id === id)

    const getActiveContext = (): { template: Template; language: string } | null => {
      const activeId = get().activeTemplateId
      if (!activeId) return null
      const template = getTemplateById(activeId)
      if (!template) return null
      return { template, language: template.defaultLanguage }
    }

    const persist = async (template: Template): Promise<Template> => {
      const stamped: Template = { ...template, updatedAt: nowIso() }
      await adapter.save(stamped)
      return stamped
    }

    const replaceLocal = (template: Template) => {
      set((state) => {
        const idx = state.templates.findIndex((t) => t.id === template.id)
        const next = state.templates.slice()
        if (idx >= 0) next[idx] = template
        else next.push(template)
        return { templates: next }
      })
    }

    const applyVersionToTemplate = async (
      version: TemplateVersion,
      createRestoreVersion: boolean,
    ): Promise<void> => {
      const original = getTemplateById(version.templateId)
      if (!original) return
      const existing =
        original.languages[version.language] ?? makeBlankVariant()
      const nextEditorJson = migrateEditorJson(version.editorJson)
      const updated: Template = {
        ...original,
        languages: {
          ...original.languages,
          [version.language]: {
            ...existing,
            editorJson: nextEditorJson,
            html: version.html,
            updatedAt: nowIso(),
          },
        },
      }
      const saved = await persist(updated)
      replaceLocal(saved)

      let versions = await adapter.listVersions(version.templateId, version.language)
      versions = versions.sort((a, b) => a.savedAt.localeCompare(b.savedAt))
      if (createRestoreVersion) {
        const restoreSnapshot: TemplateVersion = {
          versionId: createId('ver'),
          templateId: version.templateId,
          language: version.language,
          savedAt: nowIso(),
          type: 'restore',
          editorJson: nextEditorJson,
          html: version.html,
        }
        await adapter.saveVersion(restoreSnapshot)
        versions = [...versions, restoreSnapshot].sort((a, b) =>
          a.savedAt.localeCompare(b.savedAt),
        )
        set({
          versions,
          versionCursor: versions.findIndex(
            (v) => v.versionId === restoreSnapshot.versionId,
          ),
        })
        return
      }
      set({
        versions,
        versionCursor: versions.findIndex((v) => v.versionId === version.versionId),
      })
    }

    return {
      templates: [],
      loading: false,
      error: null,
      view: 'library',
      activeTemplateId: null,
      renameTargetId: null,
      deleteTargetId: null,
      defaultLanguage,
      selectedBlockId: null,
      activeTextBlockId: null,
      versions: [],
      versionCursor: -1,
      savedBlocks: [],

      load: async () => {
        set({ loading: true, error: null })
        try {
          const templates = await adapter.list()
          set({ templates, loading: false })
        } catch (error) {
          set({ loading: false, error: (error as Error).message })
        }
      },

      createBlank: async () => {
        const { templates } = get()
        const existing = templates.filter((t) =>
          t.name.startsWith('Untitled template'),
        ).length
        const suffix = existing === 0 ? '' : ` ${existing + 1}`
        const template = makeBlankTemplate(
          defaultLanguage,
          `Untitled template${suffix}`,
        )
        const saved = await persist(template)
        replaceLocal(saved)
        return saved.id
      },

      duplicate: async (id) => {
        const original = get().templates.find((t) => t.id === id)
        if (!original) throw new Error(`Template ${id} not found`)
        const now = nowIso()
        const copy: Template = {
          ...original,
          id: createId('tpl'),
          name: `${original.name} (Copy)`,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        }
        const saved = await persist(copy)
        replaceLocal(saved)
        return saved.id
      },

      rename: async (id, name) => {
        const original = get().templates.find((t) => t.id === id)
        if (!original) throw new Error(`Template ${id} not found`)
        const saved = await persist({ ...original, name })
        replaceLocal(saved)
      },

      remove: async (id) => {
        await adapter.delete(id)
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          activeTemplateId:
            state.activeTemplateId === id ? null : state.activeTemplateId,
          view: state.activeTemplateId === id ? 'library' : state.view,
          deleteTargetId: null,
        }))
      },

      openEditor: (id) =>
        set({
          view: 'editor',
          activeTemplateId: id,
          selectedBlockId: null,
          activeTextBlockId: null,
          versions: [],
          versionCursor: -1,
        }),
      backToLibrary: () =>
        set({
          view: 'library',
          activeTemplateId: null,
          selectedBlockId: null,
          activeTextBlockId: null,
          versions: [],
          versionCursor: -1,
        }),

      setSelectedBlockId: (id) => set({ selectedBlockId: id }),
      setActiveTextBlockId: (id) => set({ activeTextBlockId: id }),

      setRenameTarget: (id) => set({ renameTargetId: id }),
      setDeleteTarget: (id) => set({ deleteTargetId: id }),

      patchTemplate: async (id, patch) => {
        const original = get().templates.find((t) => t.id === id)
        if (!original) return
        const saved = await persist({ ...original, ...patch })
        replaceLocal(saved)
      },

      patchLanguageVariant: async (id, lang, patch) => {
        const original = get().templates.find((t) => t.id === id)
        if (!original) return
        const existing = original.languages[lang] ?? makeBlankVariant()
        const updated: Template = {
          ...original,
          languages: {
            ...original.languages,
            [lang]: { ...existing, ...patch, updatedAt: nowIso() },
          },
        }
        const saved = await persist(updated)
        replaceLocal(saved)
      },
      setStatus: async (id, status, note) => {
        const original = get().templates.find((t) => t.id === id)
        if (!original) return
        const saved = await persist({
          ...original,
          status,
          rejectionNote: status === 'draft' ? note ?? original.rejectionNote : undefined,
        })
        replaceLocal(saved)
      },

      loadVersions: async (templateId, language) => {
        try {
          const versions = (
            await adapter.listVersions(templateId, language)
          ).sort((a, b) => a.savedAt.localeCompare(b.savedAt))
          set({
            versions,
            versionCursor: versions.length > 0 ? versions.length - 1 : -1,
          })
        } catch {
          set({ versions: [], versionCursor: -1 })
        }
      },

      saveVersion: async ({
        templateId,
        language,
        type,
        editorJson,
        html,
        note,
      }) => {
        const snapshot: TemplateVersion = {
          versionId: createId('ver'),
          templateId,
          language,
          savedAt: nowIso(),
          type,
          note,
          editorJson,
          html,
        }
        try {
          const saved = await adapter.saveVersion(snapshot)
          const currentCtx = getActiveContext()
          if (
            currentCtx &&
            currentCtx.template.id === templateId &&
            currentCtx.language === language
          ) {
            const versions = [...get().versions, saved].sort((a, b) =>
              a.savedAt.localeCompare(b.savedAt),
            )
            const MAX_VERSIONS = 120
            const pruned =
              versions.length > MAX_VERSIONS
                ? versions.slice(versions.length - MAX_VERSIONS)
                : versions
            set({
              versions: pruned,
              versionCursor: pruned.length - 1,
            })
          }
          return saved
        } catch {
          return null
        }
      },

      restoreVersion: async (versionId) => {
        const version = await adapter.getVersion(versionId)
        if (!version) return
        await applyVersionToTemplate(version, true)
      },

      undo: async () => {
        const { versions, versionCursor } = get()
        if (versionCursor <= 0) return
        const target = versions[versionCursor - 1]
        if (!target) return
        await applyVersionToTemplate(target, false)
        set({ versionCursor: versionCursor - 1 })
      },

      redo: async () => {
        const { versions, versionCursor } = get()
        if (versionCursor < 0 || versionCursor >= versions.length - 1) return
        const target = versions[versionCursor + 1]
        if (!target) return
        await applyVersionToTemplate(target, false)
        set({ versionCursor: versionCursor + 1 })
      },

      loadSavedBlocks: async () => {
        try {
          const savedBlocks = await adapter.listSavedBlocks()
          set({ savedBlocks })
        } catch {
          set({ savedBlocks: [] })
        }
      },
      saveSavedBlock: async ({ name, visibility, snapshot, description }) => {
        const savedBlock: SavedBlock = {
          id: createId('sblk'),
          name,
          visibility,
          description,
          createdAt: nowIso(),
          snapshot,
        }
        const saved = await adapter.saveSavedBlock(savedBlock)
        set((state) => ({ savedBlocks: [...state.savedBlocks, saved] }))
      },
      deleteSavedBlock: async (savedBlockId) => {
        await adapter.deleteSavedBlock(savedBlockId)
        set((state) => ({
          savedBlocks: state.savedBlocks.filter((x) => x.id !== savedBlockId),
        }))
      },
    }
  })
}
