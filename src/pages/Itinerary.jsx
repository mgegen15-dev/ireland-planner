import { useState, useCallback } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { defaultItinerary } from '../data/defaultItinerary'
import {
  Plus, GripVertical, Trash2, Edit3, ChevronDown, ChevronRight,
  Clock, MapPin, Car, Save, X, Link2
} from 'lucide-react'
import UrlImport from '../components/UrlImport'

export default function Itinerary() {
  const [itinerary, setItinerary] = useLocalStorage('ireland-itinerary', defaultItinerary)
  const [expandedDays, setExpandedDays] = useState(() => new Set(itinerary.map(d => d.id)))
  const [editingActivity, setEditingActivity] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [activeDayId, setActiveDayId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const toggleDay = (dayId) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      next.has(dayId) ? next.delete(dayId) : next.add(dayId)
      return next
    })
  }

  const addDay = () => {
    const newDay = {
      id: `day${Date.now()}`,
      date: '',
      label: `Day ${itinerary.length + 1}`,
      activities: [],
    }
    setItinerary([...itinerary, newDay])
    setExpandedDays(prev => new Set([...prev, newDay.id]))
  }

  const removeDay = (dayId) => {
    setItinerary(itinerary.filter(d => d.id !== dayId))
  }

  const updateDayLabel = (dayId, label) => {
    setItinerary(itinerary.map(d => d.id === dayId ? { ...d, label } : d))
  }

  const updateDayDate = (dayId, date) => {
    setItinerary(itinerary.map(d => d.id === dayId ? { ...d, date } : d))
  }

  const addActivity = (dayId, prefill = {}) => {
    const newAct = {
      id: `act${Date.now()}`,
      title: prefill.title || 'New Activity',
      time: prefill.time || '',
      duration: prefill.duration || '',
      location: prefill.location || '',
      lat: prefill.lat || null,
      lng: prefill.lng || null,
      notes: prefill.notes || '',
      travelTimeToNext: '',
      url: prefill.url || '',
    }
    setItinerary(itinerary.map(d =>
      d.id === dayId ? { ...d, activities: [...d.activities, newAct] } : d
    ))
    setEditingActivity(newAct.id)
  }

  const addActivityFromUrl = (dayId, scrapedData) => {
    addActivity(dayId, {
      title: scrapedData.title || 'New Activity',
      location: scrapedData.location || '',
      lat: scrapedData.lat,
      lng: scrapedData.lng,
      notes: scrapedData.description || '',
      url: scrapedData.url || '',
    })
  }

  const removeActivity = (dayId, actId) => {
    setItinerary(itinerary.map(d =>
      d.id === dayId
        ? { ...d, activities: d.activities.filter(a => a.id !== actId) }
        : d
    ))
  }

  const updateActivity = (dayId, actId, updates) => {
    setItinerary(itinerary.map(d =>
      d.id === dayId
        ? { ...d, activities: d.activities.map(a => a.id === actId ? { ...a, ...updates } : a) }
        : d
    ))
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
    // Find which day contains this activity
    for (const day of itinerary) {
      if (day.activities.some(a => a.id === event.active.id)) {
        setActiveDayId(day.id)
        break
      }
    }
  }

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    setActiveId(null)
    setActiveDayId(null)

    if (!over || active.id === over.id) return

    // Find the day containing active item
    const dayIdx = itinerary.findIndex(d =>
      d.activities.some(a => a.id === active.id)
    )
    if (dayIdx === -1) return

    const day = itinerary[dayIdx]
    const oldIndex = day.activities.findIndex(a => a.id === active.id)
    const newIndex = day.activities.findIndex(a => a.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newActivities = arrayMove(day.activities, oldIndex, newIndex)
    setItinerary(itinerary.map((d, i) =>
      i === dayIdx ? { ...d, activities: newActivities } : d
    ))
  }, [itinerary, setItinerary])

  const activeActivity = activeId
    ? itinerary.flatMap(d => d.activities).find(a => a.id === activeId)
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Itinerary</h1>
          <p className="text-stone-500 text-sm mt-1">Drag activities to reorder. Click to edit.</p>
        </div>
        <button onClick={addDay} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Day
        </button>
      </div>

      <div className="space-y-4">
        {itinerary.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            expanded={expandedDays.has(day.id)}
            onToggle={() => toggleDay(day.id)}
            onRemove={() => removeDay(day.id)}
            onUpdateLabel={(label) => updateDayLabel(day.id, label)}
            onUpdateDate={(date) => updateDayDate(day.id, date)}
            onAddActivity={() => addActivity(day.id)}
            onAddActivityFromUrl={(data) => addActivityFromUrl(day.id, data)}
            onRemoveActivity={(actId) => removeActivity(day.id, actId)}
            onUpdateActivity={(actId, updates) => updateActivity(day.id, actId, updates)}
            editingActivity={editingActivity}
            setEditingActivity={setEditingActivity}
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            activeActivity={activeActivity}
          />
        ))}
      </div>

      {itinerary.length === 0 && (
        <div className="text-center py-12 text-stone-400">
          <Calendar className="mx-auto mb-3" size={40} />
          <p className="text-lg">No days planned yet</p>
          <p className="text-sm">Click "Add Day" to start building your itinerary</p>
        </div>
      )}
    </div>
  )
}

