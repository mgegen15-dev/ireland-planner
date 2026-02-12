import { useLocalStorage } from '../hooks/useLocalStorage'
import { Mountain, Clock, MapPin, Utensils, Car, StickyNote, ExternalLink } from 'lucide-react'

const defaultCliffs = {
  visitDate: '',
  visitTime: 'morning',
  estimatedDuration: '2-3 hours',
  directions: 'From Dublin: ~3 hours via M18/N85 to Liscannor. From Galway: ~1.5 hours via N67 coastal route (scenic) or N18/M18 (faster). From Limerick: ~2 hours via N18 to Ennis then N85.',
  bestTime: 'Early morning (before 10 AM) for fewer crowds and better light for photos. Late afternoon also good. Avoid midday in peak season (June-Aug). Check weather forecast — clear days offer views to Aran Islands.',
  parkingNotes: 'Official visitor centre parking: €8 per car. Arrive early in summer. Free overflow parking sometimes available along R478.',
  notes: '',
  restaurants: [
    { id: 'r1', name: "Gus O'Connor's Pub", type: 'pub', location: 'Doolin (10 min drive)', notes: 'Traditional music sessions. Great fish & chips.' },
    { id: 'r2', name: "McGann's Pub", type: 'pub', location: 'Doolin', notes: 'Cozy traditional pub. Good seafood chowder.' },
    { id: 'r3', name: "Fitzpatrick's Bar", type: 'pub', location: 'Doolin', notes: 'Live music nightly.' },
    { id: 'r4', name: 'The Cliffs of Moher Visitor Centre Café', type: 'cafe', location: 'At the cliffs', notes: 'Convenient but busy. Basic lunch options.' },
    { id: 'r5', name: 'Vaughan\'s Anchor Inn', type: 'restaurant', location: 'Liscannor (5 min)', notes: 'Excellent seafood. Book ahead.' },
    { id: 'r6', name: 'Barrtra Seafood Restaurant', type: 'restaurant', location: 'Lahinch Road', notes: 'Fine dining seafood. Reservation recommended.' },
  ],
}

export default function CliffsOfMoher() {
  const [data, setData] = useLocalStorage('ireland-cliffs', defaultCliffs)

  const update = (field, value) => {
    setData({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Mountain className="text-sky-600" size={24} /> Cliffs of Moher
        </h1>
        <p className="text-stone-500 text-sm mt-1">Plan your visit to one of Ireland's most iconic landmarks</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Visit Details */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-stone-700 flex items-center gap-2 mb-3">
              <Clock size={16} className="text-warm-600" /> Visit Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-500">Visit Date</label>
                <input type="date" className="input-field" value={data.visitDate}
                  onChange={(e) => update('visitDate', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500">Best Time</label>
                <select className="input-field" value={data.visitTime}
                  onChange={(e) => update('visitTime', e.target.value)}>
                  <option value="morning">Early Morning (before 10 AM)</option>
                  <option value="midday">Midday</option>
                  <option value="afternoon">Late Afternoon</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500">Estimated Duration</label>
                <input className="input-field" value={data.estimatedDuration}
                  onChange={(e) => update('estimatedDuration', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-stone-700 flex items-center gap-2 mb-3">
              <Car size={16} className="text-irish-600" /> Getting There
            </h3>
            <textarea className="input-field text-sm" rows={4} value={data.directions}
              onChange={(e) => update('directions', e.target.value)} />
          </div>

          <div className="card">
            <h3 className="font-semibold text-stone-700 flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-rose-500" /> Parking
            </h3>
            <textarea className="input-field text-sm" rows={2} value={data.parkingNotes}
              onChange={(e) => update('parkingNotes', e.target.value)} />
          </div>

          <div className="card bg-sky-50 border-sky-200">
            <h3 className="font-semibold text-stone-700 flex items-center gap-2 mb-3">
              <Clock size={16} className="text-sky-600" /> Tips
            </h3>
            <p className="text-sm text-stone-600">{data.bestTime}</p>
          </div>
        </div>

        {/* Nearby Food & Notes */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-stone-700 flex items-center gap-2 mb-3">
              <Utensils size={16} className="text-warm-600" /> Nearby Restaurants & Pubs
            </h3>
            <div className="space-y-3">
              {data.restaurants.map(r => (
                <div key={r.id} className="border border-stone-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-stone-800">{r.name}</span>
                    <span className={`badge text-xs ${
                      r.type === 'pub' ? 'bg-warm-100 text-warm-700' :
                      r.type === 'cafe' ? 'bg-sky-100 text-sky-700' :
                      'bg-irish-100 text-irish-700'
                    }`}>{r.type}</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">{r.location}</p>
                  {r.notes && <p className="text-xs text-stone-500 mt-1">{r.notes}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-stone-700 flex items-center gap-2 mb-3">
              <StickyNote size={16} className="text-warm-500" /> Personal Notes
            </h3>
            <textarea
              className="input-field"
              rows={5}
              placeholder="Add your own notes about the Cliffs visit..."
              value={data.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>

          <div className="card bg-irish-50 border-irish-200">
            <h3 className="font-semibold text-irish-800 mb-2">Quick Facts</h3>
            <ul className="text-sm text-stone-600 space-y-1">
              <li>• Height: 214 meters (702 ft) at highest point</li>
              <li>• Stretches 14 km along Atlantic coast</li>
              <li>• Visitor Centre entry: ~€8 adults (includes parking)</li>
              <li>• O'Brien's Tower: small additional fee for panoramic views</li>
              <li>• GPS: 52.9715° N, 9.4309° W</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
