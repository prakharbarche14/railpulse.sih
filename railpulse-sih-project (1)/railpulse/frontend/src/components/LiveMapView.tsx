import { MapContainer, TileLayer, Marker, Polyline, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import type { RouteStopOut, TrainPositionOut } from '../types'

// Fix default marker icons under Vite's bundler (Leaflet's default asset
// paths don't resolve correctly without this).
const trainIcon = new L.DivIcon({
  className: '',
  html: `<div style="
      width:22px;height:22px;border-radius:9999px;background:#ff7a1a;
      border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
    "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export function LiveMapView({
  stops,
  position,
  heightClass = 'h-[420px]',
}: {
  stops: RouteStopOut[]
  position: TrainPositionOut | null
  heightClass?: string
}) {
  if (stops.length === 0) {
    return <div className={`flex ${heightClass} items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400`}>No route data</div>
  }

  const center: [number, number] = position
    ? [position.latitude, position.longitude]
    : [stops[Math.floor(stops.length / 2)].station.latitude, stops[Math.floor(stops.length / 2)].station.longitude]

  const completedIdx = stops.findIndex((s) => s.status === 'current')
  const cutoff = completedIdx === -1 ? stops.length : completedIdx + 1

  const completedLine: [number, number][] = stops.slice(0, cutoff).map((s) => [s.station.latitude, s.station.longitude])
  const remainingLine: [number, number][] = stops.slice(Math.max(cutoff - 1, 0)).map((s) => [s.station.latitude, s.station.longitude])

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 shadow-soft ${heightClass}`}>
      <MapContainer center={center} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {completedLine.length > 1 && <Polyline positions={completedLine} pathOptions={{ color: '#10b981', weight: 4, opacity: 0.85 }} />}
        {remainingLine.length > 1 && <Polyline positions={remainingLine} pathOptions={{ color: '#94a3b8', weight: 4, dashArray: '6 6', opacity: 0.8 }} />}

        {stops.map((s) => (
          <CircleMarker
            key={s.station.station_code}
            center={[s.station.latitude, s.station.longitude]}
            radius={s.status === 'upcoming' ? 4 : 5}
            pathOptions={{
              color: s.status === 'departed' ? '#10b981' : s.status === 'current' ? '#ff7a1a' : '#94a3b8',
              fillColor: s.status === 'departed' ? '#10b981' : s.status === 'current' ? '#ff7a1a' : '#cbd5e1',
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold">{s.station.station_name}</div>
                <div className="mt-1 text-xs text-slate-500">Scheduled: {s.scheduled_arrival ?? '—'}</div>
                {s.predicted_time && <div className="text-xs text-slate-500">Predicted: {s.predicted_time}</div>}
                {typeof s.delay_minutes === 'number' && (
                  <div className="text-xs font-semibold">Delay: {s.delay_minutes > 0 ? '+' : ''}{s.delay_minutes.toFixed(0)} min</div>
                )}
                {s.confidence_label && <div className="text-xs text-slate-500">Confidence: {s.confidence_label}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {position && (
          <Marker position={[position.latitude, position.longitude]} icon={trainIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-bold">Live position (simulated)</div>
                <div className="text-xs text-slate-500">Speed: {position.speed_kmh.toFixed(0)} km/h</div>
                <div className="text-xs text-slate-500">Delay: +{position.current_delay_minutes.toFixed(0)} min</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
