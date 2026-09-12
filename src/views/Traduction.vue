<script setup>
import { ref } from 'vue'
import { spawnRipple } from '../composables/useRipple'

const langs = { fr: { label: 'Français', flag: '🇫🇷' }, mg: { label: 'Malgache', flag: '🇲🇬' } }

const from = ref('fr')
const to = ref('mg')
const text = ref('')
const showToast = ref(false)
let toastTimer = null

function swap(event) {
  spawnRipple(event)
  ;[from.value, to.value] = [to.value, from.value]
}

function tryTranslate(event) {
  spawnRipple(event)
  showToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (showToast.value = false), 1800)
}
</script>

<template>
  <div class="page">
    <div class="lang-bar card">
      <div class="lang-pill">
        <span>{{ langs[from].flag }}</span>
        <span>{{ langs[from].label }}</span>
      </div>

      <button type="button" class="swap-btn ripple-wrap pressable" @click="swap($event)" aria-label="Changer de sens">
        <i class="fa-solid fa-right-left"></i>
      </button>

      <div class="lang-pill target">
        <span>{{ langs[to].flag }}</span>
        <span>{{ langs[to].label }}</span>
      </div>
    </div>

    <div class="panel card">
      <textarea
        v-model="text"
        class="input-area"
        rows="4"
        :placeholder="`Écris ici le texte en ${langs[from].label}...`"
      />
      <div class="panel-footer">
        <span class="char-count">{{ text.length }}/500</span>
      </div>
    </div>

    <div class="panel card output-panel">
      <div class="output-empty">
        <p>La traduction en {{ langs[to].label }} apparaîtra ici</p>
      </div>
    </div>

    <button type="button" class="translate-btn ripple-wrap pressable" @click="tryTranslate($event)">
      Traduire
    </button>

    <Transition name="toast-pop">
      <div v-if="showToast" class="toast">Bientôt disponible — on y travaille ✨</div>
    </Transition>
  </div>
</template>

<style scoped>
.page {
  padding: 18px 18px 24px;
  position: relative;
}

.lang-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  margin-bottom: 14px;
}

.lang-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  font-weight: 800;
  font-size: 0.85rem;
  background: var(--bg-alt);
  color: var(--primary-dark);
  flex: 1;
  justify-content: center;
}

.lang-pill.target {
  background: linear-gradient(135deg, var(--mint), #23a897);
  color: #fff;
}

.swap-btn {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  margin: 0 8px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(255, 111, 89, 0.4);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.swap-btn:active {
  transform: scale(0.9) rotate(180deg);
}

.panel {
  padding: 14px;
  margin-bottom: 14px;
}

.input-area {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text);
  background: transparent;
}

.input-area::placeholder {
  color: var(--text-soft);
  font-weight: 600;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.char-count {
  font-size: 0.72rem;
  color: var(--text-soft);
  font-weight: 700;
}

.output-panel {
  min-height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-alt);
  border: 2px dashed var(--primary-light);
}

.output-empty {
  text-align: center;
  color: var(--text-soft);
}

.output-empty p {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0 12px;
}

.translate-btn {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary-light), var(--primary));
  color: #fff;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: var(--shadow-md);
}

.toast {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 6px;
  background: var(--primary-dark);
  color: #fff;
  text-align: center;
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.82rem;
  box-shadow: var(--shadow-md);
}

.toast-pop-enter-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}
.toast-pop-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.toast-pop-enter-from {
  transform: translateY(14px) scale(0.95);
  opacity: 0;
}
.toast-pop-leave-to {
  transform: translateY(6px);
  opacity: 0;
}
</style>
