<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  emoji: { type: String, default: '🇫🇷' },
})
</script>

<template>
  <header class="top-bar">
    <div class="brand">
      <span class="brand-badge">GMF</span>
      <div class="brand-text">
        <h1>{{ title }} <span class="title-emoji">{{ emoji }}</span></h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 22px 20px 26px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.top-bar::before {
  content: '';
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 201, 74, 0.25);
  top: -70px;
  right: -50px;
}

.top-bar::after {
  content: '';
  position: absolute;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(43, 196, 176, 0.22);
  bottom: -55px;
  left: -30px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.brand-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--gold);
  color: var(--primary-dark);
  font-family: 'Baloo 2', sans-serif;
  font-weight: 800;
  font-size: 0.95rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  flex-shrink: 0;
}

.brand-text h1 {
  color: #fff;
  font-size: 1.4rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
}

.title-emoji {
  font-size: 1.1rem;
}

.brand-text p {
  margin: 2px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.82rem;
  font-weight: 600;
}
</style>
