import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Gauge, Clock3, MapPin, BellPlus, BellOff, RefreshCcw, Wifi, WifiOff } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { RouteTimeline } from '../components/RouteTimeline'
import { LiveMapView } from '../components/LiveMapView'
import { ETAChart } from '../components/ETAChart'
import { DelayTrendChart } from '../components/DelayTrendChart'
import { WhyETAChanged } from '../components/WhyETAChanged'
import { DemoBadge } from '../components/DemoBadge'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useTrainSocket } from '../hooks/useTrainSocket'
import type { TrainDetail } from '../types'

const STATUS_LABEL: Record<string, { text: string; dot: string }> = {
  running: { text: 'Running', dot: 'bg-emerald-500' },
  halted: { text: 'Halted', dot: 'bg-amber-500' },
  arrived: { text: 'Arrived', dot: 'bg-slate-400' },
  not_started: { text: 'Not started', dot: 'bg-slate-300' },
}

export default function TrainDetailsPage() {
  const { trainNumber = '' } = useParams()
  const { user } = useAuthStore()
  const [detail, setDetail] = useState<TrainDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [delayHistory, setDelayHistory] = useState<number[]>([])
  const { lastUpdate, connected } = useTrainSocket(trainNumber || null)

  async function load() {
    try {
      const data = await api.getTrain(trainNumber)
      setDetail(data)
      setSecondsAgo(data.position?.seconds_ago ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load train')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainNumber])

  useEffect(() => {
    fetch(`/api/trains/${trainNumber}/predictions?limit=10`)
      .then((r) => r.json())
      .then((rows: { delay_minutes: number }[]) => setDelayHistory(rows.map((r) => r.delay_minutes).reverse()))
      .catch(() => {})
  }, [trainNumber])

  // Merge live WebSocket updates into local state.
  useEffect(() => {
    if (!lastUpdate || !detail) return
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            position: { ...prev.position!, ...lastUpdate.position, seconds_ago: 0 },
            route: lastUpdate.route.length ? lastUpdate.route : prev.route,
            eta: lastUpdate.next_station_eta ? [lastUpdate.next_station_eta, ...prev.eta.slice(1)] : prev.eta,
          }
        : prev,
    )
    setSecondsAgo(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdate])

  useEffect(() => {
    const t = setInterval(() => setSecondsAgo((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  async function toggleSubscribe() {
    if (!user) return
    if (subscribed) {
      await api.unsubscribe(trainNumber)
      setSubscribed(false)
    } else {
      await api.subscribe(trainNumber)
      setSubscribed(true)
    }
  }

  const nextEta = useMemo(() => detail?.eta[0] ?? null, [detail])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-lg font-semibold text-rose-600">{error}</p>
          <p className="mt-2 text-sm text-slate-500">Double-check the train number and try again.</p>
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    )
  }

  const status = STATUS_LABEL[detail.position?.status ?? 'not_started']

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <DemoBadge />
              <span className="flex items-center gap-1">
                {connected ? <Wifi size={13} className="text-emerald-500" /> : <WifiOff size={13} className="text-slate-400" />}
                {connected ? 'Live' : 'Reconnecting…'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              {detail.train.train_number} — {detail.train.train_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} /> {status.text}
              </span>
              {detail.position && (
                <>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-rail-500" />
                    {detail.position.last_station_code} → {detail.position.next_station_code}
                  </span>
                  <span className="flex items-center gap-1.5"><Gauge size={14} className="text-rail-500" />{detail.position.speed_kmh.toFixed(0)} km/h</span>
                  <span className="flex items-center gap-1.5"><Clock3 size={14} className="text-rail-500" />+{detail.position.current_delay_minutes.toFixed(0)} min delay</span>
                  <span className="flex items-center gap-1.5 text-slate-400"><RefreshCcw size={12} /> Last updated {secondsAgo}s ago</span>
                </>
              )}
            </div>
          </div>

          {user && (
            <button
              onClick={toggleSubscribe}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                subscribed ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-rail-800 text-white hover:bg-rail-700'
              }`}
            >
              {subscribed ? <BellOff size={16} /> : <BellPlus size={16} />}
              {subscribed ? 'Unsubscribe' : 'Subscribe to alerts'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900">Live Map</h2>
              <LiveMapView stops={detail.route} position={detail.position} />
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900">Scheduled vs Predicted Arrival</h2>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <ETAChart eta={detail.eta} />
              </div>
            </div>

            {delayHistory.length > 1 && (
              <div>
                <h2 className="mb-3 text-lg font-bold text-slate-900">Delay Trend</h2>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <DelayTrendChart points={delayHistory} />
                </div>
              </div>
            )}

            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900">Route Timeline</h2>
              <RouteTimeline stops={detail.route} />
            </div>
          </div>

          <div className="space-y-6">
            <WhyETAChanged eta={nextEta} />

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="font-bold text-slate-900">Upcoming Stations</h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {detail.eta.map((e) => (
                  <li key={e.station_code} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <div className="font-semibold text-slate-800">{e.station_name}</div>
                      <div className="text-xs text-slate-400">Sched {e.scheduled_arrival ?? '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold tabular-nums text-rail-700">{e.predicted_arrival}</div>
                      <div className={`text-xs font-semibold ${e.delay_minutes > 15 ? 'text-rose-600' : e.delay_minutes > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {e.delay_minutes > 0 ? '+' : ''}{e.delay_minutes.toFixed(0)} min
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
