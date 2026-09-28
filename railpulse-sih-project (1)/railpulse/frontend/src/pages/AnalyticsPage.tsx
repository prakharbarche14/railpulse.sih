import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, CheckCircle2, AlertTriangle, Clock3, Target } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { StatCard } from '../components/StatCard'
import { api } from '../services/api'
import type { DashboardStats } from '../types'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    api.getAnalytics().then(setStats)
    const t = setInterval(() => api.getAnalytics().then(setStats), 10000)
    return () => clearInterval(t)
  }, [])

  const breakdown = stats
    ? [
        { name: 'On Time', value: stats.on_time_pct },
        { name: 'Delayed', value: stats.delayed_pct },
      ]
    : []

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Analytics</h1>
        <p className="mb-6 text-sm text-slate-500">System-wide punctuality and prediction performance across all tracked trains.</p>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Active Trains" value={stats?.active_trains ?? '—'} icon={Activity} />
          <StatCard label="On Time" value={stats ? stats.on_time_pct.toFixed(0) : '—'} suffix="%" icon={CheckCircle2} tone="good" />
          <StatCard label="Delayed" value={stats ? stats.delayed_pct.toFixed(0) : '—'} suffix="%" icon={AlertTriangle} tone="warn" />
          <StatCard label="Avg Delay" value={stats ? stats.average_delay_minutes.toFixed(0) : '—'} suffix="min" icon={Clock3} />
          <StatCard label="Prediction Accuracy" value={stats ? stats.prediction_accuracy_pct.toFixed(1) : '—'} suffix="%" icon={Target} tone="good" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 font-bold text-slate-900">On-Time vs Delayed</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis unit="%" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#1a4d78" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-rail-100 bg-gradient-to-br from-rail-50 to-white p-5 shadow-soft">
            <h3 className="mb-3 font-bold text-slate-900">Traditional ETA vs RailPulse ETA</h3>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-white p-3.5 ring-1 ring-slate-100">
                <div className="text-xs font-semibold uppercase text-slate-400">Traditional ETA</div>
                <div className="mt-1 text-slate-600">Static schedule + current delay only.</div>
              </div>
              <div className="rounded-xl bg-rail-800 p-3.5 text-white">
                <div className="text-xs font-semibold uppercase text-rail-200">RailPulse ETA</div>
                <div className="mt-1">Current position + speed + historical patterns + delay trend + station dwell + route conditions.</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
