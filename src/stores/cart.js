import { defineStore } from 'pinia'
import { ref as dbRef, set, get, remove, onValue } from 'firebase/database'
import { db } from '../firebase'
import { useAuthStore } from './auth'

function lineKey(itemId, skuId) {
  return `${itemId}__${skuId || 'default'}`.replace(/[.#$/\[\]]/g, '_')
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: {},
    loaded: false,
    unsubscribe: null
  }),
  getters: {
    lines: (state) => Object.values(state.items).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)),
    count: (state) => Object.values(state.items).reduce((sum, l) => sum + (l.quantity || 0), 0),
    totalYuan: (state) => Object.values(state.items).reduce((sum, l) => sum + (l.price || 0) * (l.quantity || 0), 0)
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
      const cartRef = dbRef(db, `carts/${authStore.user.uid}`)
      this.unsubscribe = onValue(cartRef, (snap) => {
        this.items = snap.exists() ? snap.val() : {}
        this.loaded = true
      })
    },

    async addItem(product, quantity = 1) {
      const authStore = useAuthStore()
      if (!authStore.user) throw new Error('NOT_LOGGED_IN')
      const key = lineKey(product.itemId, product.skuId)
      const itemRef = dbRef(db, `carts/${authStore.user.uid}/${key}`)
      const snap = await get(itemRef)
      const existingQty = snap.exists() ? snap.val().quantity : 0
      await set(itemRef, {
        itemId: product.itemId,
        skuId: product.skuId || 'default',
        title: product.title,
        image: product.image,
        price: product.price,
        variantLabel: product.variantLabel || '',
        shopName: product.shopName || '',
        link: product.link || '',
        quantity: existingQty + quantity,
        addedAt: Date.now()
      })
    },

    async updateQuantity(key, quantity) {
      const authStore = useAuthStore()
      if (!authStore.user) return
      if (quantity <= 0) return this.removeItem(key)
      const itemRef = dbRef(db, `carts/${authStore.user.uid}/${key}`)
      const snap = await get(itemRef)
      if (!snap.exists()) return
      await set(itemRef, { ...snap.val(), quantity })
    },

    async removeItem(key) {
      const authStore = useAuthStore()
      if (!authStore.user) return
      await remove(dbRef(db, `carts/${authStore.user.uid}/${key}`))
    },

    async clear() {
      const authStore = useAuthStore()
      if (!authStore.user) return
      await remove(dbRef(db, `carts/${authStore.user.uid}`))
    },

    stop() {
      if (this.unsubscribe) this.unsubscribe()
      this.unsubscribe = null
      this.items = {}
      this.loaded = false
    }
  }
})

export { lineKey }
