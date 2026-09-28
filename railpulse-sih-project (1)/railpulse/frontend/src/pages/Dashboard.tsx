import { useEffect, useState } from 'react'
import { Activity, CheckCircle2, AlertTriangle, Clock3, Target } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { SearchBar } from '../components/SearchBar'
import { StatCard } from '../components/StatCard'
import { LiveTrainsTable } from '../components/LiveTrainsTable'
import { api } from '../services/api'
import type { DashboardStats, LiveTrainSummary } from '../types'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trains, setTrains] = useState<LiveTrainSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  async function loadAll(q?: string) {
    const [statsRes, trainsRes] = await Promise.all([api.getAnalytics(), api.listTrains(q)])
    setStats(statsRes)
    setTrains(trainsRes)
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
    const interval = setInterval(() => loadAll(query), 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => {
      api.listTrains(query || undefined).then(setTrains)
    }, 250)
    return () => clearTimeout(handle)
  }, [query])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Live Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Real-time (simulated) status of all tracked coaching trains.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Active Trains" value={stats?.active_trains ?? '—'} icon={Activity} />
          <StatCard label="On Time" value={stats ? `${stats.on_time_pct.toFixed(0)}` : '—'} suffix="%" icon={CheckCircle2} tone="good" />
          <StatCard label="Delayed" value={stats ? `${stats.delayed_pct.toFixed(0)}` : '—'} suffix="%" icon={AlertTriangle} tone="warn" />
          <StatCard label="Avg Delay" value={stats ? stats.average_delay_minutes.toFixed(0) : '—'} suffix="min" icon={Clock3} />
          <StatCard label="Prediction Accuracy" value={stats ? stats.prediction_accuracy_pct.toFixed(1) : '—'} suffix="%" icon={Target} tone="good" />
        </div>

        <div className="mb-4">
          <SearchBar onSearch={setQuery} />
        </div>

        <h2 className="mb-3 text-lg font-bold text-slate-900">Live Trains</h2>
        <LiveTrainsTable trains={trains} loading={loading} />
      </main>
    </div>
  )
}
