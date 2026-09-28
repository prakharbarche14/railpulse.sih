import { useEffect, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { LiveMapView } from '../components/LiveMapView'
import { useTrainSocket } from '../hooks/useTrainSocket'
import { api } from '../services/api'
import type { LiveTrainSummary, TrainDetail } from '../types'
import { Gauge, Clock3 } from 'lucide-react'

export default function LiveMapPage() {
  const [trains, setTrains] = useState<LiveTrainSummary[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<TrainDetail | null>(null)
  const { lastUpdate } = useTrainSocket(selected)

  useEffect(() => {
    api.listTrains().then((res) => {
      setTrains(res)
      if (res.length && !selected) setSelected(res[0].train_number)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selected) return
    api.getTrain(selected).then(setDetail)
  }, [selected])

  useEffect(() => {
    if (!lastUpdate || !detail) return
    setDetail((prev) =>
      prev
        ? { ...prev, position: { ...prev.position!, ...lastUpdate.position, seconds_ago: 0 }, route: lastUpdate.route.length ? lastUpdate.route : prev.route }
        : prev,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdate])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Live Map</h1>
        <p className="mb-6 text-sm text-slate-500">Select a train to watch its simulated live position and route.</p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-soft">
              <ul className="divide-y divide-slate-100">
                {trains.map((t) => (
                  <li key={t.train_number}>
                    <button
                      onClick={() => setSelected(t.train_number)}
                      className={`w-full px-4 py-3 text-left transition ${selected === t.train_number ? 'bg-rail-800 text-white' : 'hover:bg-slate-50'}`}
                    >
                      <div className="font-bold">{t.train_number}</div>
                      <div className={`text-xs ${selected === t.train_number ? 'text-rail-200' : 'text-slate-400'}`}>{t.train_name}</div>
                      <div className={`mt-1 flex items-center gap-3 text-xs ${selected === t.train_number ? 'text-rail-100' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-1"><Gauge size={12} />{t.speed_kmh.toFixed(0)} km/h</span>
                        <span className="flex items-center gap-1"><Clock3 size={12} />+{t.delay_minutes.toFixed(0)}m</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            {detail ? (
              <LiveMapView stops={detail.route} position={detail.position} heightClass="h-[600px]" />
            ) : (
              <div className="flex h-[600px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">Loading map…</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
