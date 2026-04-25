import { createPanelStore } from './panelStore'
import type { StorageAdapter } from '../storage'

function createAdapterMock(): StorageAdapter {
  const templates: any[] = []
  const versions: any[] = []
  const savedBlocks: any[] = []
  return {
    async list() {
      return templates
    },
    async get(id) {
      return templates.find((t) => t.id === id) ?? null
    },
    async save(template) {
      const idx = templates.findIndex((t) => t.id === template.id)
      if (idx >= 0) templates[idx] = template
      else templates.push(template)
      return template
    },
    async delete(id) {
      const idx = templates.findIndex((t) => t.id === id)
      if (idx >= 0) templates.splice(idx, 1)
    },
    async listVersions(templateId, language) {
      return versions.filter((v) => v.templateId === templateId && v.language === language)
    },
    async getVersion(versionId) {
      return versions.find((v) => v.versionId === versionId) ?? null
    },
    async saveVersion(version) {
      versions.push(version)
      return version
    },
    async listSavedBlocks() {
      return savedBlocks
    },
    async saveSavedBlock(savedBlock) {
      savedBlocks.push(savedBlock)
      return savedBlock
    },
    async deleteSavedBlock(savedBlockId) {
      const idx = savedBlocks.findIndex((x) => x.id === savedBlockId)
      if (idx >= 0) savedBlocks.splice(idx, 1)
    },
  }
}

describe('panelStore', () => {
  it('creates template and manages saved blocks lifecycle', async () => {
    const store = createPanelStore({
      adapter: createAdapterMock(),
      defaultLanguage: 'en',
    })
    const id = await store.getState().createBlank()
    expect(id).toBeTruthy()
    expect(store.getState().templates.length).toBe(1)

    await store.getState().saveSavedBlock({
      name: 'Hero',
      visibility: 'personal',
      snapshot: {
        id: 'b1',
        type: 'text',
        props: { doc: { type: 'doc', content: [{ type: 'paragraph' }] } },
      },
    } as any)
    expect(store.getState().savedBlocks.length).toBe(1)
    const savedId = store.getState().savedBlocks[0]!.id
    await store.getState().loadSavedBlocks()
    expect(store.getState().savedBlocks.length).toBe(1)
    await store.getState().deleteSavedBlock(savedId)
    expect(store.getState().savedBlocks.length).toBe(0)
  })

  it('handles undo redo boundaries and cursor movement', async () => {
    const store = createPanelStore({
      adapter: createAdapterMock(),
      defaultLanguage: 'en',
    })
    const id = await store.getState().createBlank()
    store.getState().openEditor(id)
    const template = store.getState().templates[0]!
    const lang = template.defaultLanguage

    await store.getState().saveVersion({
      templateId: id,
      language: lang,
      type: 'manual',
      editorJson: { version: 1, blocks: [], attachments: [] },
      html: '<html>a</html>',
    })
    await store.getState().saveVersion({
      templateId: id,
      language: lang,
      type: 'manual',
      editorJson: { version: 1, blocks: [], attachments: [] },
      html: '<html>b</html>',
    })

    expect(store.getState().versionCursor).toBe(1)
    await store.getState().undo()
    expect(store.getState().versionCursor).toBe(0)
    await store.getState().undo()
    expect(store.getState().versionCursor).toBe(0)
    await store.getState().redo()
    expect(store.getState().versionCursor).toBe(1)
    await store.getState().redo()
    expect(store.getState().versionCursor).toBe(1)
  })

  it('restoreVersion creates restore snapshot and updates cursor', async () => {
    const adapter = createAdapterMock()
    const store = createPanelStore({
      adapter,
      defaultLanguage: 'en',
    })
    const id = await store.getState().createBlank()
    const version = await store.getState().saveVersion({
      templateId: id,
      language: 'en',
      type: 'manual',
      editorJson: { version: 1, blocks: [], attachments: [] },
      html: '<html>v1</html>',
    })
    expect(version).toBeTruthy()
    await store.getState().restoreVersion(version!.versionId)
    const versions = await adapter.listVersions(id, 'en')
    expect(versions.some((v: any) => v.type === 'restore')).toBe(true)
    expect(store.getState().versionCursor).toBeGreaterThanOrEqual(0)
  })

  it('supports rejection note transitions when setting status', async () => {
    const store = createPanelStore({
      adapter: createAdapterMock(),
      defaultLanguage: 'en',
    })
    const id = await store.getState().createBlank()
    await store.getState().setStatus(id, 'pending_review')
    expect(store.getState().templates[0]!.status).toBe('pending_review')
    await store.getState().setStatus(id, 'draft', 'Needs legal approval')
    expect(store.getState().templates[0]!.status).toBe('draft')
    expect(store.getState().templates[0]!.rejectionNote).toBe('Needs legal approval')
  })
})
