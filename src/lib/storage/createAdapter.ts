import type { Template, TemplateVersion } from '../../types'
import type { StorageMode } from '../../components/EmailTemplatePanel/EmailTemplatePanel.types'
import { StorageAdapterError, type StorageAdapter } from './types'
import { createLocalStorageAdapter } from './localAdapter'
import type { SavedBlock } from '../types/savedBlock'

export interface StorageCallbacks {
  onSave?: (template: Template) => void | Promise<void>
  onLoad?: () => Promise<Template[]> | Template[]
  onDelete?: (id: string) => void | Promise<void>
  onListVersions?: (
    templateId: string,
    language: string,
  ) => Promise<TemplateVersion[]> | TemplateVersion[]
  onGetVersion?: (versionId: string) => Promise<TemplateVersion | null> | TemplateVersion | null
  onSaveVersion?: (version: TemplateVersion) => void | Promise<void>
  onListSavedBlocks?: () => Promise<SavedBlock[]> | SavedBlock[]
  onSaveSavedBlock?: (savedBlock: SavedBlock) => void | Promise<void>
  onDeleteSavedBlock?: (savedBlockId: string) => void | Promise<void>
}

export interface CreateAdapterArgs {
  mode: StorageMode
  callbacks: StorageCallbacks
  storageKey?: string
}

/**
 * Factory that returns the active adapter for the current `storageMode`.
 */
export function createAdapter(args: CreateAdapterArgs): StorageAdapter {
  const local = createLocalStorageAdapter({ storageKey: args.storageKey })
  switch (args.mode) {
    case 'local':
      return createLocalWithCallbacksAdapter(local, args.callbacks)
    case 'backend':
      return createBackendAdapter(args.callbacks)
    case 'hybrid':
      return createHybridAdapter(local, args.callbacks)
    default:
      return createLocalWithCallbacksAdapter(local, args.callbacks)
  }
}

function createLocalWithCallbacksAdapter(
  local: StorageAdapter,
  callbacks: StorageCallbacks,
): StorageAdapter {
  return {
    async list() {
      return local.list()
    },
    async get(id) {
      return local.get(id)
    },
    async save(template) {
      const saved = await local.save(template)
      await callbacks.onSave?.(saved)
      return saved
    },
    async delete(id) {
      await local.delete(id)
      await callbacks.onDelete?.(id)
    },
    async listVersions(templateId, language) {
      return local.listVersions(templateId, language)
    },
    async getVersion(versionId) {
      return local.getVersion(versionId)
    },
    async saveVersion(version) {
      const saved = await local.saveVersion(version)
      await callbacks.onSaveVersion?.(saved)
      return saved
    },
    async listSavedBlocks() {
      return local.listSavedBlocks()
    },
    async saveSavedBlock(savedBlock) {
      const saved = await local.saveSavedBlock(savedBlock)
      await callbacks.onSaveSavedBlock?.(saved)
      return saved
    },
    async deleteSavedBlock(savedBlockId) {
      await local.deleteSavedBlock(savedBlockId)
      await callbacks.onDeleteSavedBlock?.(savedBlockId)
    },
  }
}

