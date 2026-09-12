<script setup>
import { fitenenana } from '../data/expressions'
import { spawnRipple } from '../composables/useRipple'
</script>

<template>
  <div class="page">
    <p class="intro">Fitenenana mahazatra amin'ny fiainana andavanandro 💬</p>

    <div class="expr-list">
      <div
        v-for="e in fitenenana"
        :key="e.fr"
        class="expr-card card ripple-wrap pressable"
        @pointerdown="spawnRipple($event)"
      >
        <span class="expr-emoji">{{ e.emoji }}</span>
        <div class="expr-text">
          <p class="expr-fr">{{ e.fr }}</p>
          <p class="expr-mg">{{ e.mg }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 18px 18px 12px;
}

.intro {
  margin: 0 0 18px;
  font-weight: 700;
  color: var(--text-soft);
  font-size: 0.9rem;
}

.expr-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.expr-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.expr-card:nth-child(3n + 2) {
  background: linear-gradient(135deg, #fff, #fff3e6);
}

.expr-emoji {
  font-size: 1.5rem;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--bg-alt);
}

.expr-fr {
  margin: 0;
  font-weight: 800;
  color: var(--text);
  font-size: 0.95rem;
}

.expr-mg {
  margin: 3px 0 0;
  font-weight: 700;
  color: var(--text-soft);
  font-size: 0.82rem;
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
