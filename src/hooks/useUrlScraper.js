import { useState } from 'react'

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
]

async function fetchWithProxy(url) {
  for (const makeProxy of CORS_PROXIES) {
    try {
      const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(12000) })
      if (res.ok) {
        const text = await res.text()
        if (text && text.length > 100) return text
      }
    } catch (e) {
      // try next proxy
    }
  }
  throw new Error('Could not fetch that URL. Check the address and try again.')
}

// --- Geocoding via OpenStreetMap Nominatim (free, no key needed) ---
async function geocode(query) {
  if (!query || query.length < 3) return { lat: null, lng: null }
  try {
    // Bias towards Ireland
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ie,gb&q=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'IrelandTripPlanner/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { lat: null, lng: null }
    const data = await res.json()
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      }
    }
  } catch (e) {
    // geocoding failed, non-critical
  }
  return { lat: null, lng: null }
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
}

function extractMeta(html, property) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']twitter:${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return decodeHtmlEntities(m[1].trim())
  }
  return ''
}

function extractTitle(html) {
  const ogTitle = extractMeta(html, 'title')
  if (ogTitle) return ogTitle
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) return decodeHtmlEntities(titleMatch[1].trim())
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1Match) return decodeHtmlEntities(h1Match[1].trim())
  return ''
}

function extractDescription(html) {
  return extractMeta(html, 'description') || ''
}

function isValidCoord(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    && !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0)
}

