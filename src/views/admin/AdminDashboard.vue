<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ref as dbRef, onValue, off } from 'firebase/database'
import { db } from '../../firebase'
import { formatYuan } from '../../utils/currency'
import { statusMeta } from '../../utils/orderStatus'
import { proxyImage } from '../../utils/image'

const orders = ref([])
let ordersRefHandle = null

onMounted(() => {
  ordersRefHandle = dbRef(db, 'orders')
  onValue(ordersRefHandle, (snap) => {
    orders.value = snap.exists() ? Object.values(snap.val()) : []
  })
})
onUnmounted(() => {
  if (ordersRefHandle) off(ordersRefHandle)
})

const pendingCount = computed(() => orders.value.filter((o) => o.status === 'pending').length)
const completedCount = computed(() => orders.value.filter((o) => o.status === 'completed').length)
const totalRevenue = computed(() => orders.value.filter((o) => o.status !== 'rejected').reduce((sum, o) => sum + (o.totalYuan || 0), 0))
const recentOrders = computed(() => [...orders.value].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8))
</script>

<template>
  <div class="p-4 lg:p-6 max-w-6xl">
    <h1 class="text-xl font-bold text-gray-800 mb-4">Dashboard</h1>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div class="card p-4">
        <p class="text-xs text-gray-400">Total orders</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ orders.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-400">Pending</p>
        <p class="text-2xl font-bold text-amber-500 mt-1">{{ pendingCount }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-400">Completed</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ completedCount }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-400">Chiffre d'affaires</p>
        <p class="text-2xl font-bold text-brand mt-1">{{ formatYuan(totalRevenue) }}</p>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between p-4 border-b border-gray-100">
        <p class="font-semibold text-gray-700">Recent orders</p>
        <router-link :to="{ name: 'admin-orders' }" class="text-brand text-xs font-medium">See all ›</router-link>
      </div>
      <div v-if="!recentOrders.length" class="p-8 text-center text-gray-400 text-sm">No orders yet</div>
      <router-link
        v-for="o in recentOrders"
        :key="o.id"
        :to="{ name: 'admin-order-detail', params: { orderId: o.id } }"
        class="flex items-center gap-3 px-4 py-3 border-b last:border-0 border-gray-50 hover:bg-gray-50"
      >
        <img :src="proxyImage(o.items?.[0]?.image)" class="w-10 h-10 rounded object-cover bg-gray-100" />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-800 truncate">{{ o.userEmail }}</p>
          <p class="text-xs text-gray-400">{{ new Date(o.createdAt).toLocaleString('fr-FR') }}</p>
        </div>
        <span class="text-sm font-semibold text-gray-700">{{ formatYuan(o.totalYuan) }}</span>
        <span class="text-[11px] px-2 py-1 rounded-full" :class="statusMeta(o.status).color">{{ statusMeta(o.status).label }}</span>
      </router-link>
    </div>
  </div>
</template>
