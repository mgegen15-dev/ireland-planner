import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { defaultPackingList } from '../data/packingList'
import { CheckSquare, Plus, Trash2, Check, Square, Package } from 'lucide-react'

export default function PackingList() {
  const [items, setItems] = useLocalStorage('ireland-packing', defaultPackingList)
  const [newItem, setNewItem] = useState('')
  const [newCategory, setNewCategory] = useState('Essentials')
  const [filterCat, setFilterCat] = useState('all')

  const toggleItem = (id) => {
    setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  const addItem = (e) => {
    e.preventDefault()
    if (!newItem.trim()) return
    setItems([...items, {
      id: `p${Date.now()}`,
      item: newItem.trim(),
      category: newCategory,
      checked: false,
    }])
    setNewItem('')
  }

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id))
  }

  const categories = [...new Set(items.map(i => i.category))].sort()
  const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat)
  const grouped = categories.reduce((acc, cat) => {
    const catItems = filtered.filter(i => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {})

  const totalChecked = items.filter(i => i.checked).length
  const totalItems = items.length
  const progress = totalItems > 0 ? (totalChecked / totalItems) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <CheckSquare className="text-rose-600" size={24} /> Packing List
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {totalChecked} of {totalItems} items packed
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-stone-500">Packing progress</span>
          <span className="font-medium text-irish-700">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-irish-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add item */}
      <form onSubmit={addItem} className="card flex flex-col sm:flex-row gap-3">
        <input
          className="input-field flex-1"
          placeholder="Add an item..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <select
          className="input-field sm:w-40"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="Other">Other</option>
        </select>
        <button type="submit" className="btn-primary flex items-center gap-1">
          <Plus size={16} /> Add
        </button>
      </form>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
            ${filterCat === 'all' ? 'bg-irish-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
          All
        </button>
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filterCat === c ? 'bg-irish-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Grouped items */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, catItems]) => {
          const catChecked = catItems.filter(i => i.checked).length
          return (
            <div key={category} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-stone-700 flex items-center gap-2">
                  <Package size={16} className="text-irish-600" />
                  {category}
                </h3>
                <span className="text-xs text-stone-400">{catChecked}/{catItems.length}</span>
              </div>
              <div className="space-y-1">
                {catItems.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-stone-50 group
                      ${item.checked ? 'opacity-60' : ''}`}
                  >
                    <button onClick={() => toggleItem(item.id)} className="shrink-0">
                      {item.checked
                        ? <Check size={18} className="text-irish-600" />
                        : <Square size={18} className="text-stone-300" />
                      }
                    </button>
                    <span className={`flex-1 text-sm ${item.checked ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                      {item.item}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-stone-400">
          <CheckSquare className="mx-auto mb-2" size={32} />
          <p>No items match this filter</p>
        </div>
      )}
    </div>
  )
}
