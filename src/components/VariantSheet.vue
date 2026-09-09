<script setup>
import { ref, computed, watch } from 'vue'
import { formatYuan } from '../utils/currency'
import { proxyImage } from '../utils/image'

const props = defineProps({
  open: { type: Boolean, default: false },
  product: { type: Object, required: true },
  mode: { type: String, default: 'cart' } // 'cart' | 'buy'
})

const emit = defineEmits(['close', 'confirm'])

const selected = ref({})
const quantity = ref(props.product.moq || 1)

watch(
  () => props.open,
  (val) => {
    if (val) {
      selected.value = {}
      for (const group of props.product.propGroups || []) {
        if (group.values?.length) selected.value[group.name] = group.values[0].name
      }
      quantity.value = props.product.moq || 1
    }
  }
)

const specsLabel = computed(() =>
  Object.entries(selected.value)
    .map(([k, v]) => v)
    .join(' / ')
)

const matchedSku = computed(() => {
  const skus = props.product.skus || []
  if (!skus.length) return null
  return (
    skus.find((sku) => {
      const specStr = typeof sku.specs === 'string' ? sku.specs : Object.values(sku.specs || {}).join(' ')
      return Object.values(selected.value).every((v) => specStr.includes(v))
    }) || null
  )
})

const unitPrice = computed(() => {
  if (matchedSku.value && matchedSku.value.price) return matchedSku.value.price
  const tiers = props.product.priceTiers || []
  if (tiers.length) {
    const applicable = [...tiers].reverse().find((t) => quantity.value >= t.minQty)
    if (applicable) return applicable.price
  }
  return props.product.price
})

const totalPrice = computed(() => (unitPrice.value || 0) * quantity.value)

function selectValue(groupName, valueName) {
  selected.value = { ...selected.value, [groupName]: valueName }
}

function inc() {
  quantity.value += 1
}
function dec() {
  quantity.value = Math.max(props.product.moq || 1, quantity.value - 1)
}

function confirm() {
  emit('confirm', {
    itemId: props.product.itemId,
    skuId: matchedSku.value?.skuId || 'default',
    title: props.product.title,
    image: matchedSku.value?.image || props.product.image,
    price: unitPrice.value,
    variantLabel: specsLabel.value,
    shopName: props.product.shopName,
    link: props.product.link,
    quantity: quantity.value
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-end tv:items-center tv:justify-center">
      <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
      <div class="relative bg-white w-full tv:w-[560px] tv:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto animate-[slideup_.2s_ease-out]">
        <button class="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500" @click="emit('close')">✕</button>

        <div class="p-4 flex gap-3 border-b border-gray-100">
          <img :src="proxyImage(matchedSku?.image || product.image)" class="w-20 h-20 rounded-lg object-cover bg-gray-100" />
          <div class="flex-1 min-w-0">
            <p class="text-brand font-bold text-xl">{{ formatYuan(unitPrice) }}</p>
            <p class="text-xs text-gray-400 mt-1">MOQ: {{ product.moq || 1 }}{{ product.unit || 'pcs' }}</p>
            <p v-if="specsLabel" class="text-xs text-gray-500 mt-1">Selected: {{ specsLabel }}</p>
          </div>
        </div>

        <div v-for="group in product.propGroups || []" :key="group.name" class="p-4 border-b border-gray-100">
          <p class="text-sm font-semibold text-gray-700 mb-2">{{ group.name }}</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="val in group.values"
              :key="val.name"
              @click="selectValue(group.name, val.name)"
              class="px-3 py-2 rounded-lg border text-sm flex items-center gap-2"
              :class="selected[group.name] === val.name ? 'border-brand text-brand bg-brand/5' : 'border-gray-200 text-gray-600'"
            >
              <img v-if="val.image" :src="proxyImage(val.image)" class="w-6 h-6 rounded object-cover" />
              {{ val.name }}
            </button>
          </div>
        </div>

        <div v-if="product.priceTiers?.length" class="p-4 border-b border-gray-100">
          <p class="text-sm font-semibold text-gray-700 mb-2">Price by quantity</p>
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div v-for="(tier, i) in product.priceTiers" :key="i" class="border border-gray-200 rounded-lg py-2">
              <p class="font-bold text-brand">{{ formatYuan(tier.price) }}</p>
              <p class="text-gray-400 mt-0.5">≥{{ tier.minQty }}{{ product.unit || 'pcs' }}</p>
            </div>
          </div>
        </div>

        <div class="p-4 flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700">Quantity</span>
          <div class="flex items-center gap-3">
            <button @click="dec" class="w-8 h-8 rounded-full bg-gray-100 text-lg flex items-center justify-center">−</button>
            <span class="w-10 text-center font-semibold">{{ quantity }}</span>
            <button @click="inc" class="w-8 h-8 rounded-full bg-gray-100 text-lg flex items-center justify-center">+</button>
          </div>
        </div>

        <div class="p-4 pt-0">
          <div class="flex items-center justify-between mb-3 text-sm">
            <span class="text-gray-500">Total</span>
            <span class="text-brand font-bold text-lg">{{ formatYuan(totalPrice) }}</span>
          </div>
          <button class="btn-brand w-full !py-3" @click="confirm">
            {{ mode === 'buy' ? "Order now" : "Add card" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
@keyframes slideup {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
