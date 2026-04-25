import { createLocalStorageAdapter } from './localAdapter'

describe('createLocalStorageAdapter', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('persists templates and versions', async () => {
    const adapter = createLocalStorageAdapter({ storageKey: 'test:retm-library' })
    const now = '2026-01-01T00:00:00.000Z'
    const template = {
      id: 'tpl_1',
      name: 'Template',
      defaultLanguage: 'en',
      languages: { en: { subject: '', preheader: '', editorJson: {}, html: '', updatedAt: now } },
      status: 'draft' as const,
      createdAt: now,
      updatedAt: now,
      tags: [],
      folderIds: [],
    }
    await adapter.save(template)
    const listed = await adapter.list()
    expect(listed).toHaveLength(1)

    await adapter.saveVersion({
      versionId: 'ver_1',
      templateId: 'tpl_1',
      language: 'en',
      savedAt: now,
      type: 'manual',
      editorJson: {},
      html: '<html/>',
    })
    const versions = await adapter.listVersions('tpl_1', 'en')
    expect(versions).toHaveLength(1)
  })
})
