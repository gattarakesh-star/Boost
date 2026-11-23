// Tiny in-memory social stats + reviews for the bus tracker.
// NOTE: serverless instances are ephemeral — counters reset on cold starts/redeploys.
let views = 0
let viewDay = ''
const countedIds = new Set()
const viewers = new Map()
const reviews = []
const TTL = 60000

// Change this to your own secret if you want.
const ADMIN_KEY = 'nc-admin-7f3a9d2e'

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
  for (const [id, ts] of viewers) if (t - ts > TTL) viewers.delete(id)
}

function stats() {
  resetViewsIfNeeded()
  prune()
  return { views, viewers: viewers.size, reviews: reviews.length }
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
    resetViewsIfNeeded()
    if (body.action === 'view' && !countedIds.has(id)) { countedIds.add(id); views++ }
    viewers.set(id, Date.now())
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
