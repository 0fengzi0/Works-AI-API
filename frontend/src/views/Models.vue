<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { api } from '@/utils/request'
import type { ModelInfo } from '@/types'

const rows = ref<ModelInfo[]>([])
const columns: DataTableColumns<ModelInfo> = [
  { title: '模型', key: 'displayName' },
  { title: '模型 ID', key: 'id' },
  { title: '渠道', key: 'channelId' },
  { title: '上下文', key: 'contextLength' },
  { title: '输入价', key: 'inputPrice' },
  { title: '输出价', key: 'outputPrice' },
  { title: '状态', key: 'status' },
]

onMounted(async () => {
  const { data } = await api.get('/models')
  rows.value = data.data
})
</script>

<template>
  <section>
    <h1 class="page-title">模型列表</h1>
    <p class="page-subtitle">查看平台可调用模型、上下文长度和 Token 计费价格。</p>
    <n-data-table :columns="columns" :data="rows" />
  </section>
</template>
