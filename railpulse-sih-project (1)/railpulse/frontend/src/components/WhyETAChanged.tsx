import { Sparkles } from 'lucide-react'
import type { ETAStationOut } from '../types'

export function WhyETAChanged({ eta }: { eta: ETAStationOut | null }) {
  if (!eta) return null
  return (
    <div className="rounded-2xl border border-rail-100 bg-gradient-to-br from-rail-50 to-white p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rail-800 text-white">
          <Sparkles size={15} />
        </span>
        <h3 className="font-bold text-slate-900">Why did the ETA change?</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{eta.explanation}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white p-2.5 ring-1 ring-slate-100">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Best case</div>
          <div className="mt-1 font-bold tabular-nums text-emerald-600">{eta.predicted_arrival_optimistic}</div>
        </div>
        <div className="rounded-xl bg-rail-800 p-2.5 text-white ring-1 ring-rail-800">
          <div className="text-[11px] font-semibold uppercase text-rail-200">Expected</div>
          <div className="mt-1 font-bold tabular-nums">{eta.predicted_arrival}</div>
        </div>
        <div className="rounded-xl bg-white p-2.5 ring-1 ring-slate-100">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Worst case</div>
          <div className="mt-1 font-bold tabular-nums text-rose-600">{eta.predicted_arrival_pessimistic}</div>
        </div>
      </div>
    </div>
  )
}
