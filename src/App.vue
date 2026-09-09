<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'
import { useFavoritesStore } from './stores/favorites'
import AppHeader from './components/AppHeader.vue'
import BottomNav from './components/BottomNav.vue'

const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()

watch(
  () => authStore.user,
  (user) => {
    if (user) {
      cartStore.watch()
      favoritesStore.watch()
    } else {
      cartStore.stop()
      favoritesStore.stop()
    }
  },
  { immediate: true }
)

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
// The product page has its own overlaid back/cart/share bar and bottom
// action bar (see ProductDetail.vue), so the default header/bottom nav
// would just duplicate/clash with those.
const hasOwnChrome = computed(() => ['login', 'register', 'product'].includes(route.name))
const showChrome = computed(() => !isAdminRoute.value && !hasOwnChrome.value)
</script>

<template>
  <div class="min-h-screen bg-surface text-gray-900 font-sans flex flex-col">
    <AppHeader v-if="showChrome" />
    <main class="flex-1 w-full" :class="showChrome ? 'pb-16 tv:pb-0' : ''">
      <router-view />
    </main>
    <BottomNav v-if="showChrome" />
  </div>
</template>
