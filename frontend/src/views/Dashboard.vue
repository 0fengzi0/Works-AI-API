<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/utils/request'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const stats = ref({ totalCalls: 0, totalCost: 0, inputTokens: 0, outputTokens: 0 })
const curlExample = `curl /v1/chat/completions \\
  -H 'Authorization: Bearer wai_xxx' \\
  -H 'Content-Type: application/json' \\
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"hello"}]}'`

onMounted(async () => {
  await authStore.fetchUser()
  const { data } = await api.get('/logs/statistics')
  stats.value = data.data
})
</script>

<template>
  <section>
    <h1 class="page-title">控制台</h1>
    <p class="page-subtitle">查看账户余额、调用情况，并快速接入 OpenAI 兼容接口。</p>
    <div class="metric-grid">
      <n-card title="Token 余额"><div class="metric-value">{{ authStore.user?.tokenBalance ?? 0 }}</div></n-card>
      <n-card title="累计调用"><div class="metric-value">{{ stats.totalCalls }}</div></n-card>
      <n-card title="累计消费"><div class="metric-value">{{ stats.totalCost }}</div></n-card>
      <n-card title="累计 Token"><div class="metric-value">{{ stats.inputTokens + stats.outputTokens }}</div></n-card>
    </div>
    <n-card style="margin-top: 16px" title="OpenAI 兼容入口">
      <n-code language="bash" :code="curlExample" />
    </n-card>
  </section>
</template>
