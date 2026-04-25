import type { ExportInput } from '../export'
import type { EmailBlock } from '../types/editorDocument'
import type { ValidationIssue, ValidationResult } from './types'

function issue(
  id: string,
  severity: 'error' | 'warning',
  code: string,
  message: string,
): ValidationIssue {
  return { id, severity, code, message }
}

function walkBlocks(blocks: EmailBlock[], out: ValidationIssue[]) {
  const toRgb = (hex: string): [number, number, number] | null => {
    const value = hex.trim().replace('#', '')
    if (![3, 6].includes(value.length)) return null
    const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
    const num = Number.parseInt(full, 16)
    if (Number.isNaN(num)) return null
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
  }
  const luminance = ([r, g, b]: [number, number, number]): number => {
    const linear = [r, g, b].map((v) => {
      const srgb = v / 255
      return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
    }) as [number, number, number]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  }
  const contrast = (a: [number, number, number], b: [number, number, number]): number => {
    const l1 = luminance(a)
    const l2 = luminance(b)
    const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1]
    return (light + 0.05) / (dark + 0.05)
  }

  for (const block of blocks) {
    if (block.type === 'image') {
      if (!block.props.url.trim()) {
        out.push(issue(block.id, 'warning', 'image_url_missing', 'Image block has no URL.'))
      }
      if (!block.props.alt.trim()) {
        out.push(issue(block.id, 'warning', 'image_alt_missing', 'Image block should include alt text.'))
      }
    }
    if (block.type === 'button') {
      if (!block.props.label.trim()) {
        out.push(issue(block.id, 'error', 'button_label_missing', 'Button label is required.'))
      }
      if (!block.props.href.trim()) {
        out.push(issue(block.id, 'error', 'button_href_missing', 'Button URL is required.'))
      }
      const fg = toRgb(block.props.textColor)
      const bg = toRgb(block.props.backgroundColor)
      if (fg && bg && contrast(fg, bg) < 4.5) {
        out.push(
          issue(
            block.id,
            'warning',
            'button_low_contrast',
            'Button text/background contrast appears below WCAG AA (4.5:1).',
          ),
        )
      }
    }
    if (block.type === 'conditional') {
      walkBlocks(block.props.thenBlocks, out)
      walkBlocks(block.props.elseBlocks, out)
    }
    if (block.type === 'loop') {
      walkBlocks(block.props.bodyBlocks, out)
      walkBlocks(block.props.emptyBlocks, out)
    }
  }
}

export function validateExportInput(input: ExportInput): ValidationResult {
  const issues: ValidationIssue[] = []
  if (!input.subject.trim()) {
    issues.push(issue('subject', 'error', 'subject_missing', 'Subject is required before export.'))
  }
  if (!input.preheader?.trim()) {
    issues.push(issue('preheader', 'warning', 'preheader_missing', 'Preheader is recommended for deliverability.'))
  }

  walkBlocks(input.document.blocks, issues)

  const joined = JSON.stringify(input.document)
  for (const group of input.variableSchema) {
    for (const v of group.variables) {
      if (v.required && !joined.includes(`"key":"${v.key}"`)) {
        issues.push(
          issue(`var:${v.key}`, 'error', 'required_variable_missing', `Required variable "${v.label}" is not used.`),
        )
      }
    }
  }

  return {
    issues,
    hasErrors: issues.some((x) => x.severity === 'error'),
    hasWarnings: issues.some((x) => x.severity === 'warning'),
  }
}
