import { createApp } from 'vue'
import App from './AppShell.vue'
import router from './router'
import './style.css'

createApp(App).use(router).mount('#app')

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Aplikasi tetap dapat digunakan secara daring jika service worker tidak tersedia.
    })
  })
}
