import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Compose class names, then resolve Tailwind utility conflicts so user-supplied
 * classes win over library defaults (e.g. user `bg-blue-500` beats default
 * `bg-ec-primary`). Uses `tailwind-merge` for conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
