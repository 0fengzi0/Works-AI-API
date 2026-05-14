<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { api } from '@/utils/request'

interface ChannelKeyRow {
  id: string
  channelId: string
  name: string
  status: string
  usageCount: number
  failureCount: number
  createdAt: string
}

const message = useMessage()
const rows = ref<ChannelKeyRow[]>([])
const form = reactive({ channelId: 'openai', name: '', apiKey: '' })
const columns: DataTableColumns<ChannelKeyRow> = [
  { title: '名称', key: 'name' },
  { title: '渠道', key: 'channelId' },
  { title: '状态', key: 'status' },
  { title: '使用次数', key: 'usageCount' },
  { title: '失败次数', key: 'failureCount' },
]

async function load() {
  const { data } = await api.get('/admin/channel-keys')
  rows.value = data.data
}

async function createKey() {
  await api.post('/admin/channel-keys', form)
  message.success('渠道 Key 已保存')
  form.name = ''
  form.apiKey = ''
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="page-title">渠道 Key 管理</h1>
    <p class="page-subtitle">统一维护第三方模型渠道秘钥，用户无需接触真实渠道 Key。</p>
    <n-card style="margin-bottom: 16px">
      <n-space>
        <n-input v-model:value="form.channelId" placeholder="渠道" />
        <n-input v-model:value="form.name" placeholder="名称" />
        <n-input v-model:value="form.apiKey" type="password" placeholder="API Key" />
        <n-button type="primary" @click="createKey">保存</n-button>
      </n-space>
    </n-card>
    <n-data-table :columns="columns" :data="rows" />
  </section>
</template>
