import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ShieldCheck, Database, Cpu, Signal } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { StatCard } from '../components/StatCard'
import { api } from '../services/api'
import type { AdminMetrics } from '../types'

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getAdminMetrics().then(setMetrics).catch((e) => setError(e.message))
    const t = setInterval(() => api.getAdminMetrics().then(setMetrics).catch(() => {}), 15000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheck className="text-rail-700" size={22} />
          <h1 className="text-2xl font-extrabold text-slate-900">Admin Analytics</h1>
        </div>

        {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

        {metrics && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Tracked Trains" value={metrics.total_tracked_trains} icon={Database} />
              <StatCard label="Active Predictions" value={metrics.active_predictions} icon={Cpu} />
              <StatCard label="Avg Delay" value={metrics.average_delay_minutes.toFixed(0)} suffix="min" icon={Signal} />
              <StatCard label="ETA Accuracy" value={metrics.eta_accuracy_pct.toFixed(1)} suffix="%" icon={ShieldCheck} tone="good" />
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="text-xs font-semibold uppercase text-slate-400">Mean Absolute Error</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">{metrics.mean_absolute_error.toFixed(1)} min</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="text-xs font-semibold uppercase text-slate-400">RMSE</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">{metrics.rmse.toFixed(1)} min</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="text-xs font-semibold uppercase text-slate-400">Data Freshness</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">{metrics.data_freshness_seconds.toFixed(0)}s</div>
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Model Performance Over Time</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{metrics.model_version}</span>
              </div>
              <p className="mb-4 text-xs text-slate-400">Backtested on simulated demo data — not yet measured against live arrivals.</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.performance_over_time} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="mae" name="MAE (min)" stroke="#ff7a1a" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="rmse" name="RMSE (min)" stroke="#1a4d78" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="accuracy_pct" name="Accuracy %" stroke="#12b1a6" strokeWidth={2} strokeDasharray="4 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-soft">
              <div className="border-b border-slate-100 p-5">
                <h3 className="font-bold text-slate-900">Recent Predictions</h3>
                <p className="mt-0.5 text-xs text-slate-400">{metrics.api_status}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3">Train</th>
                      <th className="px-5 py-3">Station</th>
                      <th className="px-5 py-3">Predicted Arrival</th>
                      <th className="px-5 py-3">Actual Arrival</th>
                      <th className="px-5 py-3">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recent_predictions.map((p, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-800">{p.train_number}</td>
                        <td className="px-5 py-3 text-slate-600">{p.station_name}</td>
                        <td className="px-5 py-3 tabular-nums text-slate-700">{p.predicted_arrival}</td>
                        <td className="px-5 py-3 tabular-nums text-slate-500">{p.actual_arrival ?? 'Pending'}</td>
                        <td className="px-5 py-3 tabular-nums text-slate-500">{p.error_minutes != null ? `${p.error_minutes.toFixed(1)} min` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
