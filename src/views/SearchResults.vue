<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import { searchProducts } from '../utils/api'

const route = useRoute()
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const items = ref([])
const total = ref(0)
const page = ref(1)
const noMore = ref(false)
const sentinel = ref(null)
let observer = null

async function load() {
  const keyword = (route.query.q || '').toString()
  page.value = 1
  noMore.value = false
  if (!keyword) {
    items.value = []
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data = await searchProducts(keyword, 1)
    items.value = data.items
    total.value = data.total
    if (!data.items.length) noMore.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  const keyword = (route.query.q || '').toString()
  if (!keyword || loading.value || loadingMore.value || noMore.value) return
  loadingMore.value = true
  try {
    const data = await searchProducts(keyword, page.value + 1)
    if (!data.items.length) {
      noMore.value = true
    } else {
      page.value += 1
      items.value = [...items.value, ...data.items]
    }
  } catch {
    // A failed "load more" attempt just stays quiet - existing results remain.
  } finally {
    loadingMore.value = false
  }
}

watch(() => route.query.q, load)
onMounted(() => {
  load()
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMore()
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
  <div class="max-w-7xl mx-auto px-2 py-3">
    <p class="text-sm text-gray-500 mb-2">
      Results for "<span class="font-semibold text-gray-700">{{ route.query.q }}</span>"
      <span v-if="total">— {{ total }} products</span>
    </p>

    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 tv:grid-cols-6 gap-2">
      <div v-for="i in 10" :key="i" class="card aspect-[3/4] animate-pulse bg-gray-100" />
    </div>

    <div v-else-if="error" class="text-center text-sm text-gray-500 py-16">
      <p>{{ error }}</p>
      <button class="btn-brand mt-4" @click="load">Try again</button>
    </div>

    <div v-else-if="!items.length" class="text-center text-sm text-gray-400 py-16">
      No products found. Try another keyword.
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 tv:grid-cols-6 gap-2">
      <ProductCard v-for="p in items" :key="p.itemId" :product="p" />
    </div>

    <div ref="sentinel" class="h-1" />
    <div v-if="loadingMore" class="flex flex-col items-center py-3 gap-1.5 text-gray-400 text-sm">
      <div class="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
</template>
