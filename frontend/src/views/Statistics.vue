<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/utils/request'

const stats = ref({ totalCalls: 0, totalCost: 0, inputTokens: 0, outputTokens: 0 })

onMounted(async () => {
  const { data } = await api.get('/logs/statistics')
  stats.value = data.data
})
</script>

<template>
  <section>
    <h1 class="page-title">消费统计</h1>
    <p class="page-subtitle">按账户聚合调用量、Token 消耗和费用。</p>
    <div class="metric-grid">
      <n-card title="调用次数"><div class="metric-value">{{ stats.totalCalls }}</div></n-card>
      <n-card title="总消费"><div class="metric-value">{{ stats.totalCost }}</div></n-card>
      <n-card title="输入 Token"><div class="metric-value">{{ stats.inputTokens }}</div></n-card>
      <n-card title="输出 Token"><div class="metric-value">{{ stats.outputTokens }}</div></n-card>
    </div>
  </section>
</template>
