<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { addRecentSearch } from '../utils/recentSearches'

const router = useRouter()
const route = useRoute()
const keyword = ref(route.query.q || '')
const fileInput = ref(null)
const toast = ref('')

function submitSearch() {
  const q = keyword.value.trim()
  if (!q) return
  addRecentSearch(q)
  router.push({ name: 'search', query: { q } })
}

function openImagePicker() {
  fileInput.value?.click()
}

function onImagePicked(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  // No visual product matching is wired up yet - this just confirms the
  // photo was captured instead of silently doing nothing.
  toast.value = 'Photo received - image search coming soon'
  setTimeout(() => (toast.value = ''), 2500)
}
</script>

<template>
  <header class="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
    <div class="max-w-7xl mx-auto px-3 py-1.5 flex items-center gap-3">
      <router-link to="/" class="shrink-0 flex items-center gap-1.5">
        <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-brand text-lg">S</div>
        <span class="hidden sm:block text-gray-800 font-bold text-lg tracking-tight">Sinolog</span>
      </router-link>

      <form @submit.prevent="submitSearch" class="flex-1 flex items-center bg-gray-100 rounded-full overflow-hidden pl-3.5 pr-1 py-1 gap-1">
        <input
          v-model="keyword"
          type="search"
          placeholder="Search for the product you want..."
          class="flex-1 min-w-0 text-sm outline-none bg-transparent"
        />
        <button type="button" @click="openImagePicker" class="text-gray-400 p-1 shrink-0" aria-label="Search by photo">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 17a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
        </button>
        <input ref="fileInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onImagePicked" />
        <button type="submit" class="btn-brand !p-2 shrink-0" aria-label="Search">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </button>
      </form>
    </div>

    <div v-if="toast" class="fixed top-16 inset-x-0 flex justify-center z-50">
      <div class="bg-black/80 text-white text-sm px-4 py-2 rounded-full">{{ toast }}</div>
    </div>
  </header>
</template>
