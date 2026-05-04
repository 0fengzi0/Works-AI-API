# Works-AI-API

基于 Cloudflare Worker 的大模型 API 聚合平台。

## 项目定位

Works-AI-API 面向多渠道大模型统一接入场景，提供 OpenAI 兼容接口、Token 计费、秘钥管理、卡密充值、调用日志和后台管理能力。

## 技术栈

- 前端：Vue3 + TypeScript + Vite + Naive UI
- 后端：Cloudflare Worker
- 数据库：Cloudflare D1
- 认证：JWT

## 核心能力

- 用户注册、登录与 JWT 鉴权
- 用户创建和管理自己的平台调用秘钥
- 多渠道大模型聚合与统一转发
- 管理员统一维护渠道秘钥
- 按模型分别定价的 Token 计费
- 管理员卡密生成，用户核销充值 Token
- 调用日志与消费统计
- SSE 流式响应支持
- 多 Key 轮询与限流控制

## 说明

当前仓库以需求与文档为主，后续将按前后端分离方式逐步实现前端和 Worker 服务。
