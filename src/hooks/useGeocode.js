// Geocode place names to coordinates using OpenStreetMap Nominatim
// Free, no API key needed, biased toward Ireland/UK

const cache = new Map()

// Check if value is a valid number coordinate
function hasCoord(val) {
  if (val === null || val === undefined || val === '' || val === 'null') return false
  const n = Number(val)
  return !isNaN(n) && n !== 0
}

export function itemMissingCoords(item) {
  return !hasCoord(item.lat) || !hasCoord(item.lng)
}

export async function geocodePlace(query) {
  if (!query || query.length < 2) return null

  const key = query.toLowerCase().trim()
  // Only use cache for successful results, not failures
  if (cache.has(key) && cache.get(key) !== null) return cache.get(key)

  try {
    let q = query
    if (!/ireland|eire|dublin|cork|galway|belfast|ie\b/i.test(q)) {
      q = q + ', Ireland'
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ie,gb&q=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'IrelandTripPlanner/1.0' },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      console.warn(`Geocode HTTP ${res.status} for: ${q}`)
      return null
    }
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

    console.warn(`Geocode: no results for "${q}"`)
  } catch (e) {
    console.warn(`Geocode error for "${query}":`, e.message)
  }

  // Don't cache failures so retries work
  return null
}

// Batch geocode: given an array of { id, name, location },
// geocode each and return map of id -> { lat, lng, location }
export async function geocodeMissing(items) {
  const updates = {}

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const query = item.location || item.name || item.title || ''
    if (!query) continue

    console.log(`Geocoding ${i + 1}/${items.length}: "${query}"`)
    const result = await geocodePlace(query)

    if (result) {
      // Build a short readable location from the display name
      let shortLocation = item.location || ''
      if (!shortLocation && result.displayName) {
        shortLocation = result.displayName.split(',').slice(0, 3).join(',').trim()
      }
      updates[item.id] = { lat: result.lat, lng: result.lng, location: shortLocation }
      console.log(`  -> Found: ${result.lat}, ${result.lng}`)
    } else {
      console.log(`  -> Not found`)
    }

    // Rate limit: Nominatim asks for max 1 req/sec
    if (i < items.length - 1) {
      await new Promise(r => setTimeout(r, 1100))
    }
  }

  return updates
}
