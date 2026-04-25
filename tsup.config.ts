import { defineConfig } from 'tsup'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const USE_CLIENT = '"use client";\n'

/**
 * Post-build hook: prepend the `"use client"` directive to the bundled JS
 * outputs. tsup/esbuild strips module-level directives during bundling, so we
 * inject them after the fact to keep Next.js App Router compatibility without
 * forcing consumers to wrap every import.
 */
async function prependUseClient(): Promise<void> {
  const outDir = resolve(process.cwd(), 'dist')
  for (const file of ['index.js', 'index.cjs']) {
    const full = resolve(outDir, file)
    if (!existsSync(full)) continue
    const content = await readFile(full, 'utf8')
    if (content.startsWith('"use client"') || content.startsWith("'use client'")) {
      continue
    }
    await writeFile(full, USE_CLIENT + content, 'utf8')
  }
}

/**
 * Two build passes:
 *  - JS/TS entry -> dist/index.{js,cjs,d.ts} + prepended "use client"
 *  - CSS entry   -> dist/styles.css (bundled from src/styles/index.css)
 */
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    target: 'es2020',
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    splitting: false,
    outExtension: ({ format }) => ({
      js: format === 'cjs' ? '.cjs' : '.js',
    }),
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@tiptap/core',
      '@tiptap/react',
      '@tiptap/pm',
      '@tiptap/suggestion',
      '@tiptap/starter-kit',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'lucide-react',
      'zustand',
      'juice',
      'he',
      'shiki',
    ],
    onSuccess: async () => {
      await prependUseClient()
    },
  },
  {
    entry: { styles: 'src/styles/index.css' },
    outDir: 'dist',
    clean: false,
    sourcemap: false,
  },
])
