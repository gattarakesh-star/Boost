// Live buses on the Narsipatnam <-> Chodavaram route only (Cloudflare Pages Function).
// Same logic as the Netlify version: fetch the statewide APSRTC feed, keep this route's buses.
const FEED = 'https://maps.reclaim.city/apsrtc/rt/vehicle_positions.json'
const FRESH_MS = 10000

const TRIPS = ["GA63_1_NARSIPATNAM","GA33_8_NARSIPATNAM","GA11_1_NARSIPATNAM","GA32_8_NARSIPATNAM","GE11_1_NARSIPATNAM","GA83_8_NARSIPATNAM","GA91_1_NARSIPATNAM","GA63_2_NARSIPATNAM","GA24_1_NARSIPATNAM","GA11_2_NARSIPATNAM","GA33_1_NARSIPATNAM","GA32_1_NARSIPATNAM","GE11_2_NARSIPATNAM","GA83_1_NARSIPATNAM","GA91_2_NARSIPATNAM","GA81_3_NARSIPATNAM","GA24_2_NARSIPATNAM","GA63_3_NARSIPATNAM","GA33_2_NARSIPATNAM","GA11_3_NARSIPATNAM","BUS1_5_NARSIPATNAM","GA32_2_NARSIPATNAM","GE11_3_NARSIPATNAM","GA83_2_NARSIPATNAM","BUS6_7_NARSIPATNAM","GA91_3_NARSIPATNAM","GA81_4_NARSIPATNAM","GA24_3_NARSIPATNAM","GA63_4_NARSIPATNAM","GA33_3_NARSIPATNAM","GA11_4_NARSIPATNAM","BUS5_7_NARSIPATNAM","BUS1_6_NARSIPATNAM","GA32_3_NARSIPATNAM","GE11_4_NARSIPATNAM","BUS6_8_NARSIPATNAM","GA83_3_NARSIPATNAM","GA91_4_NARSIPATNAM","GA81_5_NARSIPATNAM","GA24_4_NARSIPATNAM","BUS5_8_NARSIPATNAM","GA63_5_NARSIPATNAM","GA33_4_NARSIPATNAM","GA11_5_NARSIPATNAM","GA32_4_NARSIPATNAM","GA83_4_NARSIPATNAM","GE11_5_NARSIPATNAM","GA81_6_NARSIPATNAM","GA91_5_NARSIPATNAM","GA63_6_NARSIPATNAM","GA24_5_NARSIPATNAM","GA11_6_NARSIPATNAM","GA33_5_NARSIPATNAM","GA32_5_NARSIPATNAM","GE11_6_NARSIPATNAM","GA83_5_NARSIPATNAM","GA91_6_NARSIPATNAM","FG11_3_NARSIPATNAM","GA24_6_NARSIPATNAM","GA33_6_NARSIPATNAM","GA63_7_NARSIPATNAM","GA32_6_NARSIPATNAM","GE11_7_NARSIPATNAM","GA83_6_NARSIPATNAM","GA11_9_NARSIPATNAM","FG11_4_NARSIPATNAM","GA91_7_NARSIPATNAM","GA63_8_NARSIPATNAM","GA33_7_NARSIPATNAM","GA11_10_NARSIPATNAM","GA32_7_NARSIPATNAM","GE11_8_NARSIPATNAM","GA83_7_NARSIPATNAM","GA91_8_NARSIPATNAM"]
const tripIds = new Set(TRIPS)

function onRoute(trip) {
  if (!trip) return false
  if (tripIds.has(trip.tripId)) return true
  const r = (trip.routeId || '').toLowerCase()
  return r.includes('narsipatnam') && r.includes('chodavaram')
}

let cache = null // { at, body }
let inflight = null

async function load() {
  const res = await fetch(FEED, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(12000) })
  if (!res.ok) throw new Error('feed ' + res.status)
  const d = await res.json()
  const buses = []
  for (const e of d.entity || []) {
    const v = e.vehicle
    if (!v || !onRoute(v.trip)) continue
    const p = v.position || {}
    if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') continue
    buses.push({
      trip: v.trip.tripId,
      date: v.trip.startDate || null,
      bus: (v.vehicle && (v.vehicle.label || v.vehicle.licensePlate)) || null,
      lat: p.latitude,
      lon: p.longitude,
      kmh: typeof p.speed === 'number' ? Math.round(p.speed * 3.6) : null,
      bearing: typeof p.bearing === 'number' ? Math.round(p.bearing) : null,
      ts: Number(v.timestamp) || null,
    })
