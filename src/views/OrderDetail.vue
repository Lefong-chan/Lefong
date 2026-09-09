<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ref as dbRef, onValue, off } from 'firebase/database'
import { db } from '../firebase'
import { statusMeta } from '../utils/orderStatus'
import { formatYuan, formatMga } from '../utils/currency'
import { proxyImage } from '../utils/image'

const props = defineProps({ orderId: { type: String, required: true } })
const order = ref(null)
const loaded = ref(false)
let orderRefHandle = null

onMounted(() => {
  orderRefHandle = dbRef(db, `orders/${props.orderId}`)
  onValue(orderRefHandle, (snap) => {
    order.value = snap.exists() ? snap.val() : null
    loaded.value = true
  })
})

onUnmounted(() => {
  if (orderRefHandle) off(orderRefHandle)
})

const STEPS = ['pending', 'confirmed', 'purchasing', 'shipped', 'completed']
</script>

<template>
  <div class="max-w-2xl mx-auto px-3 py-4">
    <div v-if="!loaded" class="text-center text-gray-400 py-16">Loading...</div>
    <div v-else-if="!order" class="text-center text-gray-400 py-16">Order not found</div>

    <div v-else class="space-y-3">
      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <p class="font-bold text-gray-800">Order #{{ order.id.slice(-6).toUpperCase() }}</p>
          <span class="text-xs px-2.5 py-1 rounded-full" :class="statusMeta(order.status).color">{{ statusMeta(order.status).label }}</span>
        </div>

        <div v-if="order.status !== 'rejected'" class="flex items-center justify-between mb-2">
          <template v-for="(step, i) in STEPS" :key="step">
            <div class="flex flex-col items-center flex-1">
              <div
                class="w-3 h-3 rounded-full"
                :class="STEPS.indexOf(order.status) >= i ? 'bg-brand' : 'bg-gray-200'"
              />
              <span class="text-[9px] text-gray-400 mt-1 text-center">{{ statusMeta(step).label }}</span>
            </div>
            <div v-if="i < STEPS.length - 1" class="h-0.5 flex-1 -mt-4" :class="STEPS.indexOf(order.status) > i ? 'bg-brand' : 'bg-gray-200'" />
          </template>
        </div>

        <p v-if="order.adminNote" class="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">📝 {{ order.adminNote }}</p>
      </div>

      <div class="card p-4">
        <p class="text-sm font-semibold text-gray-700 mb-2">Products</p>
        <div v-for="(line, i) in order.items" :key="i" class="flex gap-3 py-2 border-b last:border-0 border-gray-100">
          <img :src="proxyImage(line.image)" class="w-14 h-14 rounded-lg object-cover bg-gray-100" />
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-800 line-clamp-2">{{ line.title }}</p>
            <p v-if="line.variantLabel" class="text-xs text-gray-400">{{ line.variantLabel }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ formatYuan(line.price) }} × {{ line.quantity }}</p>
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
        <p class="text-sm font-semibold text-gray-700 mb-2">Payment</p>
        <div class="text-sm text-gray-600 space-y-1">
          <p>Method: <span class="font-medium capitalize">{{ order.paymentMethod }}</span></p>
          <p>Sending number: <span class="font-medium">{{ order.senderPhone }}</span></p>
          <p>Reference: <span class="font-medium">{{ order.paymentReference }}</span></p>
          <p v-if="order.deliveryAddress">Address: <span class="font-medium">{{ order.deliveryAddress }}</span></p>
        </div>
      </div>
    </div>
  </div>
</template>
