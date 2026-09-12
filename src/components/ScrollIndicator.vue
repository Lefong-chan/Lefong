<script setup>
import { onBeforeUnmount, onMounted, reactive } from 'vue'

const state = reactive({ top: 0, height: 40, visible: false, canScroll: false })
let hideTimer = null

function measure() {
  const viewportH = window.innerHeight
  const scrollHeight = document.documentElement.scrollHeight
  const maxScroll = scrollHeight - viewportH
  state.canScroll = maxScroll > 4
  if (!state.canScroll) return

  const trackTop = 12
  const trackHeight = viewportH - trackTop * 2
  const thumbHeight = Math.max(36, (viewportH / scrollHeight) * trackHeight)
  const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1)

  state.height = thumbHeight
  state.top = trackTop + progress * (trackHeight - thumbHeight)
}

function onScroll() {
  measure()
  if (!state.canScroll) return
  state.visible = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    state.visible = false
  }, 2000)
}

onMounted(() => {
  measure()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', measure)
  clearTimeout(hideTimer)
})
</script>

<template>
  <div
    v-if="state.canScroll"
    class="scroll-indicator"
    :class="{ visible: state.visible }"
    :style="{ top: state.top + 'px', height: state.height + 'px' }"
  />
</template>

<style scoped>
.scroll-indicator {
  position: fixed;
  left: 50%;
  transform: translateX(calc(min(480px, 100vw) / 2 - 10px));
  width: 4px;
  border-radius: 10px;
  background: var(--primary-light);
  opacity: 0;
  transition: opacity 0.5s ease;
  z-index: 50;
  pointer-events: none;
}

.scroll-indicator.visible {
  opacity: 1;
}
</style>
