<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

function afterLogin() {
  if (authStore.isAdmin) {
    router.replace({ name: 'admin-dashboard' })
  } else {
    router.replace(route.query.redirect ? String(route.query.redirect) : { name: 'home' })
  }
}

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login({ email: email.value.trim(), password: password.value })
    afterLogin()
  } catch (e) {
    error.value = friendlyError(e)
  } finally {
    loading.value = false
  }
}

async function withGoogle() {
  error.value = ''
  loading.value = true
  try {
    await authStore.loginWithGoogle()
    afterLogin()
  } catch (e) {
    error.value = friendlyError(e)
  } finally {
    loading.value = false
  }
}

function friendlyError(e) {
  const code = e.code || ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Incorrect email or password'
  }
  if (code.includes('too-many-requests')) return 'Please try again in a moment'
  return e.message || 'Something went wrong'
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-light/20 to-white px-4">
    <div class="w-full max-w-sm">
      <div class="flex flex-col items-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center font-black text-2xl">S</div>
        <h1 class="text-xl font-bold text-gray-800 mt-3">Welcome to Sinolog</h1>
        <p class="text-xs text-gray-400 mt-1">Shop products from China, easily and securely</p>
      </div>

      <form @submit.prevent="submit" class="space-y-3">
        <input v-model="email" type="email" required placeholder="Email" class="input-field" />
        <input v-model="password" type="password" required placeholder="Mot de passe" class="input-field" />
        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
        <button type="submit" class="btn-brand w-full !py-3" :disabled="loading">{{ loading ? '...' : 'Log in' }}</button>
      </form>

      <div class="flex items-center gap-3 my-5 text-xs text-gray-400">
        <div class="flex-1 h-px bg-gray-200" /> or <div class="flex-1 h-px bg-gray-200" />
      </div>

      <button @click="withGoogle" :disabled="loading" class="w-full border border-gray-300 rounded-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
        <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>

      <p class="text-center text-sm text-gray-500 mt-6">
        Don't have an account? <router-link to="/register" class="text-brand font-semibold">Sign up</router-link>
      </p>
    </div>
  </div>
</template>
