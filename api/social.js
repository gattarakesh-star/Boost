// Tiny in-memory social stats + reviews for the bus tracker.
// NOTE: serverless instances are ephemeral — counters reset on cold starts/redeploys.
let views = 0
let viewDay = ''
const countedIds = new Map()
const viewers = new Map()
const reviews = []
const TTL = 60000

// Change this to your own secret if you want.
const ADMIN_KEY = 'nc-admin-7f3a9d2e'

// Stop IDs used by the app double as village names.
const VILLAGES = {
  '10341': 'Narsipatnam',
  '232363': 'Chettupalle',
  '235210': 'Rolugunta',
  '244110': 'Kothakota 👑',
  '229472': 'T Arjapuram',
  '23422': 'Ravikamatam',
  '238004': 'Lopudi-Singavaram',
  '23385': 'Vaddadi',
  '225902': 'Chodavaram',
}

function villageOf(raw) {
  const v = String(raw || '').trim()
  if (!v) return 'Unknown'
  return VILLAGES[v] || v.slice(0, 40)
}

// Views reset every day at midnight IST (UTC+5:30).
function resetViewsIfNeeded() {
  const day = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)
  if (viewDay !== day) { viewDay = day; views = 0; countedIds.clear() }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    },
  })
}

function prune() {
  const t = Date.now()
  for (const [id, v] of viewers) if (t - v.ts > TTL) viewers.delete(id)
}

function countBy(map, getter) {
  const out = {}
  for (const value of map.values()) {
    const k = getter(value) || 'Unknown'
    out[k] = (out[k] || 0) + 1
  }
  return out
}

function stats() {
  resetViewsIfNeeded()
  prune()
  return {
    views,
    viewers: viewers.size,
    reviews: reviews.length,
    viewsByVillage: countBy(countedIds, function (v) { return v }),
    liveByVillage: countBy(viewers, function (v) { return v.village }),
  }
}

function isAdmin(body) {
  return String(body.key || '') === ADMIN_KEY
}

export async function GET(request) {
  const type = new URL(request.url).searchParams.get('type') || 'all'
  const list = reviews.slice(-30).reverse()
  if (type === 'reviews') return json({ reviews: list })
  return json({ ...stats(), reviews: list })
}

export async function POST(request) {
  let body = {}
  try { body = await request.json() } catch { return json({ error: 'invalid json' }, 400) }

  if (body.action === 'admin-check') return json({ ok: isAdmin(body) })

  if (body.action === 'view' || body.action === 'ping') {
    const id = String(body.id || '').slice(0, 80)
    if (!id) return json({ error: 'missing id' }, 400)
    const village = villageOf(body.village)
    resetViewsIfNeeded()
    // Any unique browser counts once a day — whether it loads or just pings.
    if (!countedIds.has(id)) views++
    countedIds.set(id, village)
    viewers.set(id, { ts: Date.now(), village: village })
    return json(stats())
  }

  if (body.action === 'review') {
    const text = String(body.text || '').trim().slice(0, 300)
    if (!text) return json({ error: 'empty review' }, 400)
    const name = String(body.name || 'Anonymous').trim().slice(0, 40) || 'Anonymous'
    const rating = Math.max(1, Math.min(5, Number(body.rating) || 5))
    reviews.push({
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name, text, rating, ts: Date.now(),
    })
    if (reviews.length > 100) reviews.splice(0, reviews.length - 100)
    return json({ reviews: reviews.slice(-30).reverse() }, 201)
  }

  if (body.action === 'delete') {
    if (!isAdmin(body)) return json({ error: 'not allowed' }, 403)
    const id = String(body.reviewId || '')
    const i = reviews.findIndex(function (r) { return r.id === id })
    if (i < 0) return json({ error: 'review not found' }, 404)
    reviews.splice(i, 1)
    return json({ reviews: reviews.slice(-30).reverse() })
  }

  return json({ error: 'unknown action' }, 400)
}
