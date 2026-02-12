// Geocode place names to coordinates using OpenStreetMap Nominatim
// Free, no API key needed, biased toward Ireland/UK

const cache = new Map()

export async function geocodePlace(query) {
  if (!query || query.length < 2) return null

  // Normalize query for cache
  const key = query.toLowerCase().trim()
  if (cache.has(key)) return cache.get(key)

  try {
    // Add Ireland bias if not already mentioned
    let q = query
    if (!/ireland|eire|dublin|cork|galway|belfast|ie\b/i.test(q)) {
      q = q + ', Ireland'
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ie,gb&q=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'IrelandTripPlanner/1.0' },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return null
    const data = await res.json()

    if (data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      }
      cache.set(key, result)
      return result
    }
  } catch (e) {
    // Non-critical
  }

  cache.set(key, null)
  return null
}

// Batch geocode: given an array of { id, name, location, lat, lng },
// geocode any that are missing coords, return map of id -> { lat, lng }
export async function geocodeMissing(items) {
  const updates = {}
  const toGeocode = items.filter(i => !i.lat || !i.lng)

  // Nominatim rate limit: 1 req/sec, so we process sequentially with a small delay
  for (const item of toGeocode) {
    const query = item.location || item.name || item.title || ''
    if (!query) continue

    const result = await geocodePlace(query)
    if (result) {
      updates[item.id] = { lat: result.lat, lng: result.lng, location: item.location || result.displayName?.split(',').slice(0, 3).join(',').trim() }
    }

    // Small delay to respect Nominatim rate limits
    if (toGeocode.indexOf(item) < toGeocode.length - 1) {
      await new Promise(r => setTimeout(r, 400))
    }
  }

  return updates
}
