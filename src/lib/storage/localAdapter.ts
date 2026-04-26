import type { Template, TemplateVersion } from '../../types'
import type { SavedBlock } from '../types/savedBlock'
import { notifyLocalTemplatesChanged } from './localTemplateEvents'
import { StorageAdapterError, type StorageAdapter } from './types'

/**
 * LocalStorage-backed adapter. Stores the full template array under a single
 * key so reads are atomic and no cross-key consistency is required.
 *
 * The key is versioned (`:v1`) so a future schema migration can live alongside
 * without overwriting existing data.
 */
const DEFAULT_KEY = 'retm-library:templates:v1'

interface LocalAdapterOptions {
  storageKey?: string
}

export function createLocalStorageAdapter(
  options: LocalAdapterOptions = {},
): StorageAdapter {
  const key = options.storageKey ?? DEFAULT_KEY
  const versionKey = `${key}:versions:v1`
  const savedBlocksKey = `${key}:saved-blocks:v1`

  const readAll = (): Template[] => {
    if (typeof window === 'undefined' || !window.localStorage) return []
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as Template[]) : []
    } catch (error) {
      throw new StorageAdapterError(
        `Failed to read templates from localStorage: ${(error as Error).message}`,
      )
    }
  }

  const writeAll = (templates: Template[]): void => {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      window.localStorage.setItem(key, JSON.stringify(templates))
      notifyLocalTemplatesChanged(key)
    } catch (error) {
      throw new StorageAdapterError(
        `Failed to write templates to localStorage: ${(error as Error).message}`,
      )
    }
  }

  const readVersions = (): TemplateVersion[] => {
    if (typeof window === 'undefined' || !window.localStorage) return []
    try {
      const raw = window.localStorage.getItem(versionKey)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as TemplateVersion[]) : []
    } catch (error) {
      throw new StorageAdapterError(
        `Failed to read template versions from localStorage: ${(error as Error).message}`,
      )
    }
  }

  const writeVersions = (versions: TemplateVersion[]): void => {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      window.localStorage.setItem(versionKey, JSON.stringify(versions))
    } catch (error) {
      throw new StorageAdapterError(
        `Failed to write template versions to localStorage: ${(error as Error).message}`,
      )
    }
  }

  const readSavedBlocks = (): SavedBlock[] => {
    if (typeof window === 'undefined' || !window.localStorage) return []
    try {
      const raw = window.localStorage.getItem(savedBlocksKey)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as SavedBlock[]) : []
    } catch (error) {
      throw new StorageAdapterError(
        `Failed to read saved blocks from localStorage: ${(error as Error).message}`,
      )
    }
  }

  const writeSavedBlocks = (items: SavedBlock[]): void => {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      window.localStorage.setItem(savedBlocksKey, JSON.stringify(items))
    } catch (error) {
      throw new StorageAdapterError(
        `Failed to write saved blocks to localStorage: ${(error as Error).message}`,
      )
    }
  }

  return {
    async list() {
      return readAll()
    },
    async get(id) {
      const all = readAll()
      return all.find((t) => t.id === id) ?? null
    },
    async save(template) {
      const all = readAll()
      const idx = all.findIndex((t) => t.id === template.id)
      if (idx >= 0) {
        all[idx] = template
      } else {
        all.push(template)
      }
      writeAll(all)
      return template
    },
    async delete(id) {
      const all = readAll()
      const next = all.filter((t) => t.id !== id)
      writeAll(next)
      const versions = readVersions().filter((v) => v.templateId !== id)
      writeVersions(versions)
    },
    async listVersions(templateId, language) {
      const all = readVersions()
      return all
        .filter((v) => v.templateId === templateId && v.language === language)
        .sort((a, b) => a.savedAt.localeCompare(b.savedAt))
    },
    async getVersion(versionId) {
      const all = readVersions()
      return all.find((v) => v.versionId === versionId) ?? null
    },
    async saveVersion(version) {
      const all = readVersions()
      const idx = all.findIndex((v) => v.versionId === version.versionId)
      if (idx >= 0) {
        all[idx] = version
      } else {
        all.push(version)
      }
      const MAX_VERSIONS = 300
      const pruned =
        all.length > MAX_VERSIONS
          ? all.slice(all.length - MAX_VERSIONS)
          : all
      writeVersions(pruned)
      return version
    },
    async listSavedBlocks() {
      return readSavedBlocks()
    },
    async saveSavedBlock(savedBlock) {
      const all = readSavedBlocks()
      const idx = all.findIndex((x) => x.id === savedBlock.id)
      if (idx >= 0) all[idx] = savedBlock
      else all.push(savedBlock)
      writeSavedBlocks(all)
      return savedBlock
    },
    async deleteSavedBlock(savedBlockId) {
      const all = readSavedBlocks().filter((x) => x.id !== savedBlockId)
      writeSavedBlocks(all)
    },
  }
}
