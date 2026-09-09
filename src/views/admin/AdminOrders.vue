<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ref as dbRef, onValue, off } from 'firebase/database'
import { db } from '../../firebase'
import { formatYuan } from '../../utils/currency'
import { statusMeta, STATUS_META } from '../../utils/orderStatus'
import { proxyImage } from '../../utils/image'

const orders = ref([])
const filter = ref('all')
let ordersRefHandle = null

onMounted(() => {
  ordersRefHandle = dbRef(db, 'orders')
  onValue(ordersRefHandle, (snap) => {
    orders.value = snap.exists() ? Object.values(snap.val()).sort((a, b) => b.createdAt - a.createdAt) : []
  })
})
onUnmounted(() => {
  if (ordersRefHandle) off(ordersRefHandle)
})

const filtered = computed(() => (filter.value === 'all' ? orders.value : orders.value.filter((o) => o.status === filter.value)))
</script>

<template>
  <div class="p-4 lg:p-6 max-w-6xl">
    <h1 class="text-xl font-bold text-gray-800 mb-4">All Orders</h1>

    <div class="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
      <button
        @click="filter = 'all'"
        class="shrink-0 text-xs px-3 py-1.5 rounded-full border"
        :class="filter === 'all' ? 'bg-brand text-white border-brand' : 'border-gray-300 text-gray-600'"
      >All ({{ orders.length }})</button>
      <button
        v-for="(meta, key) in STATUS_META"
        :key="key"
        @click="filter = key"
        class="shrink-0 text-xs px-3 py-1.5 rounded-full border"
        :class="filter === key ? 'bg-brand text-white border-brand' : 'border-gray-300 text-gray-600'"
      >{{ meta.label }} ({{ orders.filter((o) => o.status === key).length }})</button>
    </div>

    <div class="card divide-y divide-gray-50">
      <div v-if="!filtered.length" class="p-8 text-center text-gray-400 text-sm">No orders in this category</div>
      <router-link
        v-for="o in filtered"
        :key="o.id"
        :to="{ name: 'admin-order-detail', params: { orderId: o.id } }"
        class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
      >
        <img :src="proxyImage(o.items?.[0]?.image)" class="w-12 h-12 rounded object-cover bg-gray-100" />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-800 truncate">{{ o.userEmail }}</p>
          <p class="text-xs text-gray-400 truncate">Ref: {{ o.paymentReference }} · {{ o.paymentMethod }}</p>
          <p class="text-xs text-gray-400">{{ new Date(o.createdAt).toLocaleString('fr-FR') }}</p>
        </div>
        <span class="text-sm font-semibold text-gray-700 shrink-0">{{ formatYuan(o.totalYuan) }}</span>
        <span class="text-[11px] px-2 py-1 rounded-full shrink-0" :class="statusMeta(o.status).color">{{ statusMeta(o.status).label }}</span>
      </router-link>
    </div>
  </div>
</template>
