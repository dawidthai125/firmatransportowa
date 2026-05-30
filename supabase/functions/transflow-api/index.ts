/** TransFlow Edge API — osobny projekt Supabase (nie współdzielony z wgdom). */
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import * as auth from './auth.ts'
import * as kv from './kv_store.ts'

const SLUG = 'transflow-api'
const PREFIX = `/${SLUG}`

const app = new Hono()

app.use('*', logger(console.log))
app.use(
  '/*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization', 'apikey'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    maxAge: 600,
  }),
)

app.get(`${PREFIX}/health`, (c) => c.json({ status: 'ok', service: 'transflow-api' }))

app.post(`${PREFIX}/batch-get`, async (c) => {
  const requestAuth = await auth.resolveRequestAuth(c.req.header('Authorization'))
  const body = await c.req.json()
  const keys: string[] = Array.isArray(body?.keys) ? body.keys : []
  const allowed = auth.filterReadableKeys(requestAuth, keys)
  const values = await kv.mget(allowed)
  const result = keys.map((k) => {
    const idx = allowed.indexOf(k)
    return idx >= 0 ? values[idx] : null
  })
  return c.json({ values: result })
})

app.post(`${PREFIX}/batch-set`, async (c) => {
  const requestAuth = await auth.resolveRequestAuth(c.req.header('Authorization'))
  const body = await c.req.json()
  const entries: { key: string; value: unknown }[] = Array.isArray(body?.entries) ? body.entries : []
  const allowed = auth.filterWritableEntries(requestAuth, entries)
  if (allowed.length === 0) return c.json({ ok: true, count: 0 })
  const keys = allowed.map((e) => e.key)
  const values = allowed.map((e) => e.value)
  await kv.mset(keys, values)
  return c.json({ ok: true, count: allowed.length })
})

app.post(`${PREFIX}/automation/webhook`, async (c) => {
  const secret = Deno.env.get('TRANSFLOW_WEBHOOK_SECRET')
  const authHeader = c.req.header('Authorization')
  if (secret && authHeader !== `Bearer ${secret}`) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  const body = await c.req.json().catch(() => ({}))
  const tenantId = typeof body?.tenantId === 'string' ? body.tenantId : null
  const event = typeof body?.event === 'string' ? body.event : 'webhook.received'
  console.log('[automation/webhook]', event, tenantId)
  return c.json({ ok: true, received: event, tenantId, at: new Date().toISOString() })
})

app.get(`${PREFIX}/ping`, (c) => c.json({ pong: true }))

Deno.serve(app.fetch)
