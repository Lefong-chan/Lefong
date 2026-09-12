<script setup>
import { lesona } from '../data/grammaire'
</script>

<template>
  <div class="page">
    <div v-for="l in lesona" :key="l.id" class="lesson card">
      <span class="lesson-emoji">{{ l.emoji }}</span>
      <div class="lesson-titles">
        <h2>{{ l.lohateny }}</h2>
        <p>{{ l.fintina }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 18px 18px 12px;
}

.lesson {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin-bottom: 14px;
  animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.lesson-emoji {
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--bg-alt);
}

.lesson-titles {
  flex: 1;
  min-width: 0;
}

.lesson-titles h2 {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text);
}

.lesson-titles p {
  margin: 3px 0 0;
  font-size: 0.78rem;
  color: var(--text-soft);
  font-weight: 600;
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
