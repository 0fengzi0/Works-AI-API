<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import { NButton } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { api } from '@/utils/request'
import type { Voucher } from '@/types'

const rows = ref<Voucher[]>([])
const amount = ref(10000)
const count = ref(1)
const columns: DataTableColumns<Voucher> = [
  { title: '卡密', key: 'code' },
  { title: '面额', key: 'amount' },
  { title: '状态', key: 'status' },
  { title: '核销用户', key: 'usedBy' },
  { title: '核销时间', key: 'usedAt' },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NButton, { size: 'small', disabled: row.status !== 'unused', onClick: () => cancel(row) }, { default: () => '作废' })
    },
  },
]

async function load() {
  const { data } = await api.get('/admin/vouchers')
  rows.value = data.data
}

async function createVouchers() {
  await api.post('/admin/vouchers', { amount: amount.value, count: count.value })
  await load()
}

async function cancel(row: Voucher) {
  await api.patch(`/admin/vouchers/${row.id}/cancel`)
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="page-title">卡密管理</h1>
    <p class="page-subtitle">批量生成 Token 卡密，并跟踪核销状态。</p>
    <n-card style="margin-bottom: 16px">
      <n-space>
        <n-input-number v-model:value="amount" placeholder="Token 面额" />
        <n-input-number v-model:value="count" placeholder="生成数量" />
        <n-button type="primary" @click="createVouchers">生成卡密</n-button>
      </n-space>
    </n-card>
    <n-data-table :columns="columns" :data="rows" />
  </section>
</template>
