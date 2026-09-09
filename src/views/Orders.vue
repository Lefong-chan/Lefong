<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ref as dbRef, onValue, off } from 'firebase/database'
import { db } from '../firebase'
import { useAuthStore } from '../stores/auth'
import { statusMeta } from '../utils/orderStatus'
import { formatYuan } from '../utils/currency'
import { proxyImage } from '../utils/image'

const authStore = useAuthStore()
const orderIds = ref([])
const ordersById = reactive({})
const loaded = ref(false)

let indexRef = null
const orderListeners = {}

function watchOrder(orderId) {
  if (orderListeners[orderId]) return
  const oRef = dbRef(db, `orders/${orderId}`)
  orderListeners[orderId] = oRef
  onValue(oRef, (snap) => {
    if (snap.exists()) ordersById[orderId] = snap.val()
  })
}

onMounted(() => {
  if (!authStore.user) return
  indexRef = dbRef(db, `userOrders/${authStore.user.uid}`)
  onValue(indexRef, (snap) => {
    const ids = snap.exists() ? Object.keys(snap.val()) : []
    orderIds.value = ids
    ids.forEach(watchOrder)
    loaded.value = true
  })
})

onUnmounted(() => {
  if (indexRef) off(indexRef)
  Object.values(orderListeners).forEach((r) => off(r))
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-2 py-3">
    <h1 class="text-lg font-bold text-gray-800 px-1 mb-2">My Orders</h1>

    <div v-if="!loaded" class="text-center text-gray-400 py-16">Loading...</div>

    <div v-else-if="!orderIds.length" class="text-center text-gray-400 py-20">
      <p class="text-4xl mb-2">📦</p>
      <p>You haven't placed an order yet</p>
      <router-link to="/" class="btn-brand inline-block mt-4">Find products</router-link>
    </div>

    <div v-else class="space-y-2">
      <router-link
        v-for="o in Object.values(ordersById).sort((a, b) => b.createdAt - a.createdAt)"
        :key="o.id"
        :to="{ name: 'order-detail', params: { orderId: o.id } }"
        class="card p-3 flex items-center gap-3"
      >
        <img :src="proxyImage(o.items?.[0]?.image)" class="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-800 line-clamp-1">{{ o.items?.[0]?.title }}<span v-if="o.items?.length > 1"> +{{ o.items.length - 1 }} more</span></p>
          <p class="text-xs text-gray-400 mt-1">{{ new Date(o.createdAt).toLocaleDateString('fr-FR') }}</p>
          <p class="text-brand font-bold text-sm mt-1">{{ formatYuan(o.totalYuan) }}</p>
        </div>
        <span class="text-[11px] px-2 py-1 rounded-full shrink-0" :class="statusMeta(o.status).color">{{ statusMeta(o.status).label }}</span>
      </router-link>
    </div>
  </div>
</template>
