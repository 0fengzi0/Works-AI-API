import { Hono } from 'hono'

const health = new Hono()

health.get('/health', (c) => {
  return c.json({ code: 200, message: 'ok', data: { status: 'running' } })
})

export { health }