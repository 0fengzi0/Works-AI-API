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
    await authStore.register(email.value, password.value)
    message.success('注册成功')
    await router.push('/')
  } catch {
    message.error('注册失败，密码需至少 8 位并包含字母和数字')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-shell">
    <n-card class="auth-card">
      <n-space vertical size="large">
        <div>
          <h1 class="page-title">创建账号</h1>
          <p class="muted">首个注册用户会自动成为管理员，便于初始化平台。</p>
        </div>
        <n-form @submit.prevent="submit">
          <n-form-item label="邮箱">
            <n-input v-model:value="email" placeholder="you@example.com" />
          </n-form-item>
          <n-form-item label="密码">
            <n-input v-model:value="password" type="password" show-password-on="click" placeholder="至少 8 位，包含字母和数字" />
          </n-form-item>
          <n-button type="primary" block :loading="loading" @click="submit">注册并进入控制台</n-button>
        </n-form>
        <n-button text @click="router.push('/login')">已有账号？去登录</n-button>
      </n-space>
    </n-card>
  </div>
</template>
