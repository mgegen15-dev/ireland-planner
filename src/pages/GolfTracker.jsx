import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { defaultGolfCourses } from '../data/golfCourses'
import {
  Flag, Plus, ExternalLink, Edit3, Trash2, Save, X,
  CheckCircle2, Clock, Heart, Sparkles
} from 'lucide-react'
import UrlImport from '../components/UrlImport'

const STATUS_CONFIG = {
  wishlist: { label: 'Wishlist', color: 'bg-stone-100 text-stone-600', icon: Heart },
  booked: { label: 'Booked', color: 'bg-warm-100 text-warm-700', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-irish-100 text-irish-700', icon: CheckCircle2 },
}

export default function GolfTracker() {
  const [courses, setCourses] = useLocalStorage('ireland-golf', defaultGolfCourses)
  const [editingId, setEditingId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')

  const addCourse = (course) => {
    setCourses([...courses, { ...course, id: `golf${Date.now()}` }])
    setShowAdd(false)
  }

  const addCourseFromUrl = (scrapedData) => {
    const newCourse = {
      id: `golf${Date.now()}`,
      name: scrapedData.title || 'New Course',
      location: scrapedData.location || '',
      lat: scrapedData.lat || null,
      lng: scrapedData.lng || null,
      greenFee: scrapedData.price || '',
      website: scrapedData.url || '',
      notes: scrapedData.description || '',
      bookingStatus: 'wishlist',
      teeTimeNotes: '',
    }
    setCourses([...courses, newCourse])
  }

  const updateCourse = (id, updates) => {
    setCourses(courses.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const removeCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id))
  }

  const filtered = filter === 'all' ? courses : courses.filter(c => c.bookingStatus === filter)

  const totalFees = courses.reduce((sum, c) => {
    const num = parseFloat(String(c.greenFee).replace(/[^0-9.]/g, ''))
    return sum + (isNaN(num) ? 0 : num)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Flag className="text-irish-600" size={24} /> Golf Courses
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {courses.length} courses · Est. total green fees: €{totalFees.toLocaleString()}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Course
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'wishlist', 'booked', 'confirmed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === f ? 'bg-irish-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
          >
            {f === 'all' ? 'All' : STATUS_CONFIG[f].label}
            {f !== 'all' && ` (${courses.filter(c => c.bookingStatus === f).length})`}
          </button>
        ))}
      </div>

      {/* URL Auto-Import */}
      <div className="card bg-emerald-50 border-emerald-200">
        <p className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-1.5">
          <Sparkles size={14} /> Quick Add — Paste a golf course website URL
        </p>
        <UrlImport
          onData={addCourseFromUrl}
          placeholder="e.g. https://www.lahinchgolf.com"
        />
      </div>

      {/* Add form */}
      {showAdd && (
        <CourseForm
          onSave={addCourse}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Course list */}
      <div className="grid gap-4">
        {filtered.map(course => (
          editingId === course.id ? (
            <CourseForm
              key={course.id}
              initial={course}
              onSave={(updates) => { updateCourse(course.id, updates); setEditingId(null) }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={() => setEditingId(course.id)}
              onRemove={() => removeCourse(course.id)}
              onStatusChange={(status) => updateCourse(course.id, { bookingStatus: status })}
            />
          )
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-stone-400">
          <Flag className="mx-auto mb-2" size={32} />
          <p>No courses match this filter</p>
        </div>
      )}
    </div>
  )
}

function CourseCard({ course, onEdit, onRemove, onStatusChange }) {
  const status = STATUS_CONFIG[course.bookingStatus] || STATUS_CONFIG.wishlist
  const StatusIcon = status.icon

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-stone-800">{course.name}</h3>
            <span className={`badge ${status.color} flex items-center gap-1`}>
              <StatusIcon size={12} /> {status.label}
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-1">{course.location}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="font-medium text-irish-700">{course.greenFee}</span>
            {course.website && (
              <a href={course.website} target="_blank" rel="noopener noreferrer"
                className="text-irish-600 hover:underline flex items-center gap-1">
                <ExternalLink size={12} /> Website
              </a>
            )}
          </div>
          {course.notes && <p className="text-sm text-stone-500 mt-2">{course.notes}</p>}
          {course.teeTimeNotes && (
            <p className="text-sm text-warm-600 mt-1 flex items-center gap-1">
              <Clock size={12} /> {course.teeTimeNotes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={course.bookingStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="text-sm border border-stone-200 rounded-lg px-2 py-1.5"
          >
            <option value="wishlist">Wishlist</option>
            <option value="booked">Booked</option>
            <option value="confirmed">Confirmed</option>
          </select>
          <button onClick={onEdit} className="text-stone-400 hover:text-irish-600 p-1">
            <Edit3 size={16} />
          </button>
          <button onClick={onRemove} className="text-stone-400 hover:text-red-500 p-1">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function CourseForm({ initial, onSave, onCancel }) {
  const [draft, setDraft] = useState(initial || {
    name: '', location: '', lat: '', lng: '',
    greenFee: '', website: '', notes: '',
    bookingStatus: 'wishlist', teeTimeNotes: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...draft,
      lat: draft.lat ? parseFloat(draft.lat) : null,
      lng: draft.lng ? parseFloat(draft.lng) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card bg-irish-50 border-irish-200">
      <h3 className="font-semibold text-stone-700 mb-3">
        {initial ? 'Edit Course' : 'Add New Course'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-stone-500">Course Name *</label>
          <input className="input-field" required value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Location</label>
          <input className="input-field" value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Green Fee</label>
          <input className="input-field" placeholder="e.g. €250" value={draft.greenFee}
            onChange={(e) => setDraft({ ...draft, greenFee: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Website</label>
          <input className="input-field" type="url" value={draft.website}
            onChange={(e) => setDraft({ ...draft, website: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Status</label>
          <select className="input-field" value={draft.bookingStatus}
            onChange={(e) => setDraft({ ...draft, bookingStatus: e.target.value })}>
            <option value="wishlist">Wishlist</option>
            <option value="booked">Booked</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Latitude</label>
          <input type="number" step="any" className="input-field" value={draft.lat || ''}
            onChange={(e) => setDraft({ ...draft, lat: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Longitude</label>
          <input type="number" step="any" className="input-field" value={draft.lng || ''}
            onChange={(e) => setDraft({ ...draft, lng: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-stone-500">Tee Time Notes</label>
          <input className="input-field" placeholder="e.g. Requested 8:30 AM"
            value={draft.teeTimeNotes}
            onChange={(e) => setDraft({ ...draft, teeTimeNotes: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-stone-500">Notes</label>
          <textarea className="input-field" rows={2} value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
        <button type="submit" className="btn-primary text-sm">
          {initial ? 'Save' : 'Add Course'}
        </button>
      </div>
    </form>
  )
}
