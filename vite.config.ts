import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset URLs work at both a domain root and a GitHub Pages project path.
  base: './',
  plugins: [react()],
  build: { target: 'es2022' },
})
