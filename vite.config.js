import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'))
process.env.VITE_APP_VERSION = pkg.version

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',  // Use relative paths so Electron can load from file://
})
