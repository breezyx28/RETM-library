import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/**
 * Alias `emailcraft` and `emailcraft/styles.css` to the library source so
 * edits hot-reload without a rebuild step. Regex aliases are used so the
 * bare-specifier and the subpath don't collide via prefix matching.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^emailcraft\/styles\.css$/,
        replacement: resolve(__dirname, '../src/styles/index.css'),
      },
      {
        find: /^emailcraft$/,
        replacement: resolve(__dirname, '../src/index.ts'),
      },
    ],
  },
  server: {
    port: 5173,
    open: true,
  },
})
