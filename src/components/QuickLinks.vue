<script setup>
const links = [
  { label: 'Factory', icon: '🏭', color: 'bg-indigo-100 text-indigo-600' },
  { label: 'Search by\nPhoto', icon: '📷', color: 'bg-orange-100 text-orange-600' },
  { label: 'Payment\nService', icon: '💳', color: 'bg-amber-100 text-amber-600' },
  { label: 'Overseas\nShip', icon: '✈️', color: 'bg-sky-100 text-sky-600' },
  { label: 'Global\nGoods', icon: '🌐', color: 'bg-blue-100 text-blue-600' },
  { label: 'Trending', icon: '🔥', color: 'bg-rose-100 text-rose-600' }
]
</script>

<template>
  <div class="bg-white grid grid-cols-6 sm:grid-cols-6 gap-2 px-2 py-4">
    <div v-for="link in links" :key="link.label" class="flex flex-col items-center gap-1.5">
      <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl" :class="link.color">
        {{ link.icon }}
      </div>
      <span class="text-[10px] sm:text-[11px] text-gray-600 text-center leading-tight whitespace-pre-line">{{ link.label }}</span>
    </div>
  </div>
</template>
