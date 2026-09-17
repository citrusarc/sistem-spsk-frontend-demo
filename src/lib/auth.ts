import { computed, ref } from 'vue'
import { clearToken, getMe, getToken, login as apiLogin, setToken, type User } from './api'

const user = ref<User | null>(null)
const isReady = ref(false)

export const isAuthenticated = computed(() => user.value !== null)
export const currentUser = computed(() => user.value)

// Dipanggil sekali semasa app dimulakan — sahkan token sedia ada (jika ada) dengan backend.
export async function initAuth() {
  const token = getToken()
  if (token) {
    try {
      user.value = await getMe()
    } catch {
      clearToken()
      user.value = null
    }
  }
  isReady.value = true
}

export function authReady() {
  return isReady.value
}

export async function login(email: string, password: string) {
  const { token, user: loggedInUser } = await apiLogin(email, password)
  setToken(token)
  user.value = loggedInUser
}

export function logout() {
  clearToken()
  user.value = null
}
