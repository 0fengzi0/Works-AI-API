<script setup lang="ts">
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    message.success('登录成功')
    await router.push('/')
  } catch {
    message.error('登录失败，请检查邮箱和密码')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-shell">
    <n-card class="auth-card">
      <n-space vertical size="large">
        <n-space align="center">
          <span class="brand-mark">W</span>
          <div>
            <h1 class="page-title">登录 Works-AI-API</h1>
            <p class="muted">统一管理模型调用、Token 余额和平台秘钥。</p>
          </div>
        </n-space>
        <n-form @submit.prevent="submit">
          <n-form-item label="邮箱">
            <n-input v-model:value="email" placeholder="you@example.com" />
          </n-form-item>
          <n-form-item label="密码">
            <n-input v-model:value="password" type="password" show-password-on="click" />
          </n-form-item>
          <n-button type="primary" block :loading="loading" @click="submit">登录</n-button>
        </n-form>
        <n-button text @click="router.push('/register')">还没有账号？立即注册</n-button>
      </n-space>
    </n-card>
  </div>
</template>
