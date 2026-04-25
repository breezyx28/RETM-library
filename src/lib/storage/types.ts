import type { Template, TemplateVersion } from '../../types'
import type { SavedBlock } from '../types/savedBlock'

/**
 * Storage adapter contract (spec §9.6).
 *
 * All methods return Promises so consumers can freely swap in async backends
 * even though the local implementation is synchronous under the hood.
 */
export interface StorageAdapter {
  list(): Promise<Template[]>
  get(id: string): Promise<Template | null>
  save(template: Template): Promise<Template>
  delete(id: string): Promise<void>
  listVersions(templateId: string, language: string): Promise<TemplateVersion[]>
  getVersion(versionId: string): Promise<TemplateVersion | null>
  saveVersion(version: TemplateVersion): Promise<TemplateVersion>
  listSavedBlocks(): Promise<SavedBlock[]>
  saveSavedBlock(savedBlock: SavedBlock): Promise<SavedBlock>
  deleteSavedBlock(savedBlockId: string): Promise<void>
}

export class StorageAdapterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageAdapterError'
  }
}
