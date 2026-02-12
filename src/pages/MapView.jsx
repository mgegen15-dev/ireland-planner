import { useMemo, useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { geocodeMissing } from '../hooks/useGeocode'
import { defaultItinerary } from '../data/defaultItinerary'
import { defaultGolfCourses } from '../data/golfCourses'
import { defaultDublinItems } from '../data/dublinGuide'
import { Map, Flag, Calendar, Building2, Loader2, RefreshCw } from 'lucide-react'

// Fix default Leaflet icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createColorIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 24px; height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  })
}

const icons = {
  itinerary: createColorIcon('#16a34a'),
  golf: createColorIcon('#059669'),
  dublin: createColorIcon('#7c3aed'),
  cliffs: createColorIcon('#0284c7'),
}

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [map, positions])
  return null
}

export default function MapView() {
  const [itinerary, setItinerary] = useLocalStorage('ireland-itinerary', defaultItinerary)
  const [golfCourses, setGolfCourses] = useLocalStorage('ireland-golf', defaultGolfCourses)
  const [dublinItems, setDublinItems] = useLocalStorage('ireland-dublin', defaultDublinItems)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeCount, setGeocodeCount] = useState(0)
  const ranOnce = useRef(false)

  // Collect items that have a name but no coordinates
  const collectMissing = useCallback(() => {
    const missing = []

    itinerary.forEach(day => {
      day.activities.forEach(act => {
        if ((!act.lat || !act.lng) && (act.title || act.location)) {
          missing.push({
            id: act.id,
            name: act.title,
            location: act.location || act.title,
            source: 'itinerary',
          })
        }
      })
    })

    golfCourses.forEach(course => {
      if ((!course.lat || !course.lng) && (course.name || course.location)) {
        missing.push({
          id: course.id,
          name: course.name,
          location: course.location || course.name,
          source: 'golf',
        })
      }
    })

    dublinItems.forEach(item => {
      if ((!item.lat || !item.lng) && item.name) {
        missing.push({
          id: item.id,
          name: item.name,
          location: item.name + ', Dublin, Ireland',
          source: 'dublin',
        })
      }
    })

    return missing
  }, [itinerary, golfCourses, dublinItems])

  // Geocode everything missing and write coords back to localStorage
  const runGeocode = useCallback(async () => {
    const missing = collectMissing()
    if (missing.length === 0) return

    setGeocoding(true)
    setGeocodeCount(missing.length)

    try {
      const updates = await geocodeMissing(missing)
      const ids = Object.keys(updates)
      if (ids.length === 0) { setGeocoding(false); return }

      // Write back to itinerary activities
      setItinerary(prev => prev.map(day => ({
        ...day,
        activities: day.activities.map(act => {
          const u = updates[act.id]
          if (u) return { ...act, lat: u.lat, lng: u.lng, location: act.location || u.location }
          return act
        })
      })))

      // Write back to golf courses
      setGolfCourses(prev => prev.map(course => {
        const u = updates[course.id]
        if (u) return { ...course, lat: u.lat, lng: u.lng, location: course.location || u.location }
        return course
      }))

      // Write back to dublin items
      setDublinItems(prev => prev.map(item => {
        const u = updates[item.id]
        if (u) return { ...item, lat: u.lat, lng: u.lng }
        return item
      }))
    } catch (e) {
      console.warn('Geocoding error:', e)
    }

    setGeocoding(false)
  }, [collectMissing, setItinerary, setGolfCourses, setDublinItems])

  // Auto-geocode on first load
  useEffect(() => {
    if (!ranOnce.current) {
      ranOnce.current = true
      runGeocode()
    }
  }, [runGeocode])

  // Build markers from all data sources
  const markers = useMemo(() => {
    const result = []

    itinerary.forEach(day => {
      day.activities.forEach(act => {
        if (act.lat && act.lng) {
          result.push({
            id: `itin-${act.id}`,
            lat: act.lat, lng: act.lng,
            title: act.title,
            sub: `${day.label}${act.time ? ' · ' + act.time : ''}`,
            type: 'itinerary',
          })
        }
      })
    })

    golfCourses.forEach(course => {
      if (course.lat && course.lng) {
        result.push({
          id: `golf-${course.id}`,
          lat: course.lat, lng: course.lng,
          title: course.name,
          sub: `${course.location || ''}${course.greenFee ? ' · ' + course.greenFee : ''}`,
          type: 'golf',
        })
      }
    })

    dublinItems.forEach(item => {
      if (item.lat && item.lng) {
        result.push({
          id: `dub-${item.id}`,
          lat: item.lat, lng: item.lng,
          title: item.name,
          sub: item.category,
          type: 'dublin',
        })
      }
    })

    result.push({
      id: 'cliffs', lat: 52.9715, lng: -9.4309,
      title: 'Cliffs of Moher', sub: 'Must-see landmark', type: 'cliffs',
    })

    return result
  }, [itinerary, golfCourses, dublinItems])

  const routePositions = useMemo(() => {
    const positions = []
    itinerary.forEach(day => {
      day.activities.forEach(act => {
        if (act.lat && act.lng) positions.push([act.lat, act.lng])
      })
    })
    return positions
  }, [itinerary])

  const allPositions = markers.map(m => [m.lat, m.lng])
  const center = allPositions.length > 0
    ? [
        allPositions.reduce((s, p) => s + p[0], 0) / allPositions.length,
        allPositions.reduce((s, p) => s + p[1], 0) / allPositions.length,
      ]
    : [53.35, -7.5]

  const missingCount = collectMissing().length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Map className="text-teal-600" size={24} /> Trip Map
          </h1>
          <p className="text-stone-500 text-sm mt-1">{markers.length} locations pinned</p>
        </div>
        <div className="flex items-center gap-3">
          {geocoding && (
            <span className="text-sm text-irish-600 flex items-center gap-1.5 animate-pulse">
              <Loader2 size={14} className="animate-spin" />
              Locating {geocodeCount} places...
            </span>
          )}
          {!geocoding && missingCount > 0 && (
            <button onClick={runGeocode} className="btn-secondary text-sm flex items-center gap-1.5">
              <RefreshCw size={14} /> Locate {missingCount} missing
            </button>
          )}
          {!geocoding && missingCount === 0 && markers.length > 1 && (
            <span className="text-sm text-irish-600">All locations mapped ✓</span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-irish-600" />
          <Calendar size={14} /> Itinerary
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600" />
          <Flag size={14} /> Golf
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-violet-600" />
          <Building2 size={14} /> Dublin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-600" />
          Cliffs
        </span>
      </div>

      {/* Map */}
      <div className="card p-0 overflow-hidden" style={{ height: 'calc(100vh - 240px)', minHeight: '400px' }}>
        <MapContainer
          center={center}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {allPositions.length > 0 && <FitBounds positions={allPositions} />}

          {markers.map(marker => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={icons[marker.type] || icons.itinerary}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{marker.title}</p>
                  <p className="text-stone-500">{marker.sub}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {routePositions.length > 1 && (
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#16a34a',
                weight: 3,
                opacity: 0.7,
                dashArray: '10 6',
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  )
}
