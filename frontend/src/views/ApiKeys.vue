<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import { NButton, NSpace, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { api } from '@/utils/request'
import type { UserApiKey } from '@/types'

const message = useMessage()
const rows = ref<UserApiKey[]>([])
const name = ref('默认项目')
const createdKey = ref('')

const columns: DataTableColumns<UserApiKey> = [
  { title: '名称', key: 'name' },
  { title: '秘钥', key: 'keyPrefix' },
  { title: '状态', key: 'status' },
  { title: '最后使用', key: 'lastUsedAt' },
  { title: '创建时间', key: 'createdAt' },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => setStatus(row, row.status === 'active' ? 'disabled' : 'active') }, { default: () => (row.status === 'active' ? '停用' : '启用') }),
          h(NButton, { size: 'small', type: 'error', onClick: () => remove(row) }, { default: () => '删除' }),
        ],
      })
    },
  },
]

async function load() {
  const { data } = await api.get('/keys')
  rows.value = data.data
}

async function createKey() {
  const { data } = await api.post('/keys', { name: name.value })
  createdKey.value = data.data.key
  message.success('秘钥已创建，请立即保存')
  await load()
}

async function setStatus(row: UserApiKey, status: 'active' | 'disabled') {
  await api.patch(`/keys/${row.id}/status`, { status })
  await load()
}

async function remove(row: UserApiKey) {
  await api.delete(`/keys/${row.id}`)
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="page-title">调用秘钥管理</h1>
    <p class="page-subtitle">秘钥仅在创建时完整展示一次。</p>
    <div class="toolbar">
      <n-input v-model:value="name" style="max-width: 260px" placeholder="秘钥名称" />
      <n-button type="primary" @click="createKey">创建秘钥</n-button>
    </div>
    <n-alert v-if="createdKey" type="success" style="margin-bottom: 16px">新秘钥：{{ createdKey }}</n-alert>
    <n-data-table :columns="columns" :data="rows" />
  </section>
</template>
