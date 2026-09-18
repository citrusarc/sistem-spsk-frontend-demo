import { createRouter, createWebHistory } from 'vue-router'
import type { Peranan } from '@/lib/api'
import { authReady, currentUser, initAuth, isAuthenticated } from '@/lib/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: Peranan[]
    title?: string
  }
}

// ADMIN tiada akses kepada kontrak/dashboard (API.md §1) — laman utamanya ialah pengurusan pengguna.
const KONTRAK_ROLES: Peranan[] = ['PT_KONTRAK', 'PUU', 'PEGAWAI_PENYEMAK']

function homeRoute() {
  return currentUser.value?.peranan === 'ADMIN' ? { name: 'pengguna' } : { name: 'dashboard' }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'home', redirect: () => homeRoute() },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { roles: KONTRAK_ROLES, title: 'Dashboard' },
        },
        {
          path: 'kontrak',
          name: 'kontrak',
          component: () => import('@/views/KontrakView.vue'),
          meta: { roles: KONTRAK_ROLES, title: 'Senarai Kontrak' },
        },
        {
          path: 'tugasan-saya',
          name: 'tugasan-saya',
          component: () => import('@/views/TugasanSayaView.vue'),
          meta: { roles: ['PEGAWAI_PENYEMAK'], title: 'Tugasan Saya' },
        },
        {
          path: 'kontrak/pengesahan',
          name: 'kontrak-pengesahan',
          component: () => import('@/views/PengesahanKontrakView.vue'),
          meta: { roles: ['PUU'], title: 'Pengesahan Kontrak' },
        },
        {
          path: 'kontrak/:id',
          name: 'kontrak-butiran',
          component: () => import('@/views/KontrakButiranView.vue'),
          meta: { roles: KONTRAK_ROLES, title: 'Butiran Kontrak' },
        },
        {
          path: 'kontrak/baharu',
          name: 'kontrak-baharu',
          component: () => import('@/views/KontrakBaharuView.vue'),
          meta: { roles: ['PT_KONTRAK'], title: 'Daftar Kontrak Baharu' },
        },
        {
          path: 'notifikasi',
          name: 'notifikasi',
          component: () => import('@/views/NotifikasiView.vue'),
          meta: { title: 'Notifikasi' },
        },
        {
          path: 'pengguna',
          name: 'pengguna',
          component: () => import('@/views/PenggunaView.vue'),
          meta: { roles: ['ADMIN'], title: 'Pengurusan Pengguna' },
        },
        {
          path: 'kata-laluan',
          name: 'kata-laluan',
          component: () => import('@/views/TukarKataLaluanView.vue'),
          meta: { title: 'Tukar Kata Laluan' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
})

router.beforeEach(async (to) => {
  if (!authReady()) {
    await initAuth()
  }

  if (to.name === 'login') {
    if (isAuthenticated.value) return homeRoute()
    return true
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles && !to.meta.roles.includes(currentUser.value!.peranan)) {
    return homeRoute()
  }

  return true
})

export default router
