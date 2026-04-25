import { createAdapter } from './createAdapter'

describe('createAdapter', () => {
  it('uses backend callbacks in backend mode', async () => {
    const onLoad = vi.fn().mockResolvedValue([])
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onDelete = vi.fn().mockResolvedValue(undefined)
    const onListVersions = vi.fn().mockResolvedValue([])
    const onGetVersion = vi.fn().mockResolvedValue(null)
    const onSaveVersion = vi.fn().mockResolvedValue(undefined)
    const onListSavedBlocks = vi.fn().mockResolvedValue([])
    const onSaveSavedBlock = vi.fn().mockResolvedValue(undefined)
    const onDeleteSavedBlock = vi.fn().mockResolvedValue(undefined)

    const adapter = createAdapter({
      mode: 'backend',
      callbacks: {
        onLoad,
        onSave,
        onDelete,
        onListVersions,
        onGetVersion,
        onSaveVersion,
        onListSavedBlocks,
        onSaveSavedBlock,
        onDeleteSavedBlock,
      },
    })

    await adapter.list()
    expect(onLoad).toHaveBeenCalled()
    await adapter.listSavedBlocks()
    expect(onListSavedBlocks).toHaveBeenCalled()
  })

  it('falls back to local in hybrid mode when backend read fails', async () => {
    const adapter = createAdapter({
      mode: 'hybrid',
      callbacks: {
        onLoad: vi.fn().mockRejectedValue(new Error('offline')),
      },
      storageKey: 'test:hybrid',
    })
    const templates = await adapter.list()
    expect(templates).toEqual([])
  })
})
