<script setup>
import { fitenenana } from '../data/expressions'
import { spawnRipple } from '../composables/useRipple'
</script>

<template>
  <div class="page">
    <p class="intro">Expressions courantes de la vie quotidienne 💬</p>

    <div class="expr-list">
      <div
        v-for="e in fitenenana"
        :key="e.fr"
        class="expr-card card ripple-wrap pressable"
        @pointerdown="spawnRipple($event)"
      >
        <p class="expr-fr">{{ e.fr }}</p>
        <p class="expr-mg">{{ e.mg }}</p>
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
  padding: 14px 16px;
  border-left: 4px solid var(--mint);
  animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.expr-card:nth-child(4n + 2) {
  border-left-color: var(--accent);
}
.expr-card:nth-child(4n + 3) {
  border-left-color: var(--gold);
}
.expr-card:nth-child(4n + 4) {
  border-left-color: var(--primary-light);
}

.expr-fr {
  margin: 0;
  font-weight: 800;
  color: var(--text);
  font-size: 0.95rem;
}

.expr-mg {
  margin: 4px 0 0;
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
