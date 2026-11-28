// Persistent social stats + reviews, backed by Supabase REST.
// Survives Vercel cold starts, redeploys and closing the tab.
const SB_URL = 'https://nncpndzbcajasfkpyfiv.supabase.co'
const SB_KEY = 'sb_publishable_sqOWZsOn8YFIH50KhhurrA_Jpp_rJoM'
const ADMIN_KEY = 'nc-admin-7f3a9d2e'
const TTL = 60000
const NEWS_ID = '__news__'
const NEWS_MAX = 500

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
  'x01': 'Pedda Boddepalli',
  'x02': 'Rama Lakshmipuram',
  'x03': 'Nindugonda',
  'x04': 'Bogapuram',
  'x05': 'Kanchugummala',
  'x06': 'Macherlapalem',
  'x07': 'Dondapudi',
  'x08': 'Garnikam',
  'x09': 'Medivada',
  'x10': 'Buddiredlapalem',
  'x11': 'Mukundapuram',
  'x12': 'Vijayaramarajupeta',
  'x13': 'Lakshmipuram',
  'x14': 'Pakirsahebpeta',
}

function villageOf(raw) {
  const v = String(raw || '').trim()
  if (!v) return 'Unknown'
  return VILLAGES[v] || v.slice(0, 40)
}

function dayIST() {
  return new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)
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

async function sb(path, opts = {}) {
  const res = await fetch(SB_URL + '/rest/v1/' + path, {
    method: opts.method || 'GET',
    headers: Object.assign({
      apikey: SB_KEY,
      Authorization: 'Bearer ' + SB_KEY,
      'content-type': 'application/json',
    }, opts.headers || {}),
    body: opts.body,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('supabase ' + res.status + ': ' + (await res.text()).slice(0, 200))
  return res
}

async function getRows(path) {
  return (await sb(path)).json()
}

// Flash news is one reserved row inside the existing nc_reviews table.
// No extra Supabase table is needed; reviewList() hides this row.
async function readNews() {
  try {
    const rows = await getRows('nc_reviews?select=body,ts,rating&id=eq.' + NEWS_ID + '&limit=1')
    if (!rows.length) return { text: '', ts: 0, on: true }
    return {
      text: String(rows[0].body || ''),
      ts: Date.parse(rows[0].ts) || 0,
      on: Number(rows[0].rating) !== 1,
    }
  } catch (e) {
    return { text: '', ts: 0, on: true }
  }
}

async function writeNews(text, on) {
  await sb('nc_reviews?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      id: NEWS_ID,
      name: '__news__',
      body: text,
      rating: on ? 5 : 1,
      ts: new Date().toISOString(),
    }),
  })
}

function publicReview(r) {
  return {
    id: r.id,
    name: r.name || 'Anonymous',
    text: r.body || '',
    rating: r.rating || 5,
    ts: Date.parse(r.ts) || Date.now(),
  }
}

async function reviewList() {
  const rows = await getRows('nc_reviews?select=id,name,body,rating,ts&id=neq.__news__&order=ts.desc&limit=30')
  return rows.map(publicReview)
}

function countBy(list, getter) {
  const out = {}
  list.forEach(function (v) {
    const k = getter(v) || 'Unknown'
    out[k] = (out[k] || 0) + 1
  })
  return out
}

async function stats() {
  const day = dayIST()
  const [vrows, viewers, reviews] = await Promise.all([
    getRows('nc_views?select=village&day=eq.' + day),
    getRows('nc_viewers?select=village,ts'),
    reviewList(),
  ])
  const t = Date.now()
  const live = viewers.filter(function (v) { return t - Date.parse(v.ts) < TTL })
  return {
    views: vrows.length,
    viewers: live.length,
    reviews: reviews.length,
    viewsByVillage: countBy(vrows, function (v) { return v.village }),
    liveByVillage: countBy(live, function (v) { return v.village }),
  }
}

export async function GET(request) {
  try {
    const type = new URL(request.url).searchParams.get('type') || 'all'
    const [list, news] = await Promise.all([reviewList(), readNews()])
    if (type === 'reviews') return json({ reviews: list, news: news })
    return json(Object.assign({}, await stats(), { reviews: list, news: news }))
  } catch (e) {
    return json({ views: 0, viewers: 0, reviews: [], news: { text: '', ts: 0, on: true }, error: 'stats unavailable' }, 502)
  }
}

export async function POST(request) {
  let body = {}
  try { body = await request.json() } catch { return json({ error: 'invalid json' }, 400) }

  try {
    if (body.action === 'admin-check') return json({ ok: String(body.key || '') === ADMIN_KEY })

    if (body.action === 'view' || body.action === 'ping') {
      const id = String(body.id || '').slice(0, 80)
      if (!id) return json({ error: 'missing id' }, 400)
      const village = villageOf(body.village)
      if (body.action === 'view') {
        await sb('nc_views?on_conflict=vid,day', {
          method: 'POST',
          headers: { Prefer: 'resolution=ignore-duplicates' },
          body: JSON.stringify({ vid: id, day: dayIST(), village: village }),
        })
      }
      await sb('nc_viewers?on_conflict=vid', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ vid: id, village: village, ts: new Date().toISOString() }),
      })
      return json(await stats())
    }

    if (body.action === 'review') {
      const text = String(body.text || '').trim().slice(0, 300)
      if (!text) return json({ error: 'empty review' }, 400)
      const name = String(body.name || 'Anonymous').trim().slice(0, 40) || 'Anonymous'
      const rating = Math.max(1, Math.min(5, Number(body.rating) || 5))
      await sb('nc_reviews', {
        method: 'POST',
        body: JSON.stringify({
          id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
          name: name, body: text, rating: rating, ts: new Date().toISOString(),
        }),
      })
      return json({ reviews: await reviewList() }, 201)
    }

    if (body.action === 'set-news') {
      if (String(body.key || '') !== ADMIN_KEY) return json({ error: 'not allowed' }, 403)
      const text = String(body.text || '').trim().slice(0, NEWS_MAX)
      try {
        await writeNews(text, body.on !== false)
      } catch (e) {
        return json({ error: 'Could not save news. Try again.' }, 500)
      }
      return json({ news: { text: text, ts: Date.now() } })
    }

    if (body.action === 'delete') {
      if (String(body.key || '') !== ADMIN_KEY) return json({ error: 'not allowed' }, 403)
      const id = String(body.reviewId || '')
      await sb('nc_reviews?id=eq.' + encodeURIComponent(id), { method: 'DELETE' })
      return json({ reviews: await reviewList() })
    }

    return json({ error: 'unknown action' }, 400)
  } catch (e) {
    return json({ error: 'database unavailable' }, 502)
  }
}
