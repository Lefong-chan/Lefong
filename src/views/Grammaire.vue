<script setup>
import { ref } from 'vue'
import { lesona } from '../data/grammaire'
import { spawnRipple } from '../composables/useRipple'

const openId = ref(lesona[0]?.id ?? null)

function toggle(id, event) {
  spawnRipple(event)
  openId.value = openId.value === id ? null : id
}
</script>

<template>
  <div class="page">
    <p class="intro">Lesona fototra hianarana ny fitsipi-teny frantsay 📐</p>

    <div v-for="l in lesona" :key="l.id" class="lesson card">
      <button
        type="button"
        class="lesson-head ripple-wrap pressable"
        @click="toggle(l.id, $event)"
      >
        <span class="lesson-emoji">{{ l.emoji }}</span>
        <div class="lesson-titles">
          <h2>{{ l.lohateny }}</h2>
          <p>{{ l.fintina }}</p>
        </div>
        <span class="chevron" :class="{ open: openId === l.id }">⌄</span>
      </button>

      <Transition name="accordion">
        <div v-if="openId === l.id" class="lesson-body">
          <div v-for="ex in l.ohatra" :key="ex.fr" class="example">
            <span class="example-fr">{{ ex.fr }}</span>
            <span class="example-arrow">→</span>
            <span class="example-mg">{{ ex.mg }}</span>
          </div>
        </div>
      </Transition>
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

.lesson {
  margin-bottom: 14px;
  overflow: hidden;
}

.lesson-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
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

.chevron {
  font-size: 1.3rem;
  color: var(--primary);
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.chevron.open {
  transform: rotate(180deg);
}

.lesson-body {
  padding: 0 16px 16px 68px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.example {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  background: var(--bg-alt);
  padding: 8px 12px;
  border-radius: 12px;
}

.example-fr {
  font-weight: 800;
  color: var(--primary-dark);
}

.example-arrow {
  color: var(--accent);
  font-weight: 800;
}

.example-mg {
  color: var(--text-soft);
  font-weight: 700;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.28s ease, opacity 0.2s ease;
  max-height: 260px;
  overflow: hidden;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
