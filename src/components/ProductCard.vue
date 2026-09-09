<script setup>
import { computed } from 'vue'
import { formatYuan, formatUsd } from '../utils/currency'
import { proxyImage } from '../utils/image'

const props = defineProps({
  product: { type: Object, required: true }
})

const fallbackImg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23eee"/%3E%3C/svg%3E'

const soldLabel = computed(() => {
  const s = props.product.sales
  if (!s) return null
  if (s >= 10000) return `${(s / 10000).toFixed(1)}w+ sold`
  if (s >= 1000) return `${(s / 1000).toFixed(1)}k+ sold`
  return `${s}+ sold`
})
</script>

<template>
  <router-link
    :to="{ name: 'product', params: { itemId: product.itemId } }"
    class="card overflow-hidden flex flex-col hover:shadow-md transition"
  >
    <div class="aspect-square bg-gray-100 overflow-hidden">
      <img
        :src="proxyImage(product.image) || fallbackImg"
        :alt="product.title"
        loading="lazy"
        class="w-full h-full object-cover"
        @error="$event.target.src = fallbackImg"
      />
    </div>
    <div class="p-2 flex flex-col gap-1 flex-1">
      <p class="text-xs text-gray-800 line-clamp-2 leading-snug min-h-[2.2rem]">{{ product.title }}</p>
      <div class="flex items-baseline gap-1.5">
        <span class="text-brand font-bold text-base">{{ formatYuan(product.price) }}</span>
        <span v-if="product.priceMax && product.priceMax !== product.price" class="text-gray-400 text-xs">~{{ formatYuan(product.priceMax) }}</span>
        <span class="text-[11px] text-gray-400">{{ formatUsd(product.price) }}</span>
      </div>
      <div class="flex items-center justify-between mt-auto pt-1 text-[11px] text-gray-400">
        <span class="flex items-center gap-0.5" v-if="product.rating">
          <svg class="w-3 h-3 text-brand fill-brand" viewBox="0 0 20 20"><path d="M10 1l2.6 5.9L19 7.6l-4.5 4.2L15.8 19 10 15.6 4.2 19l1.3-7.2L1 7.6l6.4-.7z"/></svg>
          {{ product.rating }}
        </span>
        <span v-if="soldLabel">{{ soldLabel }}</span>
      </div>
      <p v-if="product.shopName" class="text-[11px] text-gray-400 truncate">{{ product.shopName }}</p>
    </div>
  </router-link>
</template>
