<script setup>
import { computed } from 'vue'
import { spawnRipple } from '../composables/useRipple'

const props = defineProps({
  modelValue: { type: String, required: true },
  tabs: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])

const activeIndex = computed(() => props.tabs.findIndex((t) => t.key === props.modelValue))

function select(key, event) {
  spawnRipple(event)
  if (navigator.vibrate) navigator.vibrate(8)
  emit('update:modelValue', key)
}
</script>

<template>
  <nav class="bottom-nav">
    <div
      class="indicator"
      :style="{ transform: `translateX(${activeIndex * 100}%)` }"
    />
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="nav-item pressable ripple-wrap"
      :class="{ active: tab.key === modelValue }"
      type="button"
      @click="select(tab.key, $event)"
    >
      <span class="nav-icon">{{ tab.icon }}</span>
      <span class="nav-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: relative;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 10px 10px calc(10px + env(safe-area-inset-bottom, 0px));
  background: var(--surface);
  border-top-left-radius: 26px;
  border-top-right-radius: 26px;
  box-shadow: 0 -6px 24px rgba(91, 42, 157, 0.16);
  z-index: 20;
}

.indicator {
  position: absolute;
  top: 8px;
  left: 10px;
  width: calc((100% - 20px) / 4);
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(145deg, var(--primary-light), var(--primary));
  box-shadow: 0 6px 14px rgba(91, 42, 157, 0.35);
  transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 0;
}

.nav-item {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 2px;
  border: none;
  background: transparent;
  border-radius: 18px;
  cursor: pointer;
  color: var(--text-soft);
}

.nav-icon {
  font-size: 1.35rem;
  line-height: 1;
  transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-label {
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  transition: color 0.2s ease;
}

.nav-item.active {
  color: var(--text-on-primary);
}

.nav-item.active .nav-icon {
  transform: translateY(-1px) scale(1.12);
}
</style>
