import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

export function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string | number
  suffix?: string
  icon: LucideIcon
  tone?: 'default' | 'good' | 'warn' | 'bad'
}) {
  const toneClasses: Record<string, string> = {
    default: 'bg-rail-50 text-rail-700',
    good: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
    bad: 'bg-rose-50 text-rose-700',
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:shadow-glow sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className={clsx('flex h-8 w-8 items-center justify-center rounded-lg', toneClasses[tone])}>
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-extrabold tabular-nums text-slate-900 sm:text-3xl">{value}</span>
        {suffix && <span className="text-sm font-semibold text-slate-400">{suffix}</span>}
      </div>
    </div>
  )
}
