import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite only ever exposes VITE_-prefixed env vars to client code (on purpose,
// so secrets like FIREBASE_PRIVATE_KEY never leak into the browser bundle).
// The project's env vars were originally named without that prefix
// (FIREBASE_PROJECT_ID, FIREBASE_WEB_API_KEY, FIREBASE_DATABASE_URL), so we
// explicitly forward just those three safe, non-secret values here - this
// keeps the app working with either naming convention (Vercel env vars or
// .env.local) without duplicating variables.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const apiKey = env.VITE_FIREBASE_API_KEY || env.FIREBASE_WEB_API_KEY || ''
  const projectId = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || ''
  const databaseURL = env.VITE_FIREBASE_DATABASE_URL || env.FIREBASE_DATABASE_URL || ''
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || (projectId ? `${projectId}.firebaseapp.com` : '')
  const adminEmail = env.VITE_ADMIN_EMAIL || env.ADMIN_EMAIL || 'fongchaneric1@gmail.com'

  return {
    plugins: [vue()],
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(projectId),
      'import.meta.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(databaseURL),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(authDomain),
      'import.meta.env.VITE_ADMIN_EMAIL': JSON.stringify(adminEmail)
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
  }
})
