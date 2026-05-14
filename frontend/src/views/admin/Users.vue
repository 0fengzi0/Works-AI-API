<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import { NButton, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { api } from '@/utils/request'
import type { User } from '@/types'

const rows = ref<User[]>([])
const columns: DataTableColumns<User> = [
  { title: '邮箱', key: 'email' },
  { title: '角色', key: 'role' },
  { title: '状态', key: 'status' },
  { title: '余额', key: 'tokenBalance' },
  { title: '注册时间', key: 'createdAt' },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => setStatus(row, 'active') }, { default: () => '启用' }),
          h(NButton, { size: 'small', onClick: () => setStatus(row, 'disabled') }, { default: () => '禁用' }),
          h(NButton, { size: 'small', onClick: () => setStatus(row, 'frozen') }, { default: () => '冻结' }),
        ],
      })
    },
  },
]

async function load() {
  const { data } = await api.get('/admin/users')
  rows.value = data.data
}

async function setStatus(row: User, status: User['status']) {
  await api.patch(`/admin/users/${row.id}/status`, { status })
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="page-title">用户管理</h1>
    <p class="page-subtitle">查询用户、余额和账号状态。</p>
    <n-data-table :columns="columns" :data="rows" />
  </section>
</template>