function DayCard({
  day, expanded, onToggle, onRemove, onUpdateLabel, onUpdateDate,
  onAddActivity, onAddActivityFromUrl, onRemoveActivity, onUpdateActivity,
  editingActivity, setEditingActivity, sensors, onDragStart, onDragEnd, activeActivity
}) {
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(day.label)

  return (
    <div className="card">
      {/* Day Header */}
      <div className="flex items-center gap-3">
        <button onClick={onToggle} className="text-stone-400 hover:text-stone-600">
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        <div className="flex-1 min-w-0">
          {editingLabel ? (
            <div className="flex items-center gap-2">
              <input
                className="input-field text-sm"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdateLabel(labelDraft)
                    setEditingLabel(false)
                  }
                }}
                autoFocus
              />
              <button onClick={() => { onUpdateLabel(labelDraft); setEditingLabel(false) }}
                className="text-irish-600"><Save size={16} /></button>
              <button onClick={() => setEditingLabel(false)}
                className="text-stone-400"><X size={16} /></button>
            </div>
          ) : (
            <h3 className="font-semibold text-stone-800 cursor-pointer hover:text-irish-700"
                onClick={() => { setLabelDraft(day.label); setEditingLabel(true) }}>
              {day.label}
            </h3>
          )}
        </div>
        <input
          type="date"
          value={day.date || ''}
          onChange={(e) => onUpdateDate(e.target.value)}
          className="text-sm border border-stone-200 rounded px-2 py-1 text-stone-500"
        />
        <span className="text-xs text-stone-400">{day.activities.length} activities</span>
        <button onClick={onRemove} className="text-stone-300 hover:text-red-500 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Activities */}
      {expanded && (
        <div className="mt-4 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={day.activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
              {day.activities.map((activity, idx) => (
                <div key={activity.id}>
                  <SortableActivity
                    activity={activity}
                    isEditing={editingActivity === activity.id}
                    onEdit={() => setEditingActivity(activity.id)}
                    onCancelEdit={() => setEditingActivity(null)}
                    onUpdate={(updates) => onUpdateActivity(activity.id, updates)}
                    onRemove={() => onRemoveActivity(activity.id)}
                  />
                  {activity.travelTimeToNext && idx < day.activities.length - 1 && (
                    <div className="flex items-center gap-2 py-1 pl-10 text-xs text-stone-400">
                      <Car size={12} />
                      <span>{activity.travelTimeToNext} drive</span>
                      <div className="flex-1 border-t border-dashed border-stone-200" />
                    </div>
                  )}
                </div>
              ))}
            </SortableContext>
            <DragOverlay>
              {activeActivity ? (
                <div className="drag-overlay card py-3 px-4 bg-irish-50 border-irish-200">
                  <p className="font-medium text-sm">{activeActivity.title}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* URL Auto-Import */}
          <div className="mt-3 mb-2">
            <UrlImport
              onData={onAddActivityFromUrl}
              placeholder="Paste a URL to auto-add an activity (restaurant, attraction, etc.)..."
            />
          </div>

          <button
            onClick={onAddActivity}
            className="w-full py-2 border-2 border-dashed border-stone-200 rounded-lg text-stone-400 text-sm
              hover:border-irish-400 hover:text-irish-600 transition-colors flex items-center justify-center gap-1 mt-2"
          >
            <Plus size={14} /> Add Activity Manually
          </button>
        </div>
      )}
    </div>
  )
}

