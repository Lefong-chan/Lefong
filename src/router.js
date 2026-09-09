import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/Home.vue') },
  { path: '/search', name: 'search', component: () => import('./views/SearchResults.vue') },
  { path: '/product/:itemId', name: 'product', component: () => import('./views/ProductDetail.vue'), props: true },
  { path: '/cart', name: 'cart', component: () => import('./views/Cart.vue'), meta: { requiresAuth: true } },
  { path: '/checkout', name: 'checkout', component: () => import('./views/Checkout.vue'), meta: { requiresAuth: true } },
  { path: '/orders', name: 'orders', component: () => import('./views/Orders.vue'), meta: { requiresAuth: true } },
  { path: '/orders/:orderId', name: 'order-detail', component: () => import('./views/OrderDetail.vue'), props: true, meta: { requiresAuth: true } },
  { path: '/account', name: 'account', component: () => import('./views/Account.vue'), meta: { requiresAuth: true } },
  { path: '/account/favorites', name: 'favorites', component: () => import('./views/MyProducts.vue'), meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: () => import('./views/Login.vue') },
  { path: '/register', name: 'register', component: () => import('./views/Register.vue') },

  {
    path: '/admin',
    component: () => import('./views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('./views/admin/AdminDashboard.vue') },
      { path: 'orders', name: 'admin-orders', component: () => import('./views/admin/AdminOrders.vue') },
      { path: 'orders/:orderId', name: 'admin-order-detail', component: () => import('./views/admin/AdminOrderDetail.vue'), props: true },
      { path: 'users', name: 'admin-users', component: () => import('./views/admin/AdminUsers.vue') }
    ]
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (!authStore.ready) {
    await authStore.init()
  }

  if (to.meta.requiresAdmin) {
    if (!authStore.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
    if (!authStore.isAdmin) return { name: 'home' }
    return true
  }

  // The admin account is redirected away from the buyer experience entirely.
  if (authStore.isAdmin && !to.path.startsWith('/admin') && to.name !== 'login') {
    return { name: 'admin-dashboard' }
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
