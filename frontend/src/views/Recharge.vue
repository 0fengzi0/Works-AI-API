<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { api } from '@/utils/request'
import { useAuthStore } from '@/stores/auth'

interface RechargeRecord {
  id: string
  amount: number
  code: string
  createdAt: string
}

const message = useMessage()
const authStore = useAuthStore()
const code = ref('')
const records = ref<RechargeRecord[]>([])
const columns: DataTableColumns<RechargeRecord> = [
  { title: '卡密', key: 'code' },
  { title: 'Token 数量', key: 'amount' },
  { title: '充值时间', key: 'createdAt' },
]

async function load() {
  const { data } = await api.get('/recharge/records')
  records.value = data.data
}

async function redeem() {
  await api.post('/recharge/redeem', { code: code.value })
  message.success('充值成功')
  code.value = ''
  await authStore.fetchUser()
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="page-title">Token 余额与充值</h1>
    <p class="page-subtitle">输入管理员生成的卡密即可核销充值。</p>
    <n-card style="margin-bottom: 16px">
      <n-space>
        <n-input v-model:value="code" style="width: 320px" placeholder="请输入卡密" />
        <n-button type="primary" @click="redeem">立即核销</n-button>
      </n-space>
    </n-card>
    <n-data-table :columns="columns" :data="records" />
  </section>
</template>