function SortableActivity({ activity, isEditing, onEdit, onCancelEdit, onUpdate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const [draft, setDraft] = useState(activity)

  const handleSave = () => {
    onUpdate(draft)
    onCancelEdit()
  }

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="bg-irish-50 rounded-lg p-4 border border-irish-200">
        {/* URL Auto-Fill within edit form */}
        <div className="mb-3">
          <UrlImport
            onData={(data) => {
              setDraft(prev => ({
                ...prev,
                title: data.title || prev.title,
                location: data.location || prev.location,
                lat: data.lat ?? prev.lat,
                lng: data.lng ?? prev.lng,
                notes: data.description || prev.notes,
                url: data.url || prev.url,
              }))
            }}
            placeholder="Paste URL to auto-fill fields..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-stone-500">Title</label>
            <input className="input-field" value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">Time</label>
            <input type="time" className="input-field" value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">Duration</label>
            <input className="input-field" placeholder="e.g. 2h" value={draft.duration}
              onChange={(e) => setDraft({ ...draft, duration: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">Location</label>
            <input className="input-field" value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">Travel to Next</label>
            <input className="input-field" placeholder="e.g. 30 min" value={draft.travelTimeToNext}
              onChange={(e) => setDraft({ ...draft, travelTimeToNext: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">Latitude</label>
            <input type="number" step="any" className="input-field" value={draft.lat || ''}
              onChange={(e) => setDraft({ ...draft, lat: e.target.value ? parseFloat(e.target.value) : null })} />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">Longitude</label>
            <input type="number" step="any" className="input-field" value={draft.lng || ''}
              onChange={(e) => setDraft({ ...draft, lng: e.target.value ? parseFloat(e.target.value) : null })} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-stone-500">Notes</label>
            <textarea className="input-field" rows={2} value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onCancelEdit} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSave} className="btn-primary text-sm">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-stone-50 group"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-stone-300 hover:text-stone-500 touch-none">
        <GripVertical size={16} />
      </button>
      <div className="flex-1 min-w-0" onClick={onEdit}>
        <div className="flex items-center gap-2 cursor-pointer">
          {activity.time && (
            <span className="text-xs font-mono text-stone-400 flex items-center gap-1">
              <Clock size={12} /> {activity.time}
            </span>
          )}
          <span className="font-medium text-sm text-stone-800">{activity.title}</span>
          {activity.duration && (
            <span className="badge bg-stone-100 text-stone-500">{activity.duration}</span>
          )}
        </div>
        {activity.location && (
          <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> {activity.location}
          </p>
        )}
        {activity.url && (
          <a href={activity.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-irish-500 mt-0.5 flex items-center gap-1 hover:underline">
            <Link2 size={10} /> Source
          </a>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="text-stone-400 hover:text-irish-600 p-1">
          <Edit3 size={14} />
        </button>
        <button onClick={onRemove} className="text-stone-400 hover:text-red-500 p-1">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
