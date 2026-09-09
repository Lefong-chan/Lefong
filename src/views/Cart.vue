<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore, lineKey } from '../stores/cart'
import { formatYuan, formatMga } from '../utils/currency'
import { proxyImage } from '../utils/image'

const cartStore = useCartStore()
const router = useRouter()

const lines = computed(() =>
  cartStore.lines.map((l) => ({ ...l, key: lineKey(l.itemId, l.skuId) }))
)

function checkout() {
  if (!cartStore.lines.length) return
  router.push({ name: 'checkout' })
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-2 py-3 pb-28">
    <h1 class="text-lg font-bold text-gray-800 px-1 mb-2">Cart ({{ cartStore.count }})</h1>

    <div v-if="!cartStore.loaded" class="text-center text-gray-400 py-16">Loading...</div>

    <div v-else-if="!lines.length" class="text-center text-gray-400 py-20">
      <p class="text-4xl mb-2">🛒</p>
      <p>Your cart is empty</p>
      <router-link to="/" class="btn-brand inline-block mt-4">Find products</router-link>
    </div>

    <div v-else class="space-y-2">
      <div v-for="line in lines" :key="line.key" class="card p-3 flex gap-3">
        <img :src="proxyImage(line.image)" class="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0" />
        <div class="flex-1 min-w-0 flex flex-col">
          <p class="text-sm text-gray-800 line-clamp-2">{{ line.title }}</p>
          <p v-if="line.variantLabel" class="text-xs text-gray-400 mt-0.5">{{ line.variantLabel }}</p>
          <div class="flex items-end justify-between mt-auto pt-2">
            <div>
              <span class="text-brand font-bold">{{ formatYuan(line.price) }}</span>
              <p class="text-[11px] text-gray-400">{{ formatMga(line.price) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center" @click="cartStore.updateQuantity(line.key, line.quantity - 1)">−</button>
              <span class="w-8 text-center text-sm">{{ line.quantity }}</span>
              <button class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center" @click="cartStore.updateQuantity(line.key, line.quantity + 1)">+</button>
            </div>
          </div>
        </div>
        <button class="text-gray-300 text-lg self-start" @click="cartStore.removeItem(line.key)">✕</button>
      </div>
    </div>

    <div v-if="lines.length" class="fixed bottom-16 tv:bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 max-w-3xl mx-auto flex items-center justify-between">
      <div>
        <p class="text-xs text-gray-400">Total</p>
        <p class="text-brand font-bold text-lg">{{ formatYuan(cartStore.totalYuan) }}</p>
      </div>
      <button class="btn-brand !px-8 !py-3" @click="checkout">Order ({{ cartStore.count }})</button>
    </div>
  </div>
</template>
