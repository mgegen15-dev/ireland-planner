import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { defaultItinerary } from '../data/defaultItinerary'
import { defaultBudget } from '../data/budgetCategories'
import { defaultGolfCourses } from '../data/golfCourses'
import { defaultPackingList } from '../data/packingList'
import {
  Calendar, Flag, Mountain, Building2, DollarSign,
  CheckSquare, Map, Plane, Clock
} from 'lucide-react'
import ExportPDF from '../components/ExportPDF'

export default function Dashboard() {
  const [itinerary] = useLocalStorage('ireland-itinerary', defaultItinerary)
  const [budget] = useLocalStorage('ireland-budget', defaultBudget)
  const [golfCourses] = useLocalStorage('ireland-golf', defaultGolfCourses)
  const [packingList] = useLocalStorage('ireland-packing', defaultPackingList)
  const [tripDate] = useLocalStorage('ireland-trip-date', '')

  const stats = useMemo(() => {
    const totalActivities = itinerary.reduce((sum, day) => sum + day.activities.length, 0)
    const totalEstimated = budget.categories.reduce((sum, c) => sum + Number(c.estimated || 0), 0)
    const totalActual = budget.categories.reduce((sum, c) => sum + Number(c.actual || 0), 0)
    const bookedCourses = golfCourses.filter(c => c.bookingStatus === 'confirmed').length
    const packedItems = packingList.filter(i => i.checked).length

    let daysUntil = null
    if (tripDate) {
      const diff = new Date(tripDate) - new Date()
      daysUntil = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    return {
      totalDays: itinerary.length,
      totalActivities,
      totalEstimated,
      totalActual,
      bookedCourses,
      totalCourses: golfCourses.length,
      packedItems,
      totalPackingItems: packingList.length,
      daysUntil,
      perPerson: budget.travelers > 0 ? totalEstimated / budget.travelers : 0,
    }
  }, [itinerary, budget, golfCourses, packingList, tripDate])

  const nextActivity = useMemo(() => {
    for (const day of itinerary) {
      if (day.activities.length > 0) {
        return { day: day.label, activity: day.activities[0] }
      }
    }
    return null
  }, [itinerary])

  const quickLinks = [
    { to: '/itinerary', icon: Calendar, label: 'Itinerary', color: 'bg-irish-600' },
    { to: '/golf', icon: Flag, label: 'Golf', color: 'bg-emerald-600' },
    { to: '/cliffs', icon: Mountain, label: 'Cliffs', color: 'bg-sky-600' },
    { to: '/dublin', icon: Building2, label: 'Dublin', color: 'bg-violet-600' },
    { to: '/budget', icon: DollarSign, label: 'Budget', color: 'bg-warm-600' },
    { to: '/packing', icon: CheckSquare, label: 'Packing', color: 'bg-rose-600' },
    { to: '/map', icon: Map, label: 'Map', color: 'bg-teal-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">
            ☘️ Ireland Family Trip
          </h1>
          <p className="text-stone-500 mt-1">Your trip at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <TripDatePicker />
          <ExportPDF />
        </div>
      </div>

      {/* Countdown & Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Plane className="text-irish-600" size={20} />}
          label="Days Until Trip"
          value={stats.daysUntil !== null ? stats.daysUntil : '—'}
          sub={stats.daysUntil === 0 ? "Today!" : stats.daysUntil !== null ? "days to go" : "Set departure date"}
        />
        <StatCard
          icon={<Calendar className="text-warm-600" size={20} />}
          label="Itinerary"
          value={stats.totalActivities}
          sub={`across ${stats.totalDays} days`}
        />
        <StatCard
          icon={<DollarSign className="text-emerald-600" size={20} />}
          label="Budget"
          value={`€${stats.totalEstimated.toLocaleString()}`}
          sub={`€${Math.round(stats.perPerson).toLocaleString()} per person`}
        />
        <StatCard
          icon={<CheckSquare className="text-rose-600" size={20} />}
          label="Packing"
          value={`${stats.packedItems}/${stats.totalPackingItems}`}
          sub="items packed"
        />
      </div>

      {/* Next Activity & Golf */}
      <div className="grid md:grid-cols-2 gap-4">
        {nextActivity && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-irish-600" />
              <h3 className="font-semibold text-stone-700">Next Up</h3>
            </div>
            <p className="text-lg font-medium">{nextActivity.activity.title}</p>
            <p className="text-stone-500 text-sm">{nextActivity.day}</p>
            {nextActivity.activity.time && (
              <p className="text-stone-400 text-sm mt-1">{nextActivity.activity.time} · {nextActivity.activity.location}</p>
            )}
            <Link to="/itinerary" className="text-irish-600 text-sm font-medium mt-3 inline-block hover:underline">
              View full itinerary →
            </Link>
          </div>
        )}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Flag size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-stone-700">Golf Status</h3>
          </div>
          <p className="text-lg font-medium">{stats.bookedCourses} confirmed</p>
          <p className="text-stone-500 text-sm">{stats.totalCourses} courses on the list</p>
          <Link to="/golf" className="text-irish-600 text-sm font-medium mt-3 inline-block hover:underline">
            Manage golf plans →
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="font-semibold text-stone-700 mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {quickLinks.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className="card flex flex-col items-center gap-2 py-4 hover:shadow-md transition-shadow group"
            >
              <div className={`${color} text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
              <span className="text-sm font-medium text-stone-600">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      <p className="text-sm text-stone-400 mt-0.5">{sub}</p>
    </div>
  )
}

function TripDatePicker() {
  const [tripDate, setTripDate] = useLocalStorage('ireland-trip-date', '')

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-stone-500">Departure:</label>
      <input
        type="date"
        value={tripDate}
        onChange={(e) => setTripDate(e.target.value)}
        className="input-field w-auto text-sm"
      />
    </div>
  )
}
