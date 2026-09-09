<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function logout() {
  await authStore.logout()
  router.replace({ name: 'home' })
}

const menu = [
  { label: 'My Orders', icon: '📦', to: { name: 'orders' } },
  { label: 'My Products', icon: '❤️', to: { name: 'favorites' } },
  { label: 'Cart', icon: '🛒', to: { name: 'cart' } }
]
</script>

<template>
  <div class="max-w-2xl mx-auto px-3 py-4">
    <div class="card p-5 flex items-center gap-4">
      <div class="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center text-2xl font-bold">
        {{ (authStore.user?.displayName || authStore.user?.email || '?')[0].toUpperCase() }}
      </div>
      <div class="min-w-0">
        <p class="font-bold text-gray-800 truncate">{{ authStore.user?.displayName || 'Customer' }}</p>
        <p class="text-sm text-gray-400 truncate">{{ authStore.user?.email }}</p>
      </div>
    </div>

    <div class="card mt-3 divide-y divide-gray-100">
      <router-link v-for="item in menu" :key="item.label" :to="item.to" class="flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700">
        <span class="text-lg">{{ item.icon }}</span>
        <span class="flex-1">{{ item.label }}</span>
        <span class="text-gray-300">›</span>
      </router-link>
    </div>

    <button @click="logout" class="w-full mt-4 btn-outline !text-red-500 !border-red-200 !py-3">Log out</button>
  </div>
</template>
