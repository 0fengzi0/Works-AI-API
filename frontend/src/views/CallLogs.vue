<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { api } from '@/utils/request'
import type { CallLog } from '@/types'

const rows = ref<CallLog[]>([])
const columns: DataTableColumns<CallLog> = [
  { title: '时间', key: 'createdAt' },
  { title: '模型', key: 'modelName' },
  { title: '输入', key: 'inputTokens' },
  { title: '输出', key: 'outputTokens' },
  { title: '消费', key: 'totalCost' },
  { title: '状态', key: 'status' },
]

onMounted(async () => {
  const { data } = await api.get('/logs')
  rows.value = data.data
})
</script>

<template>
  <section>
    <h1 class="page-title">调用日志</h1>
    <p class="page-subtitle">追踪每次模型调用的 Token、费用、状态和耗时。</p>
    <n-data-table :columns="columns" :data="rows" />
  </section>
</template>
