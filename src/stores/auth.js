import { defineStore } from 'pinia'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { ref, set, get } from 'firebase/database'
import { auth, db, googleProvider, ADMIN_EMAIL } from '../firebase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    ready: false
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => !!state.user && (state.user.email || '').toLowerCase() === ADMIN_EMAIL
  },
  actions: {
    init() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, (firebaseUser) => {
          this.user = firebaseUser
          this.ready = true
          resolve(firebaseUser)
        })
      })
    },

    async register({ name, email, password }) {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      this.user = cred.user
      await this.saveProfile(cred.user, name)
      return cred.user
    },

    async login({ email, password }) {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      this.user = cred.user
      return cred.user
    },

    async loginWithGoogle() {
      const cred = await signInWithPopup(auth, googleProvider)
      this.user = cred.user
      await this.saveProfile(cred.user, cred.user.displayName)
      return cred.user
    },

    async saveProfile(user, name) {
      const profileRef = ref(db, `users/${user.uid}`)
      const snap = await get(profileRef)
      const existing = snap.exists() ? snap.val() : {}
      await set(profileRef, {
        ...existing,
        uid: user.uid,
        name: name || existing.name || '',
        email: user.email,
        isAdmin: (user.email || '').toLowerCase() === ADMIN_EMAIL,
        updatedAt: Date.now(),
        createdAt: existing.createdAt || Date.now()
      })
    },

    async logout() {
      await signOut(auth)
      this.user = null
    }
  }
})
