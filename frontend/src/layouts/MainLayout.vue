<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuOptions = [
  { label: '控制台', key: '/' },
  { label: '调用秘钥', key: '/keys' },
  { label: '模型列表', key: '/models' },
  { label: '余额充值', key: '/recharge' },
  { label: '调用日志', key: '/logs' },
  { label: '消费统计', key: '/statistics' },
]

const activeKey = computed(() => route.path)

onMounted(() => {
  if (!authStore.user) void authStore.fetchUser()
})

function handleMenu(key: string) {
  void router.push(key)
}

function logout() {
  authStore.logout()
  void router.push('/login')
}
</script>

<template>
  <n-layout has-sider class="app-layout">
    <n-layout-sider bordered collapse-mode="width" :width="228">
      <div class="side-brand">
        <span class="brand-mark">W</span>
        <span>Works-AI-API</span>
      </div>
      <n-menu :value="activeKey" :options="menuOptions" @update:value="handleMenu" />
    </n-layout-sider>
    <n-layout>
      <header class="app-header">
        <div>
          <strong>{{ authStore.user?.email || '用户控制台' }}</strong>
          <div class="muted">Token 余额：{{ authStore.user?.tokenBalance ?? 0 }}</div>
        </div>
        <n-space>
          <n-button v-if="authStore.isAdmin" tertiary @click="router.push('/admin')">后台管理</n-button>
          <n-button @click="logout">退出</n-button>
        </n-space>
      </header>
      <main class="content-shell">
        <router-view />
      </main>
    </n-layout>
  </n-layout>
</template>
