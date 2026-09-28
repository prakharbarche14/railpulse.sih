import { Radio } from 'lucide-react'

export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 ${className}`}
      title="This application uses simulated train telemetry for demonstration — not a live Indian Railways feed."
    >
      <Radio size={12} className="animate-pulseDot" />
      DEMO DATA
    </span>
  )
}
