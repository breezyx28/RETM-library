import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

/**
 * Alias `retm-library` and its CSS subpaths to the library source so edits
 * hot-reload without a rebuild step. Regex aliases are used so the bare
 * specifier and the CSS subpaths don't collide via prefix matching.
 *
 * `@tailwindcss/vite` compiles the library's `src/theme.css` (Tailwind v4
 * source with `@theme` tokens + `@layer components` rules) on the fly.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^retm-library\/styles\.css$/,
        replacement: resolve(__dirname, '../src/theme.css'),
      },
      {
        find: /^retm-library\/theme\.css$/,
        replacement: resolve(__dirname, '../src/theme.css'),
      },
      {
        find: /^retm-library$/,
        replacement: resolve(__dirname, '../src/index.ts'),
      },
    ],
  },
  server: {
    port: 5173,
    open: true,
  },
})
