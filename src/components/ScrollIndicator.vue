<script setup>
import { onBeforeUnmount, onMounted, reactive } from 'vue'

const state = reactive({ top: 0, height: 40, visible: false, canScroll: false })
let hideTimer = null
let resizeObserver = null
let headerH = 0
let footerH = 0

function measure() {
  const viewportH = window.innerHeight
  const scrollHeight = document.documentElement.scrollHeight
  const maxScroll = scrollHeight - viewportH
  state.canScroll = maxScroll > 4
  if (!state.canScroll) return

  const gap = 8
  const trackTop = headerH + gap
  const trackHeight = Math.max(viewportH - headerH - footerH - gap * 2, 0)
  const thumbHeight = Math.min(trackHeight, Math.max(28, (viewportH / scrollHeight) * trackHeight))
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

function onFrameSizeChange(header, footer) {
  headerH = header?.offsetHeight ?? 0
  footerH = footer?.offsetHeight ?? 0
  measure()
}

let onWindowResize = null

onMounted(() => {
  const header = document.querySelector('.top-bar')
  const footer = document.querySelector('.bottom-nav')

  onFrameSizeChange(header, footer)
  onWindowResize = () => onFrameSizeChange(header, footer)

  resizeObserver = new ResizeObserver(onWindowResize)
  if (header) resizeObserver.observe(header)
  if (footer) resizeObserver.observe(footer)

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onWindowResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onWindowResize)
  resizeObserver?.disconnect()
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
  z-index: 15;
  pointer-events: none;
}

.scroll-indicator.visible {
  opacity: 1;
}
</style>
