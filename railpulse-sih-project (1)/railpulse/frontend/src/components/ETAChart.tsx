import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ETAStationOut } from '../types'

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function ETAChart({ eta }: { eta: ETAStationOut[] }) {
  const data = eta.map((e) => ({
    station: e.station_code,
    Scheduled: e.scheduled_arrival ? toMinutes(e.scheduled_arrival) : null,
    Predicted: toMinutes(e.predicted_arrival),
  }))

  const fmt = (v: number) => {
    const h = Math.floor((v % 1440) / 60)
    const m = Math.round(v % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="station" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 12, fill: '#64748b' }} width={56} />
          <Tooltip formatter={(v: number) => fmt(v)} labelClassName="font-semibold" />
          <Legend />
          <Line type="monotone" dataKey="Scheduled" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Predicted" stroke="#ff7a1a" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
