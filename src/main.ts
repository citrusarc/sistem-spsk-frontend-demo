import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './lib/api'
import { initAuth, logout } from './lib/auth'

// API.md: token tidak sah atau akaun dinyahaktifkan (401) — log keluar serta-merta.
setUnauthorizedHandler(() => {
  logout()
  if (router.currentRoute.value.name !== 'login') router.push({ name: 'login' })
})

initAuth().finally(() => {
  createApp(App).use(router).mount('#app')
})
