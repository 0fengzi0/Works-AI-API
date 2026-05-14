<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { api } from '@/utils/request'

interface AdminLogRow {
  id: string
  userEmail: string
  modelName: string
  totalCost: number
  status: string
  errorMessage: string | null
  createdAt: string
}

const rows = ref<AdminLogRow[]>([])
const columns: DataTableColumns<AdminLogRow> = [
  { title: '时间', key: 'createdAt' },
  { title: '用户', key: 'userEmail' },
  { title: '模型', key: 'modelName' },
  { title: '消费', key: 'totalCost' },
  { title: '状态', key: 'status' },
  { title: '错误', key: 'errorMessage' },
]

onMounted(async () => {
  const { data } = await api.get('/logs/admin')
  rows.value = data.data
})
</script>

<template>
  <section>
    <h1 class="page-title">日志中心</h1>
    <p class="page-subtitle">查看全局调用日志、成功率和错误分布的基础数据。</p>
    <n-data-table :columns="columns" :data="rows" />
  </section>
</template>
