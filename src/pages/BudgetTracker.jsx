import { useLocalStorage } from '../hooks/useLocalStorage'
import { defaultBudget } from '../data/budgetCategories'
import { DollarSign, Users, TrendingUp, Plus, Trash2 } from 'lucide-react'

export default function BudgetTracker() {
  const [budget, setBudget] = useLocalStorage('ireland-budget', defaultBudget)

  const updateCategory = (id, field, value) => {
    setBudget({
      ...budget,
      categories: budget.categories.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    })
  }

  const addCategory = () => {
    setBudget({
      ...budget,
      categories: [
        ...budget.categories,
        { id: `cat${Date.now()}`, name: 'New Category', estimated: 0, actual: 0, notes: '' },
      ],
    })
  }

  const removeCategory = (id) => {
    setBudget({
      ...budget,
      categories: budget.categories.filter(c => c.id !== id),
    })
  }

  const totalEstimated = budget.categories.reduce((s, c) => s + Number(c.estimated || 0), 0)
  const totalActual = budget.categories.reduce((s, c) => s + Number(c.actual || 0), 0)
  const perPersonEst = budget.travelers > 0 ? totalEstimated / budget.travelers : 0
  const perPersonAct = budget.travelers > 0 ? totalActual / budget.travelers : 0
  const remaining = totalEstimated - totalActual

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <DollarSign className="text-warm-600" size={24} /> Budget Tracker
          </h1>
          <p className="text-stone-500 text-sm mt-1">Track estimated vs actual trip costs</p>
        </div>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-stone-400" />
          <label className="text-sm text-stone-500">Travelers:</label>
          <input
            type="number"
            min="1"
            className="w-16 input-field text-center"
            value={budget.travelers}
            onChange={(e) => setBudget({ ...budget, travelers: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Estimated Total"
          value={`€${totalEstimated.toLocaleString()}`}
          sub={`€${Math.round(perPersonEst).toLocaleString()} / person`}
          color="text-irish-700"
        />
        <SummaryCard
          label="Actual Spent"
          value={`€${totalActual.toLocaleString()}`}
          sub={`€${Math.round(perPersonAct).toLocaleString()} / person`}
          color="text-warm-600"
        />
        <SummaryCard
          label="Remaining"
          value={`€${remaining.toLocaleString()}`}
          sub={remaining >= 0 ? 'under budget' : 'over budget'}
          color={remaining >= 0 ? 'text-irish-600' : 'text-red-600'}
        />
        <SummaryCard
          label="Categories"
          value={budget.categories.length}
          sub="tracked"
          color="text-stone-600"
        />
      </div>

      {/* Budget Bar */}
      {totalEstimated > 0 && (
        <div className="card">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-stone-500">Budget utilization</span>
            <span className="font-medium">{Math.round((totalActual / totalEstimated) * 100)}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                totalActual > totalEstimated ? 'bg-red-500' : 'bg-irish-500'
              }`}
              style={{ width: `${Math.min(100, (totalActual / totalEstimated) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Category Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="text-left py-2 pr-4 text-stone-500 font-medium">Category</th>
              <th className="text-right py-2 px-4 text-stone-500 font-medium w-32">Estimated (€)</th>
              <th className="text-right py-2 px-4 text-stone-500 font-medium w-32">Actual (€)</th>
              <th className="text-left py-2 px-4 text-stone-500 font-medium">Notes</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {budget.categories.map(cat => (
              <tr key={cat.id} className="border-b border-stone-50 hover:bg-stone-50">
                <td className="py-2 pr-4">
                  <input
                    className="font-medium text-stone-800 bg-transparent border-none outline-none w-full"
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, 'name', e.target.value)}
                  />
                </td>
                <td className="py-2 px-4">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border border-stone-200 rounded px-2 py-1 focus:ring-1 focus:ring-irish-400 outline-none"
                    value={cat.estimated}
                    onChange={(e) => updateCategory(cat.id, 'estimated', e.target.value)}
                  />
                </td>
                <td className="py-2 px-4">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border border-stone-200 rounded px-2 py-1 focus:ring-1 focus:ring-irish-400 outline-none"
                    value={cat.actual}
                    onChange={(e) => updateCategory(cat.id, 'actual', e.target.value)}
                  />
                </td>
                <td className="py-2 px-4">
                  <input
                    className="w-full text-stone-500 bg-transparent border-none outline-none"
                    placeholder="Add notes..."
                    value={cat.notes}
                    onChange={(e) => updateCategory(cat.id, 'notes', e.target.value)}
                  />
                </td>
                <td className="py-2">
                  <button onClick={() => removeCategory(cat.id)}
                    className="text-stone-300 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-stone-200 font-semibold">
              <td className="py-3 pr-4 text-stone-800">Total</td>
              <td className="py-3 px-4 text-right text-irish-700">€{totalEstimated.toLocaleString()}</td>
              <td className="py-3 px-4 text-right text-warm-600">€{totalActual.toLocaleString()}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>

        <button
          onClick={addCategory}
          className="mt-3 text-sm text-irish-600 hover:text-irish-700 flex items-center gap-1"
        >
          <Plus size={14} /> Add Category
        </button>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
    </div>
  )
}
