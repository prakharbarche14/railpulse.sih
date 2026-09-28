import { useNavigate } from 'react-router-dom'
import { Gauge, Clock, ArrowRight } from 'lucide-react'
import type { LiveTrainSummary } from '../types'
import { ConfidenceBadge } from './ConfidenceBadge'

const STATUS_STYLES: Record<string, string> = {
  running: 'bg-emerald-100 text-emerald-700',
  halted: 'bg-amber-100 text-amber-700',
  arrived: 'bg-slate-200 text-slate-600',
  not_started: 'bg-slate-100 text-slate-500',
}

export function LiveTrainsTable({ trains, loading }: { trains: LiveTrainSummary[]; loading?: boolean }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (trains.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        No trains match your search. Try a train number, name, or station.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-soft">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3">Train</th>
            <th className="px-4 py-3">Current Location</th>
            <th className="px-4 py-3">Speed</th>
            <th className="px-4 py-3">Delay</th>
            <th className="px-4 py-3">Next Station</th>
            <th className="px-4 py-3">Predicted ETA</th>
            <th className="px-4 py-3">Confidence</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {trains.map((t) => (
            <tr
              key={t.train_number}
              onClick={() => navigate(`/trains/${t.train_number}`)}
              className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50"
            >
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900">{t.train_number}</div>
                <div className="text-xs text-slate-500">{t.train_name}</div>
              </td>
              <td className="px-4 py-3 text-slate-600">{t.current_location}</td>
              <td className="px-4 py-3 tabular-nums text-slate-700">
                <span className="inline-flex items-center gap-1"><Gauge size={13} className="text-rail-500" />{t.speed_kmh.toFixed(0)} km/h</span>
              </td>
              <td className="px-4 py-3 tabular-nums">
                <span className={t.delay_minutes > 15 ? 'font-semibold text-rose-600' : t.delay_minutes > 5 ? 'font-semibold text-amber-600' : 'font-semibold text-emerald-600'}>
                  {t.delay_minutes > 0 ? `+${t.delay_minutes.toFixed(0)}` : t.delay_minutes.toFixed(0)} min
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{t.next_station}</td>
              <td className="px-4 py-3 tabular-nums text-slate-700">
                <span className="inline-flex items-center gap-1"><Clock size={13} className="text-rail-500" />{t.predicted_eta ?? '—'}</span>
              </td>
              <td className="px-4 py-3">{t.confidence_label ? <ConfidenceBadge label={t.confidence_label} /> : '—'}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[t.status] || STATUS_STYLES.not_started}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-300"><ArrowRight size={16} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
