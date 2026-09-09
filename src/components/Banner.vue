<script setup>
const slides = [
  { title: 'Black Friday Hot Sales', subtitle: 'Store-wise 200-10', bg: 'from-[#2b0000] via-[#3d0d0d] to-[#5c1010]' },
  { title: 'Shop Directly from China', subtitle: 'We handle the buying and the shipping', bg: 'from-brand-dark via-brand to-brand-light' },
  { title: 'Free Cross-Border Shipping', subtitle: 'On your first order', bg: 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]' }
]
</script>

<template>
  <div class="relative w-full overflow-x-auto no-scrollbar snap-x snap-mandatory flex">
    <div
      v-for="(slide, i) in slides"
      :key="i"
      class="snap-start shrink-0 w-full min-w-full h-40 sm:h-52 lg:h-64 tv:h-80 bg-gradient-to-br flex flex-col justify-center px-6 sm:px-12"
      :class="slide.bg"
    >
      <h2 class="text-white text-xl sm:text-3xl tv:text-4xl font-extrabold max-w-md">{{ slide.title }}</h2>
      <p class="text-white/80 mt-2 text-sm sm:text-base tv:text-xl max-w-sm">{{ slide.subtitle }}</p>
    </div>
  </div>
</template>
