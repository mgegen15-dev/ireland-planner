import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { defaultDublinItems } from '../data/dublinGuide'
import {
  Building2, Plus, Edit3, Trash2, Star, Clock,
  Utensils, Camera, Music, ShoppingBag, Save, X, Sparkles
} from 'lucide-react'
import UrlImport from '../components/UrlImport'

const CATEGORY_CONFIG = {
  food: { label: 'Food & Drink', icon: Utensils, color: 'bg-warm-100 text-warm-700' },
  sightseeing: { label: 'Sightseeing', icon: Camera, color: 'bg-sky-100 text-sky-700' },
  nightlife: { label: 'Nightlife', icon: Music, color: 'bg-violet-100 text-violet-700' },
  shopping: { label: 'Shopping', icon: ShoppingBag, color: 'bg-rose-100 text-rose-700' },
}

const PRIORITY_CONFIG = {
  'must-do': { label: 'Must-Do', icon: Star, color: 'text-warm-500' },
  'if-time': { label: 'If We Have Time', icon: Clock, color: 'text-stone-400' },
}

export default function DublinGuide() {
  const [items, setItems] = useLocalStorage('ireland-dublin', defaultDublinItems)
  const [editingId, setEditingId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [filterPri, setFilterPri] = useState('all')

  const addItem = (item) => {
    setItems([...items, { ...item, id: `dub${Date.now()}` }])
    setShowAdd(false)
  }

  const addItemFromUrl = (scrapedData) => {
    // Try to guess category from scraped data
    const text = (scrapedData.title + ' ' + scrapedData.description).toLowerCase()
    let category = 'sightseeing'
    if (text.match(/restaurant|food|eat|dining|bistro|cafe|brunch/)) category = 'food'
    else if (text.match(/pub|bar|nightlife|club|cocktail|music|live/)) category = 'nightlife'
    else if (text.match(/shop|store|market|boutique|mall/)) category = 'shopping'

    const newItem = {
      id: `dub${Date.now()}`,
      name: scrapedData.title || 'New Spot',
      category,
      priority: 'must-do',
      notes: scrapedData.description || '',
      lat: scrapedData.lat || null,
      lng: scrapedData.lng || null,
      url: scrapedData.url || '',
    }
    setItems([...items, newItem])
  }

  const updateItem = (id, updates) => {
    setItems(items.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id))
  }

  const filtered = items.filter(i => {
    if (filterCat !== 'all' && i.category !== filterCat) return false
    if (filterPri !== 'all' && i.priority !== filterPri) return false
    return true
  })

  const mustDos = filtered.filter(i => i.priority === 'must-do')
  const ifTime = filtered.filter(i => i.priority === 'if-time')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="text-violet-600" size={24} /> Dublin Guide
          </h1>
          <p className="text-stone-500 text-sm mt-1">{items.length} spots saved</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Spot
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium text-stone-400 uppercase">Category:</span>
          {['all', 'food', 'sightseeing', 'nightlife', 'shopping'].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                ${filterCat === c ? 'bg-irish-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
              {c === 'all' ? 'All' : CATEGORY_CONFIG[c].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium text-stone-400 uppercase">Priority:</span>
          {['all', 'must-do', 'if-time'].map(p => (
            <button key={p} onClick={() => setFilterPri(p)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                ${filterPri === p ? 'bg-irish-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
              {p === 'all' ? 'All' : PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      {/* URL Auto-Import */}
      <div className="card bg-violet-50 border-violet-200">
        <p className="text-sm font-medium text-violet-800 mb-2 flex items-center gap-1.5">
          <Sparkles size={14} /> Quick Add — Paste a restaurant, pub, or attraction URL
        </p>
        <UrlImport
          onData={addItemFromUrl}
          placeholder="e.g. https://www.guinness-storehouse.com"
        />
      </div>

      {showAdd && (
        <DublinItemForm onSave={addItem} onCancel={() => setShowAdd(false)} />
      )}

      {/* Must-Do Section */}
      {mustDos.length > 0 && (
        <div>
          <h2 className="font-semibold text-stone-700 flex items-center gap-2 mb-3">
            <Star size={16} className="text-warm-500" /> Must-Do ({mustDos.length})
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {mustDos.map(item =>
              editingId === item.id ? (
                <DublinItemForm
                  key={item.id}
                  initial={item}
                  onSave={(updates) => { updateItem(item.id, updates); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <DublinCard
                  key={item.id}
                  item={item}
                  onEdit={() => setEditingId(item.id)}
                  onRemove={() => removeItem(item.id)}
                  onTogglePriority={() => updateItem(item.id, { priority: item.priority === 'must-do' ? 'if-time' : 'must-do' })}
                />
              )
            )}
          </div>
        </div>
      )}

      {/* If We Have Time */}
      {ifTime.length > 0 && (
        <div>
          <h2 className="font-semibold text-stone-700 flex items-center gap-2 mb-3">
            <Clock size={16} className="text-stone-400" /> If We Have Time ({ifTime.length})
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {ifTime.map(item =>
              editingId === item.id ? (
                <DublinItemForm
                  key={item.id}
                  initial={item}
                  onSave={(updates) => { updateItem(item.id, updates); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <DublinCard
                  key={item.id}
                  item={item}
                  onEdit={() => setEditingId(item.id)}
                  onRemove={() => removeItem(item.id)}
                  onTogglePriority={() => updateItem(item.id, { priority: item.priority === 'must-do' ? 'if-time' : 'must-do' })}
                />
              )
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-8 text-stone-400">
          <Building2 className="mx-auto mb-2" size={32} />
          <p>No spots match your filters</p>
        </div>
      )}
    </div>
  )
}

function DublinCard({ item, onEdit, onRemove, onTogglePriority }) {
  const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.sightseeing
  const CatIcon = cat.icon
  const pri = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG['if-time']
  const PriIcon = pri.icon

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-stone-800 text-sm">{item.name}</h3>
            <span className={`badge ${cat.color} flex items-center gap-1`}>
              <CatIcon size={10} /> {cat.label}
            </span>
          </div>
          {item.notes && <p className="text-xs text-stone-500 mt-2">{item.notes}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onTogglePriority} className={`p-1 ${pri.color} hover:text-warm-500`} title="Toggle priority">
            <PriIcon size={16} />
          </button>
          <button onClick={onEdit} className="text-stone-400 hover:text-irish-600 p-1">
            <Edit3 size={14} />
          </button>
          <button onClick={onRemove} className="text-stone-400 hover:text-red-500 p-1">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function DublinItemForm({ initial, onSave, onCancel }) {
  const [draft, setDraft] = useState(initial || {
    name: '', category: 'sightseeing', priority: 'must-do',
    notes: '', lat: '', lng: '',
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
    <form onSubmit={handleSubmit} className="card bg-violet-50 border-violet-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-stone-500">Name *</label>
          <input className="input-field" required value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Category</label>
          <select className="input-field" value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            <option value="food">Food & Drink</option>
            <option value="sightseeing">Sightseeing</option>
            <option value="nightlife">Nightlife</option>
            <option value="shopping">Shopping</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Priority</label>
          <select className="input-field" value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
            <option value="must-do">Must-Do</option>
            <option value="if-time">If We Have Time</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-stone-500">Notes</label>
          <textarea className="input-field" rows={2} value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
        <button type="submit" className="btn-primary text-sm">{initial ? 'Save' : 'Add'}</button>
      </div>
    </form>
  )
}