function extractCoordinates(html) {
  let lat = null, lng = null

  // Schema.org GeoCoordinates
  const latMatch = html.match(/"latitude"\s*:\s*["']?([-\d.]+)["']?/i)
  const lngMatch = html.match(/"longitude"\s*:\s*["']?([-\d.]+)["']?/i)
  if (latMatch && lngMatch) {
    lat = parseFloat(latMatch[1]); lng = parseFloat(lngMatch[1])
    if (isValidCoord(lat, lng)) return { lat, lng }
  }

  // Google Maps embed/link patterns
  const gmaps = html.match(/@([-\d.]+),([-\d.]+)/)
    || html.match(/center=([-\d.]+),([-\d.]+)/)
    || html.match(/ll=([-\d.]+),([-\d.]+)/)
  if (gmaps) {
    lat = parseFloat(gmaps[1]); lng = parseFloat(gmaps[2])
    if (isValidCoord(lat, lng)) return { lat, lng }
  }

  // data-lat / data-lng / data-lon
  const dl = html.match(/data-lat=["']([-\d.]+)["']/i)
  const dn = html.match(/data-(?:lng|lon|longitude)=["']([-\d.]+)["']/i)
  if (dl && dn) {
    lat = parseFloat(dl[1]); lng = parseFloat(dn[1])
    if (isValidCoord(lat, lng)) return { lat, lng }
  }

  // geo meta tag
  const geoPos = extractMeta(html, 'geo.position')
  if (geoPos) {
    const parts = geoPos.split(';').map(Number)
    if (parts.length === 2 && isValidCoord(parts[0], parts[1]))
      return { lat: parts[0], lng: parts[1] }
  }

  return { lat: null, lng: null }
}

function extractAddress(html) {
  // Schema.org structured address
  const street = html.match(/"streetAddress"\s*:\s*"([^"]+)"/i)?.[1]
  const locality = html.match(/"addressLocality"\s*:\s*"([^"]+)"/i)?.[1]
  const region = html.match(/"addressRegion"\s*:\s*"([^"]+)"/i)?.[1]
  const country = html.match(/"addressCountry"\s*:\s*"([^"]+)"/i)?.[1]
  const parts = [street, locality, region, country].filter(Boolean)
  if (parts.length > 0) return parts.join(', ')

  // Try common address patterns in visible text
  // Look for "Co. Kerry" / "County Clare" type patterns
  const countyMatch = html.match(/(?:Co\.|County)\s+([\w']+(?:\s+[\w']+)?)\s*,?\s*(Ireland|Eire)?/i)
  if (countyMatch) return countyMatch[0].trim()

  return ''
}

function extractPrice(html) {
  const patterns = [
    /green\s*fees?\s*(?:from|:)?\s*[€£$]\s*[\d,.]+/i,
    /[€£$]\s*[\d,.]+\s*(?:per|\/)\s*(?:person|round|player|green)/i,
    /(?:from|price|rate|fee)\s*:?\s*[€£$]\s*[\d,.]+/i,
    /"price"\s*:\s*"?([€£$]?\s*[\d,.]+)"?/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return m[0].replace(/"price"\s*:\s*"?/i, '').replace(/"$/, '').trim()
  }
  return ''
}

function cleanTitle(title, html) {
  const siteName = extractMeta(html, 'site_name')
  let clean = title
  // Remove " | Site Name", " - Site Name", " — Site Name"
  if (siteName && clean.includes(siteName)) {
    clean = clean.replace(new RegExp(`\\s*[|\\-–—]\\s*${siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '')
  }
  clean = clean.replace(/\s*[|–—-]\s*(Official\s*(Site|Website)|Home|Welcome).*$/i, '').trim()
  // Remove leading "Welcome to " etc
  clean = clean.replace(/^(Welcome\s+to\s+)/i, '').trim()
  return clean
}

// Build the best possible location string for geocoding
function buildLocationQuery(address, title, url) {
  // If we have a schema.org address, use it directly
  if (address) return address

  // Try to extract location hints from the title or URL
  const parts = []

  // Check if title contains a known Irish place
  const irishPlaces = [
    'Dublin', 'Galway', 'Cork', 'Limerick', 'Kerry', 'Clare', 'Doolin',
    'Lahinch', 'Ballybunion', 'Kinsale', 'Dingle', 'Killarney', 'Ennis',
    'Westport', 'Kilkenny', 'Waterford', 'Sligo', 'Donegal', 'Belfast',
    'Portrush', 'Newcastle', 'Howth', 'Malahide', 'Portmarnock', 'Liscannor',
    'Waterville', 'Kenmare', 'Cobh', 'Adare', 'Dromoland', 'Ashford',
    'Connemara', 'Aran', 'Cliffs of Moher', 'Ring of Kerry', 'Doonbeg',
    'Tralee', 'Kilkee', 'Clifden', 'Athlone', 'Trim', 'Cashel',
  ]
  for (const place of irishPlaces) {
    if (title.toLowerCase().includes(place.toLowerCase())) {
      parts.push(place)
      break
    }
  }

  // Extract from domain name
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    const domain = hostname.split('.')[0]
    // If domain looks like a place name, add it
    if (domain.length > 3 && !['golf', 'hotel', 'book', 'trip', 'visit'].includes(domain)) {
      parts.push(domain)
    }
  } catch (e) {}

  if (parts.length > 0) {
    return parts.join(' ') + ', Ireland'
  }

  return title + ', Ireland'
}

export async function parseScrapedData(html, url) {
  const rawTitle = extractTitle(html)
  const title = cleanTitle(rawTitle, html)
  const description = extractDescription(html)
  const address = extractAddress(html)
  const price = extractPrice(html)
  const siteName = extractMeta(html, 'site_name')

  // 1. Try to get coords from the HTML itself
  let coords = extractCoordinates(html)

  // 2. Build location string
  const locationQuery = buildLocationQuery(address, title, url)
  let location = address || ''

  // 3. If no coords from HTML, geocode using the best location string we have
  if (!coords.lat || !coords.lng) {
    const geoResult = await geocode(locationQuery)
    coords = { lat: geoResult.lat, lng: geoResult.lng }
    // Use the geocoded display name as location if we didn't have one
    if (!location && geoResult.displayName) {
      // Shorten the display name: take first 2-3 meaningful parts
      const nameParts = geoResult.displayName.split(',').map(s => s.trim())
      location = nameParts.slice(0, 3).join(', ')
    }
  }

  // 4. If still no location string, try from title
  if (!location) {
    location = locationQuery
  }

  return {
    title,
    description: description.substring(0, 300),
    location,
    lat: coords.lat,
    lng: coords.lng,
    price,
    url,
    siteName,
  }
}

export function useUrlScraper() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const scrapeUrl = async (url) => {
    setLoading(true)
    setError(null)
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Please enter an http or https URL')
      }

      const html = await fetchWithProxy(url)
      const data = await parseScrapedData(html, url)

      if (!data.title) {
        throw new Error('Could not extract info from that page. Try a different URL or enter details manually.')
      }

      setLoading(false)
      return data
    } catch (err) {
      const msg = err.message || 'Failed to fetch URL'
      setError(msg)
      setLoading(false)
      throw err
    }
  }

  return { scrapeUrl, loading, error }
}
