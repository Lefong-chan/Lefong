<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Banner from '../components/Banner.vue'
import QuickLinks from '../components/QuickLinks.vue'
import ProductCard from '../components/ProductCard.vue'
import { getTrendingProducts, getCategories } from '../utils/api'
import { getRecentSearches } from '../utils/recentSearches'

const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const products = ref([])
const sentinel = ref(null)
let observer = null
let keywordCursor = 0

// Real categories from CJ Dropshipping's /product/getCategory when that
// loads something usable; otherwise this reliable fixed list keeps the
// filter row from ever showing empty (translated from the original
// Chinese quick-search keywords).
const FALLBACK_CHIPS = [
  { type: 'keyword', value: 'phone case', label: 'Phone Case' },
  { type: 'keyword', value: 'keychain', label: 'Keychain' },
  { type: 'keyword', value: 'usb cable', label: 'USB Cable' },
  { type: 'keyword', value: 'memory card', label: 'Memory Card' },
  { type: 'keyword', value: 'bluetooth earphone', label: 'Bluetooth Earphone' },
  { type: 'keyword', value: 'power bank', label: 'Power Bank' }
]
const chips = ref(FALLBACK_CHIPS)
const activeChip = ref(null) // null = "All"

// Leans the trending grid toward the buyer's own last few searches once
// they have any, but not exclusively - every third batch falls back to
// the server's own generic default keyword so the grid isn't 100% just
// their history. Only applies when browsing "All" (no chip picked).
function nextKeyword() {
  const recent = getRecentSearches()
  if (!recent.length) return undefined
  keywordCursor++
  if (keywordCursor % 3 === 0) return undefined
  return recent[keywordCursor % recent.length]
}

async function loadBatch(isInitial) {
  if (isInitial) {
    loading.value = true
    error.value = ''
  } else {
    if (loading.value || loadingMore.value) return
    loadingMore.value = true
  }
  try {
    const data = !activeChip.value
      ? await getTrendingProducts({ keyword: nextKeyword() })
      : activeChip.value.type === 'category'
        ? await getTrendingProducts({ categoryId: activeChip.value.value })
        : await getTrendingProducts({ keyword: activeChip.value.value })
    products.value = isInitial ? data.items : [...products.value, ...data.items]
  } catch (e) {
    if (isInitial) error.value = e.message
    // A failed "load more" attempt just stays quiet - the grid already has content,
    // and the next scroll trigger will simply try again.
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function selectChip(chip) {
  const nextValue = chip ? chip.value : null
  if ((activeChip.value?.value ?? null) === nextValue) return
  activeChip.value = chip
  products.value = []
  loadBatch(true)
}

async function loadCategories() {
  try {
    const data = await getCategories()
    if (data.categories?.length) {
      chips.value = data.categories.map((c) => ({ type: 'category', value: c.id, label: c.name }))
    }
  } catch {
    // Keep the reliable fallback chips - a failure here shouldn't leave the filter row empty.
  }
}

onMounted(() => {
  loadBatch(true)
  loadCategories()
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadBatch(false)
    },
    { rootMargin: '400px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <Banner />
    <QuickLinks />

    <div class="bg-orange-50 mx-2 mt-2 rounded-lg px-3 py-2.5 flex items-center justify-between text-xs text-brand-dark">
      <span class="flex items-center gap-1.5 font-medium">🛡️ Sinolog Guarantee — thousands of companies, worldwide</span>
      <span>›</span>
    </div>

    <div class="flex gap-2 px-2 pt-3 overflow-x-auto no-scrollbar">
      <button
        @click="selectChip(null)"
        class="shrink-0 text-xs rounded-full px-3 py-1.5 border"
        :class="!activeChip ? 'bg-brand text-white border-brand' : 'bg-white border-gray-200 text-gray-600'"
      >
        All
      </button>
      <button
        v-for="c in chips"
        :key="c.value"
        @click="selectChip(c)"
        class="shrink-0 text-xs rounded-full px-3 py-1.5 border"
        :class="activeChip?.value === c.value ? 'bg-brand text-white border-brand' : 'bg-white border-gray-200 text-gray-600'"
      >
        {{ c.label }}
      </button>
    </div>

    <section class="px-2 pt-3 pb-6">
      <h2 class="text-base font-bold text-gray-800 mb-2 px-1">Trending now</h2>

      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 tv:grid-cols-6 gap-2">
        <div v-for="i in 8" :key="i" class="card aspect-[3/4] animate-pulse bg-gray-100" />
      </div>

      <div v-else-if="error" class="text-center text-sm text-gray-500 py-10">
        <p>{{ error }}</p>
        <p class="text-xs mt-1 text-gray-400">Check that CJ_API_KEY, CJ_API_EMAIL and CJ_API_BASE_URL are configured on Vercel.</p>
      </div>

      <div v-else-if="!products.length" class="text-center text-sm text-gray-400 py-10">
        <p>No products found right now.</p>
        <p class="text-xs mt-1">Try another category above, or try again in a moment.</p>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 tv:grid-cols-6 gap-2">
        <ProductCard v-for="p in products" :key="p.itemId" :product="p" />
      </div>

      <div ref="sentinel" class="h-1" />
      <div v-if="loadingMore" class="flex flex-col items-center py-3 gap-1.5 text-gray-400 text-sm">
        <div class="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    </section>
  </div>
</template>
