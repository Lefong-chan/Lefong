import { defineStore } from 'pinia'
import { ref as dbRef, set, remove, onValue } from 'firebase/database'
import { db } from '../firebase'
import { useAuthStore } from './auth'

function favKey(itemId) {
  return String(itemId).replace(/[.#$/\[\]]/g, '_')
}

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    items: {},
    loaded: false,
    unsubscribe: null
  }),
  getters: {
    list: (state) => Object.values(state.items).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)),
    count: (state) => Object.keys(state.items).length
  },
  actions: {
    watch() {
      const authStore = useAuthStore()
      if (!authStore.user) {
        this.items = {}
        this.loaded = true
        return
      }
      if (this.unsubscribe) this.unsubscribe()
      const favRef = dbRef(db, `favorites/${authStore.user.uid}`)
      this.unsubscribe = onValue(favRef, (snap) => {
        this.items = snap.exists() ? snap.val() : {}
        this.loaded = true
      })
    },

    isFavorite(itemId) {
      return !!this.items[favKey(itemId)]
    },

    async toggle(product) {
      const authStore = useAuthStore()
      if (!authStore.user) throw new Error('NOT_LOGGED_IN')
      const key = favKey(product.itemId)
      const itemRef = dbRef(db, `favorites/${authStore.user.uid}/${key}`)
      if (this.items[key]) {
        await remove(itemRef)
      } else {
        await set(itemRef, {
          itemId: product.itemId,
          title: product.title,
          image: product.image,
          price: product.price,
          priceMax: product.priceMax || null,
          shopName: product.shopName || '',
          link: product.link || '',
          moq: product.moq || 1,
          unit: product.unit || 'pcs',
          addedAt: Date.now()
        })
      }
    },

    stop() {
      if (this.unsubscribe) this.unsubscribe()
      this.unsubscribe = null
      this.items = {}
      this.loaded = false
    }
  }
})
