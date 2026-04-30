import { defineConfig } from 'tsup'
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'

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
 * Run Tailwind v4 CLI to compile `src/theme.css` (the Tailwind source entry,
 * with `@theme` tokens and the library's `@layer components` rules) into the
 * shipped `dist/styles.css`. Also copies the source `theme.css` and its
 * imported partials so consumers can `@import 'retm-library/theme.css'` from
 * their own Tailwind v4 setup for full-customization mode.
 */
async function buildCss(): Promise<void> {
  const root = process.cwd()
  const distDir = resolve(root, 'dist')
  if (!existsSync(distDir)) {
    await mkdir(distDir, { recursive: true })
  }

  const exitCode: number = await new Promise((resolveProc, rejectProc) => {
    const isWin = process.platform === 'win32'
    const cmd = isWin ? 'npx.cmd' : 'npx'
    const child = spawn(
      cmd,
      [
        '--yes',
        '@tailwindcss/cli',
        '-i',
        'src/theme.css',
        '-o',
        'dist/styles.css',
        '--minify',
      ],
      { cwd: root, stdio: 'inherit', shell: isWin },
    )
    child.on('exit', (code) => resolveProc(code ?? 1))
    child.on('error', rejectProc)
  })
  if (exitCode !== 0) {
    throw new Error(`Tailwind CLI exited with code ${exitCode}`)
  }

  // Ship the Tailwind source entry + its imported partials.
  const themeOut = resolve(distDir, 'theme')
  if (!existsSync(themeOut)) {
    await mkdir(themeOut, { recursive: true })
  }
  await copyFile(resolve(root, 'src/theme.css'), resolve(distDir, 'theme.css'))
  await copyFile(
    resolve(root, 'src/theme/panel.css'),
    resolve(themeOut, 'panel.css'),
  )
  await copyFile(
    resolve(root, 'src/theme/editor.css'),
    resolve(themeOut, 'editor.css'),
  )
}

/**
 * Two build passes:
 *  - JS/TS entry -> dist/index.{js,cjs,d.ts} + prepended "use client"
 *  - CSS         -> Tailwind v4 CLI compiles `src/theme.css` into
 *                   `dist/styles.css`, plus a copy of the source `theme.css`
 *                   for consumers using their own Tailwind v4 pipeline.
 */
export default defineConfig({
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
    await buildCss()
  },
})
