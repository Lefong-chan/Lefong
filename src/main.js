import './style.css'

// The whole bootstrap runs through dynamic import() so a synchronous
// startup failure (e.g. missing Firebase env vars) can be caught here and
// shown to the user, instead of leaving a silent blank white page.
async function bootstrap() {
  const [{ createApp }, { createPinia }, { default: App }, { default: router }, { useAuthStore }] = await Promise.all([
    import('vue'),
    import('pinia'),
    import('./App.vue'),
    import('./router'),
    import('./stores/auth')
  ])

  const app = createApp(App)
  app.use(createPinia())
  app.use(router)

  const authStore = useAuthStore()
  await authStore.init()
  app.mount('#app')
}

bootstrap().catch((err) => {
  console.error('Sinolog failed to start:', err)
  const root = document.getElementById('app')
  if (!root) return
  const message = document.createElement('div')
  message.textContent = err && err.message ? err.message : String(err)
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:-apple-system,sans-serif;background:#fff7ed;box-sizing:border-box;">
      <div style="max-width:480px;text-align:center;">
        <p style="font-size:40px;margin:0 0 12px;">⚠️</p>
        <h1 style="font-size:18px;color:#c2410c;margin:0 0 10px;">Sinolog failed to start</h1>
        <p style="font-size:13px;color:#7c2d12;line-height:1.6;white-space:pre-wrap;">${message.innerHTML}</p>
        <p style="font-size:12px;color:#9a3412;margin-top:16px;">Check the Environment Variables (Firebase) in Vercel Project Settings, then redeploy.</p>
      </div>
    </div>
  `
})
