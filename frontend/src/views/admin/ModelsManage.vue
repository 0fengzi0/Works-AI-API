<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { api } from '@/utils/request'
import type { ModelInfo } from '@/types'

const message = useMessage()
const rows = ref<ModelInfo[]>([])
const form = reactive({ id: '', channelId: 'openai', realModel: '', displayName: '', contextLength: 8192, inputPrice: 1, outputPrice: 2, status: 'active' as 'active' | 'disabled', description: '' })
const columns: DataTableColumns<ModelInfo> = [
  { title: '展示名', key: 'displayName' },
  { title: '模型 ID', key: 'id' },
  { title: '渠道', key: 'channelId' },
  { title: '状态', key: 'status' },
  { title: '输入价', key: 'inputPrice' },
  { title: '输出价', key: 'outputPrice' },
]

async function load() {
  const { data } = await api.get('/models')
  rows.value = data.data
}

async function createModel() {
  await api.post('/models', form)
  message.success('模型已创建')
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="page-title">模型管理</h1>
    <p class="page-subtitle">配置模型映射、价格和可用状态。</p>
    <n-card style="margin-bottom: 16px" title="新增模型">
      <n-grid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
        <n-gi><n-input v-model:value="form.id" placeholder="平台模型 ID" /></n-gi>
        <n-gi><n-input v-model:value="form.displayName" placeholder="展示名称" /></n-gi>
        <n-gi><n-input v-model:value="form.realModel" placeholder="真实模型名" /></n-gi>
        <n-gi><n-input v-model:value="form.channelId" placeholder="渠道" /></n-gi>
        <n-gi><n-input-number v-model:value="form.inputPrice" style="width: 100%" placeholder="输入单价" /></n-gi>
        <n-gi><n-input-number v-model:value="form.outputPrice" style="width: 100%" placeholder="输出单价" /></n-gi>
      </n-grid>
      <n-button type="primary" style="margin-top: 12px" @click="createModel">创建模型</n-button>
    </n-card>
    <n-data-table :columns="columns" :data="rows" />
  </section>
</template>
