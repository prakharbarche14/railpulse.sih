import clsx from 'clsx'

const STYLES: Record<string, string> = {
  High: 'bg-emerald-100 text-emerald-700 ring-emerald-300',
  Medium: 'bg-amber-100 text-amber-700 ring-amber-300',
  Low: 'bg-rose-100 text-rose-700 ring-rose-300',
}

export function ConfidenceBadge({ label, score }: { label: string; score?: number }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
        STYLES[label] || STYLES.Medium,
      )}
    >
      {label}
      {typeof score === 'number' && <span className="tabular-nums opacity-70">{Math.round(score * 100)}%</span>}
    </span>
  )
}