function createBackendAdapter(callbacks: StorageCallbacks): StorageAdapter {
  const requireOnLoad = async (): Promise<Template[]> => {
    if (!callbacks.onLoad) {
      throw new StorageAdapterError(
        'storageMode="backend" requires `onLoad` callback.',
      )
    }
    const loaded = await callbacks.onLoad()
    return Array.isArray(loaded) ? loaded : []
  }

  const requireOnSave = async (template: Template): Promise<void> => {
    if (!callbacks.onSave) {
      throw new StorageAdapterError(
        'storageMode="backend" requires `onSave` callback.',
      )
    }
    await callbacks.onSave(template)
  }

  const requireOnDelete = async (id: string): Promise<void> => {
    if (!callbacks.onDelete) {
      throw new StorageAdapterError(
        'storageMode="backend" requires `onDelete` callback.',
      )
    }
    await callbacks.onDelete(id)
  }

  const requireOnListVersions = async (
    templateId: string,
    language: string,
  ): Promise<TemplateVersion[]> => {
    if (!callbacks.onListVersions) {
      throw new StorageAdapterError(
        'storageMode="backend" requires `onListVersions` callback for version history.',
      )
    }
    const listed = await callbacks.onListVersions(templateId, language)
    return Array.isArray(listed) ? listed : []
  }

  const requireOnGetVersion = async (
    versionId: string,
  ): Promise<TemplateVersion | null> => {
    if (!callbacks.onGetVersion) {
      throw new StorageAdapterError(
        'storageMode="backend" requires `onGetVersion` callback for version history.',
      )
    }
    return (await callbacks.onGetVersion(versionId)) ?? null
  }

  const requireOnSaveVersion = async (version: TemplateVersion): Promise<void> => {
    if (!callbacks.onSaveVersion) {
      throw new StorageAdapterError(
        'storageMode="backend" requires `onSaveVersion` callback for version history.',
      )
    }
    await callbacks.onSaveVersion(version)
  }

  const requireOnListSavedBlocks = async (): Promise<SavedBlock[]> => {
    if (!callbacks.onListSavedBlocks) {
      throw new StorageAdapterError(
        'storageMode="backend" requires `onListSavedBlocks` callback for saved blocks.',
      )
    }
    const listed = await callbacks.onListSavedBlocks()
    return Array.isArray(listed) ? listed : []
  }

  const requireOnSaveSavedBlock = async (savedBlock: SavedBlock): Promise<void> => {
    if (!callbacks.onSaveSavedBlock) {
      throw new StorageAdapterError(
        'storageMode="backend" requires `onSaveSavedBlock` callback for saved blocks.',
      )
    }
    await callbacks.onSaveSavedBlock(savedBlock)
  }

  const requireOnDeleteSavedBlock = async (savedBlockId: string): Promise<void> => {
    if (!callbacks.onDeleteSavedBlock) {
      throw new StorageAdapterError(
        'storageMode="backend" requires `onDeleteSavedBlock` callback for saved blocks.',
      )
    }
    await callbacks.onDeleteSavedBlock(savedBlockId)
  }

  return {
    async list() {
      return requireOnLoad()
    },
    async get(id) {
      const all = await requireOnLoad()
      return all.find((template) => template.id === id) ?? null
    },
    async save(template) {
      await requireOnSave(template)
      return template
    },
    async delete(id) {
      await requireOnDelete(id)
    },
    async listVersions(templateId, language) {
      return requireOnListVersions(templateId, language)
    },
    async getVersion(versionId) {
      return requireOnGetVersion(versionId)
    },
    async saveVersion(version) {
      await requireOnSaveVersion(version)
      return version
    },
    async listSavedBlocks() {
      return requireOnListSavedBlocks()
    },
    async saveSavedBlock(savedBlock) {
      await requireOnSaveSavedBlock(savedBlock)
      return savedBlock
    },
    async deleteSavedBlock(savedBlockId) {
      await requireOnDeleteSavedBlock(savedBlockId)
    },
  }
}

/**
 * Hybrid strategy:
 * - Reads prefer backend (`onLoad`) when present; fallback to local on error.
 * - Successful backend reads are mirrored into local cache.
 * - Writes (`save`/`delete`) execute backend callback first, then mirror local.
 * - If backend callback is absent, operation degrades to local-only behavior.
 */
function createHybridAdapter(
  local: StorageAdapter,
  callbacks: StorageCallbacks,
): StorageAdapter {
  return {
    async list() {
      if (!callbacks.onLoad) return local.list()
      try {
        const loaded = await callbacks.onLoad()
        const templates = Array.isArray(loaded) ? loaded : []
        for (const template of templates) {
          await local.save(template)
        }
        return templates
      } catch {
        return local.list()
      }
    },
    async get(id) {
      const items = await this.list()
      return items.find((template) => template.id === id) ?? null
    },
    async save(template) {
      if (callbacks.onSave) {
        await callbacks.onSave(template)
      }
      await local.save(template)
      return template
    },
    async delete(id) {
      if (callbacks.onDelete) {
        await callbacks.onDelete(id)
      }
      await local.delete(id)
    },
    async listVersions(templateId, language) {
      if (!callbacks.onListVersions) {
        return local.listVersions(templateId, language)
      }
      try {
        const listed = await callbacks.onListVersions(templateId, language)
        const versions = Array.isArray(listed) ? listed : []
        for (const version of versions) {
          await local.saveVersion(version)
        }
        return versions.sort((a, b) => a.savedAt.localeCompare(b.savedAt))
      } catch {
        return local.listVersions(templateId, language)
      }
    },
    async getVersion(versionId) {
      if (!callbacks.onGetVersion) {
        return local.getVersion(versionId)
      }
      try {
        const version = (await callbacks.onGetVersion(versionId)) ?? null
        if (version) {
          await local.saveVersion(version)
        }
        return version
      } catch {
        return local.getVersion(versionId)
      }
    },
    async saveVersion(version) {
      if (callbacks.onSaveVersion) {
        await callbacks.onSaveVersion(version)
      }
      await local.saveVersion(version)
      return version
    },
    async listSavedBlocks() {
      if (!callbacks.onListSavedBlocks) return local.listSavedBlocks()
      try {
        const listed = await callbacks.onListSavedBlocks()
        const blocks = Array.isArray(listed) ? listed : []
        for (const item of blocks) {
          await local.saveSavedBlock(item)
        }
        return blocks
      } catch {
        return local.listSavedBlocks()
      }
    },
    async saveSavedBlock(savedBlock) {
      if (callbacks.onSaveSavedBlock) await callbacks.onSaveSavedBlock(savedBlock)
      await local.saveSavedBlock(savedBlock)
      return savedBlock
    },
    async deleteSavedBlock(savedBlockId) {
      if (callbacks.onDeleteSavedBlock) await callbacks.onDeleteSavedBlock(savedBlockId)
      await local.deleteSavedBlock(savedBlockId)
    },
  }
}
