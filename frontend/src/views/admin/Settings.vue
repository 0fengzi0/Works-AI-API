<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { api } from '@/utils/request'

interface SettingRow {
  key: string
  value: string
  updatedAt: string
}

const message = useMessage()
const rows = ref<SettingRow[]>([])
const keyName = ref('rate_limit_rpm')
const value = ref('60')
const columns: DataTableColumns<SettingRow> = [
  { title: '配置项', key: 'key' },
  { title: '值', key: 'value' },
  { title: '更新时间', key: 'updatedAt' },
]

async function load() {
  const { data } = await api.get('/admin/settings')
  rows.value = data.data
}

async function save() {
  await api.put(`/admin/settings/${keyName.value}`, { value: value.value })
  message.success('配置已保存')
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="page-title">系统设置</h1>
    <p class="page-subtitle">保存限流、公告和基础参数等键值配置。</p>
    <n-card style="margin-bottom: 16px">
      <n-space>
        <n-input v-model:value="keyName" placeholder="配置键" />
        <n-input v-model:value="value" placeholder="配置值" />
        <n-button type="primary" @click="save">保存</n-button>
      </n-space>
    </n-card>
    <n-data-table :columns="columns" :data="rows" />
  </section>
</template>
