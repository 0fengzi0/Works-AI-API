import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { api } from '@/utils/request'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    token.value = data.data.token
    user.value = data.data.user
    localStorage.setItem('token', token.value)
  }

  async function register(email: string, password: string) {
    const { data } = await api.post('/auth/register', { email, password })
    token.value = data.data.token
    user.value = data.data.user
    localStorage.setItem('token', token.value)
  }

  async function fetchUser() {
    const { data } = await api.get('/auth/me')
    user.value = data.data
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, isLoggedIn, isAdmin, login, register, fetchUser, logout }
})