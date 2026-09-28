import { NavLink } from 'react-router-dom'
import {
  TrainFront, Radar, TrendingDown, Gauge, BellRing, LineChart,
  ArrowRight, Play, MapPin,
} from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { DemoBadge } from '../components/DemoBadge'

const FEATURES = [
  { icon: Gauge, title: 'Dynamic ETA', desc: 'Predictions recompute continuously from live speed, position, and delay trend — not just a static timetable.' },
  { icon: Radar, title: 'Live Train Tracking', desc: 'Watch every coaching train move along its route on an interactive map, updated in real time.' },
  { icon: TrendingDown, title: 'Delay Prediction', desc: 'Forecasts delay at every upcoming station, with optimistic and pessimistic bounds.' },
  { icon: LineChart, title: 'Confidence Scoring', desc: 'Every prediction is scored for reliability based on data freshness and route volatility.' },
  { icon: BellRing, title: 'Intelligent Alerts', desc: 'Subscribe to a train and get notified the moment its ETA meaningfully changes.' },
  { icon: MapPin, title: 'Analytics', desc: 'Control-room-grade dashboards track model accuracy, MAE/RMSE, and system health.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-b from-rail-950 via-rail-900 to-rail-800 text-white">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
          <div className="mb-6 flex justify-center"><DemoBadge /></div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Know When Your Train<br className="hidden sm:block" /> Will <span className="text-rail-accent">Actually</span> Arrive.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-rail-200">
            AI-powered dynamic ETA forecasting for India's coaching trains — built for Smart India Hackathon PS 028.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <NavLink to="/dashboard" className="flex items-center gap-2 rounded-xl bg-rail-accent px-6 py-3.5 font-bold text-white shadow-glow transition hover:brightness-110">
              Track a Train <ArrowRight size={18} />
            </NavLink>
            <NavLink to="/dashboard" className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/10">
              <Play size={16} /> View Live Demo
            </NavLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">Built for the way Indian Railways actually runs</h2>
          <p className="mt-3 text-slate-500">Every prediction is explainable, every score is calibrated, and every update happens without a page refresh.</p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rail-800 text-white">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-rail-950 p-10 text-center text-white sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rail-accent"><TrainFront size={22} /></span>
              <div>
                <div className="text-lg font-bold">Ready to see it live?</div>
                <div className="text-sm text-rail-300">Explore the dashboard with 5 running demo trains.</div>
              </div>
            </div>
            <NavLink to="/dashboard" className="rounded-xl bg-white px-6 py-3 font-bold text-rail-900 transition hover:bg-rail-100">
              Open Dashboard
            </NavLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-8 text-center text-xs text-slate-400">
        RailPulse — a Smart India Hackathon PS 028 prototype. Uses simulated demo data; not affiliated with Indian Railways.
      </footer>
    </div>
  )
}
