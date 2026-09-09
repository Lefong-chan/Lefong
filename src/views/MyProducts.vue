<script setup>
import { onMounted } from 'vue'
import { useFavoritesStore } from '../stores/favorites'
import ProductCard from '../components/ProductCard.vue'

const favoritesStore = useFavoritesStore()

onMounted(() => {
  if (!favoritesStore.loaded) favoritesStore.watch()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-2 py-3">
    <h1 class="text-lg font-bold text-gray-800 px-1 mb-2">My Products</h1>

    <div v-if="!favoritesStore.loaded" class="text-center text-gray-400 py-16">Loading...</div>

    <div v-else-if="!favoritesStore.list.length" class="text-center text-gray-400 py-20">
      <p class="text-4xl mb-2">❤️</p>
      <p>You haven't saved any products yet</p>
      <router-link to="/" class="btn-brand inline-block mt-4">Discover products</router-link>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 tv:grid-cols-6 gap-2">
      <ProductCard v-for="p in favoritesStore.list" :key="p.itemId" :product="p" />
    </div>
  </div>
</template>
