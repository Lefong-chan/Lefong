import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'

function buildApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  const databaseURL = process.env.FIREBASE_DATABASE_URL

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error('Firebase Admin env vars are missing (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY / FIREBASE_DATABASE_URL)')
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL
  })
}

const app = getApps().length ? getApps()[0] : buildApp()

export const adminAuth = getAuth(app)
export const adminDb = getDatabase(app)

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'fongchaneric1@gmail.com').toLowerCase()

export async function requireAdmin(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    const err = new Error('Missing Authorization bearer token')
    err.statusCode = 401
    throw err
  }
  const decoded = await adminAuth.verifyIdToken(token)
  if ((decoded.email || '').toLowerCase() !== ADMIN_EMAIL) {
    const err = new Error('Not authorized')
    err.statusCode = 403
    throw err
  }
  return decoded
}

export async function requireUser(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    const err = new Error('Missing Authorization bearer token')
    err.statusCode = 401
    throw err
  }
  return adminAuth.verifyIdToken(token)
}
