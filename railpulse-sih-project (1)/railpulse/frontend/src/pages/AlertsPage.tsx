import { useEffect, useState } from 'react'
import { BellRing, TrainFront } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { api } from '../services/api'
import type { AlertOut } from '../types'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMyAlerts().then(setAlerts).finally(() => setLoading(false))
    const t = setInterval(() => api.getMyAlerts().then(setAlerts).catch(() => {}), 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <BellRing className="text-rail-700" size={22} />
          <h1 className="text-2xl font-extrabold text-slate-900">Your Alerts</h1>
        </div>

        {loading && <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />}

        {!loading && alerts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            <TrainFront className="mx-auto mb-3 text-slate-300" size={28} />
            No alerts yet. Subscribe to a train from its details page to get notified when its ETA changes.
          </div>
        )}

        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-rail-50 px-2.5 py-1 text-xs font-semibold capitalize text-rail-700">
                  {a.alert_type.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{a.message}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
