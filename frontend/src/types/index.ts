export interface User {
  id: string
  email: string
  role: 'user' | 'admin'
  status: 'active' | 'disabled' | 'frozen'
  tokenBalance: number
  createdAt: string
  updatedAt: string
}

export interface UserApiKey {
  id: string
  name: string
  keyPrefix: string // sk-xxxx...xxxx (masked)
  status: 'active' | 'disabled'
  lastUsedAt: string | null
  createdAt: string
}

export interface ModelInfo {
  id: string
  channelId: string
  realModel: string
  displayName: string
  contextLength: number
  inputPrice: number
  outputPrice: number
  status: 'active' | 'disabled'
  description: string
}

export interface Voucher {
  id: string
  code: string
  amount: number
  status: 'unused' | 'used' | 'expired' | 'cancelled'
  usedBy: string | null
  usedAt: string | null
  createdAt: string
}

export interface CallLog {
  id: string
  userId: string
  userEmail: string
  modelId: string
  modelName: string
  channelId: string
  inputTokens: number
  outputTokens: number
  totalCost: number
  duration: number
  status: 'success' | 'error'
  errorMessage: string | null
  createdAt: string
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}