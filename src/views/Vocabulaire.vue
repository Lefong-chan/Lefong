<script setup>
import { computed, reactive, ref } from 'vue'
import { kategoria } from '../data/vocabulaire'
import { spawnRipple } from '../composables/useRipple'

const favorites = reactive(new Set())
const query = ref('')

const allWords = kategoria.flatMap((cat) =>
  cat.teny.map((word) => ({ ...word, id: `${cat.id}-${word.fr}` }))
)

const filteredWords = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allWords
  return allWords.filter((w) => w.fr.toLowerCase().includes(q) || w.mg.toLowerCase().includes(q))
})

function toggleFav(id, event) {
  spawnRipple(event)
  if (favorites.has(id)) favorites.delete(id)
  else favorites.add(id)
}
</script>

<template>
  <div class="page">
    <label class="search-bar card">
      <i class="fa-solid fa-magnifying-glass search-icon"></i>
      <input
        v-model="query"
        type="text"
        class="search-input"
        placeholder="Rechercher un mot..."
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      />
      <button
        v-if="query"
        type="button"
        class="clear-btn"
        aria-label="Effacer la recherche"
        @click="query = ''"
      >
        <i class="fa-solid fa-circle-xmark"></i>
      </button>
    </label>

    <div class="word-grid">
      <div v-for="word in filteredWords" :key="word.id" class="word-card card">
        <div class="word-fr">{{ word.fr }}</div>
        <div class="word-mg">{{ word.mg }}</div>
        <button
          type="button"
          class="fav-btn ripple-wrap pressable"
          :class="{ active: favorites.has(word.id) }"
          @click="toggleFav(word.id, $event)"
          :aria-label="'Enregistrer ' + word.fr"
        >
          {{ favorites.has(word.id) ? '⭐' : '☆' }}
        </button>
      </div>
    </div>

    <p v-if="!filteredWords.length" class="empty">Aucun mot trouvé pour « {{ query }} »</p>
  </div>
</template>

<style scoped>
.page {
  padding: 18px 18px 12px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 18px;
}

.search-icon {
  font-size: 0.95rem;
  color: var(--text-soft);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
}

.search-input::placeholder {
  color: var(--text-soft);
  font-weight: 600;
}

.clear-btn {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--text-soft);
  font-size: 1.1rem;
  line-height: 1;
  padding: 2px;
  cursor: pointer;
}

.word-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.word-card {
  position: relative;
  padding: 14px 34px 14px 14px;
  animation: pop-in 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both;
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

.empty {
  text-align: center;
  color: var(--text-soft);
  font-weight: 700;
  font-size: 0.88rem;
  margin-top: 30px;
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
