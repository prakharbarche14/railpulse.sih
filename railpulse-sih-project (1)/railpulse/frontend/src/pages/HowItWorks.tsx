import { Navbar } from '../components/Navbar'
import { Radio, Cpu, Sparkles, Gauge, TrendingUp, Users, ArrowDown } from 'lucide-react'

const FLOW = [
  { icon: Radio, label: 'Train Position Data', desc: 'Simulated telemetry: GPS coordinates, speed, section — updated every ~8 seconds.' },
  { icon: Gauge, label: 'Data Processing', desc: 'Freshness, distance-to-station, and delay are computed from the raw position stream.' },
  { icon: Cpu, label: 'Feature Extraction', desc: 'Speed trend, historical section delay, dwell time, day/hour context are assembled.' },
  { icon: TrendingUp, label: 'ETA Prediction Engine', desc: 'A transparent rule-based model (swappable for XGBoost/LSTM) estimates remaining travel time.' },
  { icon: Sparkles, label: 'Confidence Calculation', desc: 'Every prediction is scored High/Medium/Low based on data quality and route volatility.' },
  { icon: ArrowDown, label: 'Dynamic ETA', desc: 'Optimistic, expected, and pessimistic arrival times are published for every upcoming station.' },
  { icon: Users, label: 'Passenger / Control Room', desc: 'Delivered live via WebSocket to the dashboard, live map, and alert subscriptions.' },
]

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-center text-3xl font-extrabold text-slate-900">How RailPulse Works</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-500">
          From a simulated GPS ping to a passenger-facing ETA — the full pipeline, step by step.
        </p>

        <div className="mt-12 space-y-4">
          {FLOW.map(({ icon: Icon, label, desc }, i) => (
            <div key={label} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rail-800 text-white">
                  <Icon size={18} />
                </span>
                {i < FLOW.length - 1 && <span className="my-1 h-8 w-0.5 bg-slate-200" />}
              </div>
              <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="font-bold text-slate-900">{label}</div>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase text-slate-400">Traditional ETA</div>
            <p className="mt-2 text-sm text-slate-600">Static schedule + current delay only. Doesn't adapt as conditions change en route.</p>
          </div>
          <div className="rounded-2xl border border-rail-100 bg-rail-800 p-5 text-white">
            <div className="text-xs font-semibold uppercase text-rail-200">RailPulse ETA</div>
            <p className="mt-2 text-sm">Current position + speed + historical patterns + delay trend + station dwell + route conditions — recalculated continuously.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
