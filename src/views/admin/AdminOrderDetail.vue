<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ref as dbRef, onValue, off } from 'firebase/database'
import { db, auth } from '../../firebase'
import { statusMeta, STATUS_META } from '../../utils/orderStatus'
import { formatYuan, formatMga } from '../../utils/currency'
import { updateOrderStatus } from '../../utils/api'
import { proxyImage } from '../../utils/image'

const props = defineProps({ orderId: { type: String, required: true } })
const order = ref(null)
const loaded = ref(false)
const note = ref('')
const saving = ref(false)
const error = ref('')
let orderRefHandle = null

onMounted(() => {
  orderRefHandle = dbRef(db, `orders/${props.orderId}`)
  onValue(orderRefHandle, (snap) => {
    order.value = snap.exists() ? snap.val() : null
    if (order.value) note.value = order.value.adminNote || ''
    loaded.value = true
  })
})
onUnmounted(() => {
  if (orderRefHandle) off(orderRefHandle)
})

async function setStatus(status) {
  error.value = ''
  saving.value = true
  try {
    const idToken = await auth.currentUser.getIdToken()
    await updateOrderStatus(idToken, { orderId: props.orderId, status, adminNote: note.value })
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-4 lg:p-6 max-w-2xl">
    <router-link :to="{ name: 'admin-orders' }" class="text-sm text-gray-400 mb-3 inline-block">‹ Back</router-link>

    <div v-if="!loaded" class="text-center text-gray-400 py-16">Loading...</div>
    <div v-else-if="!order" class="text-center text-gray-400 py-16">Order not found</div>

    <div v-else class="space-y-3">
      <div class="card p-4">
        <div class="flex items-center justify-between mb-2">
          <p class="font-bold text-gray-800">Order #{{ order.id.slice(-6).toUpperCase() }}</p>
          <span class="text-xs px-2.5 py-1 rounded-full" :class="statusMeta(order.status).color">{{ statusMeta(order.status).label }}</span>
        </div>
        <p class="text-sm text-gray-600">👤 {{ order.userName || order.userEmail }} ({{ order.userEmail }})</p>
        <p class="text-xs text-gray-400 mt-1">{{ new Date(order.createdAt).toLocaleString('fr-FR') }}</p>
      </div>

      <div class="card p-4 bg-amber-50 border border-amber-100">
        <p class="text-sm font-semibold text-amber-800 mb-2">💳 Payment Details</p>
        <div class="text-sm text-amber-900 space-y-1">
          <p>Method: <span class="font-semibold capitalize">{{ order.paymentMethod }}</span> ({{ order.paymentPhoneTo }})</p>
          <p>Customer's sending number: <span class="font-semibold">{{ order.senderPhone }}</span></p>
          <p>Reference: <span class="font-semibold">{{ order.paymentReference }}</span></p>
          <p v-if="order.deliveryAddress">Address: <span class="font-semibold">{{ order.deliveryAddress }}</span></p>
        </div>
      </div>

      <div class="card p-4">
        <p class="text-sm font-semibold text-gray-700 mb-2">Products</p>
        <div v-for="(line, i) in order.items" :key="i" class="flex gap-3 py-2 border-b last:border-0 border-gray-100">
          <img :src="proxyImage(line.image)" class="w-14 h-14 rounded-lg object-cover bg-gray-100" />
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-800 line-clamp-2">{{ line.title }}</p>
            <p v-if="line.variantLabel" class="text-xs text-gray-400">{{ line.variantLabel }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ formatYuan(line.price) }} × {{ line.quantity }}</p>
            <a v-if="line.link" :href="line.link" target="_blank" rel="noopener" class="text-[11px] text-brand">🔗 View source</a>
          </div>
        </div>
        <div class="flex justify-between font-bold pt-2">
          <span class="text-sm">Total</span>
          <div class="text-right">
            <p class="text-brand">{{ formatYuan(order.totalYuan) }}</p>
            <p class="text-xs text-gray-400 font-normal">{{ formatMga(order.totalYuan) }}</p>
          </div>
        </div>
      </div>

      <div class="card p-4">
        <p class="text-sm font-semibold text-gray-700 mb-2">Update status</p>
        <textarea v-model="note" rows="2" placeholder="Note for the customer (optional)" class="input-field resize-none mb-3" />
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="(meta, key) in STATUS_META"
            :key="key"
            :disabled="saving || order.status === key"
            @click="setStatus(key)"
            class="text-xs py-2 rounded-lg border font-medium disabled:opacity-40"
            :class="order.status === key ? 'border-brand text-brand bg-brand/5' : 'border-gray-200 text-gray-600'"
          >
            {{ meta.label }}
          </button>
        </div>
        <p v-if="error" class="text-xs text-red-500 mt-2">{{ error }}</p>
      </div>
    </div>
  </div>
</template>
