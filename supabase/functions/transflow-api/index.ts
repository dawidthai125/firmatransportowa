/** TransFlow Edge API — osobny projekt Supabase (nie współdzielony z wgdom). */
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import * as auth from './auth.ts'
import * as kv from './kv_store.ts'
import { mergeSetWithServerAuthority } from './merge_set.ts'
import { applyTachographWebhook, runTachographSync } from './tachograph_sync.ts'
import { applyFleetTelematicsWebhook, runFleetTelematicsSync } from './fleet_telematics_sync.ts'
import { runFreightProductionSync } from './freight_sync.ts'
import { runInvoicingSync } from './invoicing_sync.ts'
import { runOcrRateCon } from './ocr_rate_con.ts'

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

app.get(`${PREFIX}/health`, (c) =>
  c.json({ status: 'ok', service: 'transflow-api', serverTime: new Date().toISOString() }),
)

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
  if (allowed.length === 0) return c.json({ ok: true, count: 0, serverTime: new Date().toISOString() })

  const serverAt = new Date().toISOString()
  const keys = allowed.map((e) => e.key)
  const existingValues = await kv.mget(keys)
  const mergedValues = allowed.map((entry, i) =>
    mergeSetWithServerAuthority(existingValues[i], entry.value, serverAt),
  )
  await kv.mset(keys, mergedValues)
  return c.json({ ok: true, count: allowed.length, serverTime: serverAt })
})

app.post(`${PREFIX}/fleet-telematics-sync`, async (c) => {
  const requestAuth = await auth.resolveRequestAuth(c.req.header('Authorization'))
  const body = await c.req.json().catch(() => ({}))
  const tenantId = typeof body?.tenantId === 'string' ? body.tenantId : null
  if (!tenantId) return c.json({ ok: false, error: 'tenantId required' }, 400)
  if (!auth.canWriteKey(requestAuth, `ft-${tenantId}-fleet-positions`)) {
    return c.json({ ok: false, error: 'forbidden' }, 403)
  }
  const result = await runFleetTelematicsSync(tenantId)
  return c.json(result, result.ok ? 200 : 400)
})

app.post(`${PREFIX}/fleet-telematics-webhook`, async (c) => {
  const secret = Deno.env.get('TRANSFLOW_WEBHOOK_SECRET')
  const authHeader = c.req.header('Authorization')
  if (secret && authHeader !== `Bearer ${secret}`) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  const body = await c.req.json().catch(() => ({}))
  const tenantId = typeof body?.tenantId === 'string' ? body.tenantId : null
  const positions = Array.isArray(body?.positions) ? body.positions : []
  if (!tenantId) return c.json({ ok: false, error: 'tenantId required' }, 400)
  const result = await applyFleetTelematicsWebhook(tenantId, positions)
  return c.json({ ok: true, ...result, at: new Date().toISOString() })
})

app.post(`${PREFIX}/tachograph-sync`, async (c) => {
  const requestAuth = await auth.resolveRequestAuth(c.req.header('Authorization'))
  const body = await c.req.json().catch(() => ({}))
  const tenantId = typeof body?.tenantId === 'string' ? body.tenantId : null
  if (!tenantId) return c.json({ ok: false, error: 'tenantId required' }, 400)
  if (!auth.canWriteKey(requestAuth, `ft-${tenantId}-tachograph`)) {
    return c.json({ ok: false, error: 'forbidden' }, 403)
  }
  const result = await runTachographSync(tenantId)
  return c.json(result, result.ok ? 200 : 400)
})

app.post(`${PREFIX}/tachograph-webhook`, async (c) => {
  const secret = Deno.env.get('TRANSFLOW_WEBHOOK_SECRET')
  const authHeader = c.req.header('Authorization')
  if (secret && authHeader !== `Bearer ${secret}`) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  const body = await c.req.json().catch(() => ({}))
  const tenantId = typeof body?.tenantId === 'string' ? body.tenantId : null
  const records = Array.isArray(body?.records) ? body.records : []
  if (!tenantId) return c.json({ ok: false, error: 'tenantId required' }, 400)
  const result = await applyTachographWebhook(tenantId, records)
  return c.json({ ok: true, ...result, at: new Date().toISOString() })
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

app.post(`${PREFIX}/ocr-rate-con`, async (c) => {
  const requestAuth = await auth.resolveRequestAuth(c.req.header('Authorization'))
  const body = await c.req.json().catch(() => ({}))
  const tenantId = typeof body?.tenantId === 'string' ? body.tenantId : null
  if (!tenantId) return c.json({ ok: false, error: 'tenantId required' }, 400)
  if (!auth.canReadKey(requestAuth, `ft-${tenantId}-freight-offers`)) {
    return c.json({ ok: false, error: 'forbidden' }, 403)
  }
  const result = await runOcrRateCon(body)
  return c.json(result)
})

app.post(`${PREFIX}/freight-sync`, async (c) => {
  const requestAuth = await auth.resolveRequestAuth(c.req.header('Authorization'))
  const body = await c.req.json().catch(() => ({}))
  const tenantId = typeof body?.tenantId === 'string' ? body.tenantId : null
  if (!tenantId) return c.json({ ok: false, error: 'tenantId required' }, 400)
  if (!auth.canWriteKey(requestAuth, `ft-${tenantId}-freight-offers`)) {
    return c.json({ ok: false, error: 'forbidden' }, 403)
  }
  const result = await runFreightProductionSync(tenantId, body?.config ?? {})
  return c.json(result, result.ok ? 200 : 400)
})

app.post(`${PREFIX}/invoicing-sync`, async (c) => {
  const requestAuth = await auth.resolveRequestAuth(c.req.header('Authorization'))
  const body = await c.req.json().catch(() => ({}))
  const tenantId = typeof body?.tenantId === 'string' ? body.tenantId : null
  if (!tenantId) return c.json({ ok: false, error: 'tenantId required' }, 400)
  if (!auth.canWriteKey(requestAuth, `ft-${tenantId}-invoicing-config`)) {
    return c.json({ ok: false, error: 'forbidden' }, 403)
  }
  const result = await runInvoicingSync(body)
  return c.json(result, result.ok ? 200 : 400)
})

app.get(`${PREFIX}/ping`, (c) => c.json({ pong: true }))

Deno.serve(app.fetch)
