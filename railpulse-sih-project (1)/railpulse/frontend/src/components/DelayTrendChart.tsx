import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function DelayTrendChart({ points }: { points: number[] }) {
  const data = points.map((v, i) => ({ tick: `T-${points.length - i}`, delay: v }))

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="delayFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff7a1a" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#ff7a1a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="tick" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} width={36} unit=" m" />
          <Tooltip formatter={(v: number) => `${v.toFixed(1)} min`} />
          <Area type="monotone" dataKey="delay" stroke="#ff7a1a" strokeWidth={2.5} fill="url(#delayFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
