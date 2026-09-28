import clsx from 'clsx'
import { CheckCircle2, CircleDot, Circle } from 'lucide-react'
import type { RouteStopOut } from '../types'
import { ConfidenceBadge } from './ConfidenceBadge'

export function RouteTimeline({ stops }: { stops: RouteStopOut[] }) {
  return (
    <ol className="relative">
      {stops.map((stop, idx) => {
        const isLast = idx === stops.length - 1
        return (
          <li key={stop.station.station_code} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={clsx(
                  'absolute left-[13px] top-6 h-full w-0.5',
                  stop.status === 'departed' ? 'bg-emerald-300' : 'bg-slate-200',
                )}
              />
            )}
            <span className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white">
              {stop.status === 'departed' && <CheckCircle2 size={22} className="text-emerald-500" />}
              {stop.status === 'current' && <CircleDot size={22} className="animate-pulseDot text-rail-accent" />}
              {stop.status === 'upcoming' && <Circle size={22} className="text-slate-300" />}
            </span>

            <div className="flex-1 rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900">{stop.station.station_name}</div>
                  <div className="text-xs text-slate-400">{stop.station.station_code} · {stop.distance_from_origin_km.toFixed(0)} km from origin</div>
                </div>
                {stop.status === 'departed' && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">Departed</span>
                )}
                {stop.status === 'current' && (
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-rail-accent">Current section</span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                <span className="text-slate-500">
                  Scheduled <span className="font-semibold tabular-nums text-slate-700">{stop.scheduled_arrival ?? '—'}</span>
                </span>
                {stop.predicted_time && (
                  <span className="text-slate-500">
                    Predicted <span className="font-semibold tabular-nums text-rail-700">{stop.predicted_time}</span>
                  </span>
                )}
                {typeof stop.delay_minutes === 'number' && (
                  <span
                    className={clsx(
                      'font-semibold tabular-nums',
                      stop.delay_minutes > 15 ? 'text-rose-600' : stop.delay_minutes > 5 ? 'text-amber-600' : 'text-emerald-600',
                    )}
                  >
                    {stop.delay_minutes > 0 ? '+' : ''}
                    {stop.delay_minutes.toFixed(0)} min
                  </span>
                )}
                {stop.confidence_label && <ConfidenceBadge label={stop.confidence_label} score={stop.confidence ?? undefined} />}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
