import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  Copy,
  Download,
  ExternalLink,
  Eye,
  FolderInput,
  MoreVertical,
  Pencil,
  Tag,
  Trash2,
} from 'lucide-react'

export interface TemplateCardMenuProps {
  onEdit: () => void
  onPreview: () => void
  onPreviewHtml: () => void
  onExportHtml: () => void
  onDuplicate: () => void
  onRename: () => void
  onDelete: () => void
  canEdit?: boolean
  canDelete?: boolean
  canMoveFolder?: boolean
}

/**
 * 3-dot menu on a library template card (spec §6.1).
 *
 * The full menu from the spec is rendered so the visual shape is already
 * correct; entries that aren't wired yet are disabled with a label like
 * "coming in Phase 1 Slice C" / "coming in Phase 2".
 */
export function TemplateCardMenu(props: TemplateCardMenuProps) {
  const {
    onEdit,
    onPreview,
    onPreviewHtml,
    onExportHtml,
    onDuplicate,
    onRename,
    onDelete,
    canEdit = true,
    canDelete = true,
    canMoveFolder = false,
  } =
    props

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          data-ec-icon-btn=""
          aria-label="Template actions"
        >
          <MoreVertical size={16} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          data-ec-menu=""
          align="end"
          sideOffset={6}
          collisionPadding={12}
        >
          <DropdownMenu.Item data-ec-menu-item="" onSelect={onEdit} disabled={!canEdit}>
            <Pencil size={14} aria-hidden="true" />
            <span>Edit</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item data-ec-menu-item="" onSelect={onPreview}>
            <Eye size={14} aria-hidden="true" />
            <span>Preview</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item data-ec-menu-item="" onSelect={onPreviewHtml}>
            <ExternalLink size={14} aria-hidden="true" />
            <span>Preview as HTML</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item data-ec-menu-item="" onSelect={onExportHtml}>
            <Download size={14} aria-hidden="true" />
            <span>Export HTML</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator data-ec-menu-separator="" />

          <DropdownMenu.Item data-ec-menu-item="" onSelect={onDuplicate} disabled={!canEdit}>
            <Copy size={14} aria-hidden="true" />
            <span>Duplicate</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item data-ec-menu-item="" onSelect={onRename} disabled={!canEdit}>
            <Tag size={14} aria-hidden="true" />
            <span>Rename</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            data-ec-menu-item=""
            data-ec-disabled=""
            disabled={!canMoveFolder}
            title={canMoveFolder ? undefined : 'Requires folder organization'}
          >
            <FolderInput size={14} aria-hidden="true" />
            <span>Move to folder</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator data-ec-menu-separator="" />

          <DropdownMenu.Item
            data-ec-menu-item=""
            data-ec-destructive=""
            disabled={!canDelete}
            onSelect={onDelete}
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>Delete</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
