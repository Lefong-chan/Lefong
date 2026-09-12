<script setup>
import { reactive } from 'vue'
import { kategoria } from '../data/vocabulaire'
import { spawnRipple } from '../composables/useRipple'

const favorites = reactive(new Set())

function toggleFav(key, event) {
  spawnRipple(event)
  if (favorites.has(key)) favorites.delete(key)
  else favorites.add(key)
}
</script>

<template>
  <div class="page">
    <p class="intro">Teny vaovao isan'andro — kitapo kely feno teny frantsay 🎒</p>

    <section v-for="cat in kategoria" :key="cat.id" class="category">
      <div class="category-head">
        <span class="cat-emoji">{{ cat.emoji }}</span>
        <h2>{{ cat.anarana }}</h2>
      </div>

      <div class="word-grid">
        <div v-for="word in cat.teny" :key="cat.id + word.fr" class="word-card card">
          <div class="word-fr">{{ word.fr }}</div>
          <div class="word-mg">{{ word.mg }}</div>
          <button
            type="button"
            class="fav-btn ripple-wrap pressable"
            :class="{ active: favorites.has(cat.id + word.fr) }"
            @click="toggleFav(cat.id + word.fr, $event)"
            :aria-label="'Tehirizo ' + word.fr"
          >
            {{ favorites.has(cat.id + word.fr) ? '⭐' : '☆' }}
          </button>
        </div>
      </div>
    </section>
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

.category {
  margin-bottom: 22px;
}

.category-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.cat-emoji {
  font-size: 1.3rem;
}

.category-head h2 {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--primary-dark);
}

.word-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.word-card {
  position: relative;
  padding: 14px 34px 14px 14px;
  border-left: 4px solid var(--mint);
  animation: pop-in 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.word-card:nth-child(4n + 2) {
  border-left-color: var(--accent);
}
.word-card:nth-child(4n + 3) {
  border-left-color: var(--gold);
}
.word-card:nth-child(4n + 4) {
  border-left-color: var(--primary-light);
}

.word-fr {
  font-weight: 800;
  color: var(--text);
  font-size: 0.95rem;
}

.word-mg {
  margin-top: 4px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-soft);
}

.fav-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  border: none;
  background: transparent;
  font-size: 1.05rem;
  padding: 4px;
  border-radius: 50%;
  cursor: pointer;
  line-height: 1;
}

.fav-btn.active {
  animation: bounce-star 0.4s ease;
}

@keyframes bounce-star {
  0% {
    transform: scale(0.6);
  }
  60% {
    transform: scale(1.35);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
