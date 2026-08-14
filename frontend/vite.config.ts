// vitest's defineConfig, not vite's — it is the one that knows about `test`.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Pure logic runs in node; anything touching the DOM opts in with the
    // `@vitest-environment jsdom` docblock at the top of the file.
    environment: 'node',
    globals: false,
  },
})
