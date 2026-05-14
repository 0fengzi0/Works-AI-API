<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuOptions = [
  { label: '仪表盘', key: '/admin' },
  { label: '用户管理', key: '/admin/users' },
  { label: '模型管理', key: '/admin/models' },
  { label: '渠道 Key', key: '/admin/channel-keys' },
  { label: '卡密管理', key: '/admin/vouchers' },
  { label: '日志中心', key: '/admin/logs' },
  { label: '系统设置', key: '/admin/settings' },
]

const activeKey = computed(() => route.path)

onMounted(() => {
  if (!authStore.user) void authStore.fetchUser()
})

function handleMenu(key: string) {
  void router.push(key)
}
</script>

<template>
  <n-layout has-sider class="app-layout">
    <n-layout-sider bordered :width="228">
      <div class="side-brand">
        <span class="brand-mark">A</span>
        <span>管理后台</span>
      </div>
      <n-menu :value="activeKey" :options="menuOptions" @update:value="handleMenu" />
    </n-layout-sider>
    <n-layout>
      <header class="app-header">
        <strong>Works-AI-API Admin</strong>
        <n-button tertiary @click="router.push('/')">返回前台</n-button>
      </header>
      <main class="content-shell">
        <router-view />
      </main>
    </n-layout>
  </n-layout>
</template>
