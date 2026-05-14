<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/utils/request'

const stats = ref({ users: 0, calls: 0, cost: 0, vouchers: 0 })

onMounted(async () => {
  const { data } = await api.get('/admin/dashboard')
  stats.value = data.data
})
</script>

<template>
  <section>
    <h1 class="page-title">后台仪表盘</h1>
    <p class="page-subtitle">平台用户、调用、消费和卡密概览。</p>
    <div class="metric-grid">
      <n-card title="用户数"><div class="metric-value">{{ stats.users }}</div></n-card>
      <n-card title="调用量"><div class="metric-value">{{ stats.calls }}</div></n-card>
      <n-card title="消费量"><div class="metric-value">{{ stats.cost }}</div></n-card>
      <n-card title="卡密数"><div class="metric-value">{{ stats.vouchers }}</div></n-card>
    </div>
  </section>
</template>
