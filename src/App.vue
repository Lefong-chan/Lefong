<script setup>
import { computed, ref } from 'vue'
import TopBar from './components/TopBar.vue'
import BottomNav from './components/BottomNav.vue'
import ScrollIndicator from './components/ScrollIndicator.vue'
import Vocabulaire from './views/Vocabulaire.vue'
import Traduction from './views/Traduction.vue'
import Grammaire from './views/Grammaire.vue'
import Expressions from './views/Expressions.vue'

const tabs = [
  { key: 'vocabulaire', label: 'Vocabulaire', icon: '📚', subtitle: 'Apprends un nouveau mot chaque jour', emoji: '📚', component: Vocabulaire },
  { key: 'traduction', label: 'Traduction', icon: '🌐', subtitle: 'Traduire du français vers le malgache', emoji: '🌐', component: Traduction },
  { key: 'grammaire', label: 'Grammaire', icon: '✏️', subtitle: 'Explications simples et claires', emoji: '✏️', component: Grammaire },
  { key: 'expressions', label: 'Expressions', icon: '💬', subtitle: 'Expressions locales et courantes', emoji: '💬', component: Expressions },
]

const active = ref('vocabulaire')
const current = computed(() => tabs.find((t) => t.key === active.value))
</script>

<template>
  <div class="app-shell">
    <ScrollIndicator />

    <TopBar :title="current.label" :subtitle="current.subtitle" :emoji="current.emoji" />

    <main class="content">
      <Transition name="page-slide" mode="out-in">
        <component :is="current.component" :key="current.key" />
      </Transition>
    </main>

    <BottomNav v-model="active" :tabs="tabs" />
  </div>
</template>

<style scoped>
.content {
  flex: 1 1 auto;
}
</style>
