import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  Home, Calendar, Flag, Mountain, Building2, DollarSign,
  CheckSquare, Map, Menu, X
} from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/itinerary', icon: Calendar, label: 'Itinerary' },
  { to: '/golf', icon: Flag, label: 'Golf' },
  { to: '/cliffs', icon: Mountain, label: 'Cliffs of Moher' },
  { to: '/dublin', icon: Building2, label: 'Dublin' },
  { to: '/budget', icon: DollarSign, label: 'Budget' },
  { to: '/packing', icon: CheckSquare, label: 'Packing' },
  { to: '/map', icon: Map, label: 'Map' },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile header */}
      <header className="lg:hidden bg-irish-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☘️</span>
          <h1 className="font-bold text-lg">Ireland Trip</h1>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <nav className={`
        ${mobileOpen ? 'block' : 'hidden'} lg:block
        lg:w-60 bg-irish-800 text-white lg:min-h-screen lg:sticky lg:top-0
        z-40 lg:z-auto
      `}>
        <div className="hidden lg:flex items-center gap-3 px-5 py-5 border-b border-irish-700">
          <span className="text-3xl">☘️</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">Ireland</h1>
            <p className="text-irish-300 text-sm">Family Trip Planner</p>
          </div>
        </div>
        <ul className="py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-irish-700 text-white border-r-4 border-warm-400'
                    : 'text-irish-200 hover:bg-irish-700/50 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content */}
      <main className="flex-1 lg:max-h-screen lg:overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
