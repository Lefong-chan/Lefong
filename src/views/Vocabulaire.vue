<script setup>
import { computed, ref } from 'vue'
import { kategoria } from '../data/vocabulaire'

const query = ref('')

const allWords = kategoria.flatMap((cat) =>
  cat.teny.map((word) => ({ ...word, id: `${cat.id}-${word.fr}` }))
)

const filteredWords = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allWords
  return allWords.filter((w) => w.fr.toLowerCase().includes(q) || w.mg.toLowerCase().includes(q))
})
</script>

<template>
  <div class="page">
    <label class="search-bar card">
      <i class="fa-solid fa-magnifying-glass search-icon"></i>
      <input
        :value="query"
        @input="query = $event.target.value"
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
        <i class="fa-solid fa-circle-info info-icon"></i>
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

.info-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 0.85rem;
  color: var(--text-soft);
  opacity: 0.5;
}

.empty {
  text-align: center;
  color: var(--text-soft);
  font-weight: 700;
  font-size: 0.88rem;
  margin-top: 30px;
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
