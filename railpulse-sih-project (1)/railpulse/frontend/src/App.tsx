import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TrainDetailsPage from './pages/TrainDetails'
import LiveMapPage from './pages/LiveMapPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AdminPage from './pages/AdminPage'
import AlertsPage from './pages/AlertsPage'
import HowItWorks from './pages/HowItWorks'
import NotFound from './pages/NotFound'
import { ProtectedRoute } from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/trains/:trainNumber" element={<TrainDetailsPage />} />
      <Route path="/live-map" element={<LiveMapPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
