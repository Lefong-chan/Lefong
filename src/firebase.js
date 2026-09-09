import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL

const missing = []
if (!apiKey) missing.push('VITE_FIREBASE_API_KEY (or FIREBASE_WEB_API_KEY)')
if (!projectId) missing.push('VITE_FIREBASE_PROJECT_ID (or FIREBASE_PROJECT_ID)')
if (!databaseURL) missing.push('VITE_FIREBASE_DATABASE_URL (or FIREBASE_DATABASE_URL)')
if (missing.length) {
  throw new Error(
    `Firebase not configured: missing variable(s) - ${missing.join(', ')}. ` +
      'Add them in the Environment Variables (Vercel) or .env.local, then redeploy.'
  )
}

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  databaseURL,
  projectId,
  storageBucket: `${projectId}.appspot.com`
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getDatabase(firebaseApp)
export const googleProvider = new GoogleAuthProvider()

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'fongchaneric1@gmail.com').toLowerCase()
