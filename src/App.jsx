import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Itinerary from './pages/Itinerary'
import GolfTracker from './pages/GolfTracker'
import CliffsOfMoher from './pages/CliffsOfMoher'
import DublinGuide from './pages/DublinGuide'
import BudgetTracker from './pages/BudgetTracker'
import PackingList from './pages/PackingList'
import MapView from './pages/MapView'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="itinerary" element={<Itinerary />} />
        <Route path="golf" element={<GolfTracker />} />
        <Route path="cliffs" element={<CliffsOfMoher />} />
        <Route path="dublin" element={<DublinGuide />} />
        <Route path="budget" element={<BudgetTracker />} />
        <Route path="packing" element={<PackingList />} />
        <Route path="map" element={<MapView />} />
      </Route>
    </Routes>
  )
}
