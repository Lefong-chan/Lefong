<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const tabs = [
  { label: 'Dashboard', to: { name: 'admin-dashboard' }, icon: '📊' },
  { label: 'Orders', to: { name: 'admin-orders' }, icon: '📦' },
  { label: 'Customers', to: { name: 'admin-users' }, icon: '👥' }
]

async function logout() {
  await authStore.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 lg:flex">
    <aside class="lg:w-56 bg-gray-900 text-gray-300 lg:min-h-screen">
      <div class="flex items-center gap-2 px-4 py-4 border-b border-gray-800">
        <div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-black text-white">S</div>
        <div>
          <p class="text-white font-bold text-sm leading-tight">Sinolog Admin</p>
          <p class="text-[11px] text-gray-500 leading-tight truncate">{{ authStore.user?.email }}</p>
        </div>
      </div>
      <nav class="flex lg:flex-col overflow-x-auto lg:overflow-visible">
        <router-link
          v-for="tab in tabs"
          :key="tab.label"
          :to="tab.to"
          class="flex items-center gap-2 px-4 py-3 text-sm shrink-0 hover:bg-gray-800"
          active-class="bg-gray-800 text-white"
        >
          <span>{{ tab.icon }}</span>{{ tab.label }}
        </router-link>
        <button @click="logout" class="flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-gray-800 lg:mt-auto">
          🚪 Log out
        </button>
      </nav>
    </aside>
    <main class="flex-1 min-w-0">
      <router-view />
    </main>
  </div>
</template>
