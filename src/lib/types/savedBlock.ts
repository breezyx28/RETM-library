import type { EmailBlock } from './editorDocument'

export type SavedBlockVisibility = 'personal' | 'shared'

export interface SavedBlock {
  id: string
  name: string
  description?: string
  visibility: SavedBlockVisibility
  tags?: string[]
  createdBy?: string
  createdAt: string
  snapshot: EmailBlock
}
