export interface UserOut {
  id: number
  name: string
  email: string
  role: 'passenger' | 'admin'
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: UserOut
}

export interface StationOut {
  station_code: string
  station_name: string
  latitude: number
  longitude: number
}

export type StopStatus = 'departed' | 'current' | 'upcoming'

export interface RouteStopOut {
  station: StationOut
  sequence: number
  scheduled_arrival: string | null
  scheduled_departure: string | null
  distance_from_origin_km: number
  status: StopStatus
  actual_time?: string | null
  predicted_time?: string | null
  delay_minutes?: number | null
  confidence?: number | null
  confidence_label?: string | null
}

export interface ETAStationOut {
  station_code: string
  station_name: string
  scheduled_arrival: string | null
  predicted_arrival: string
  predicted_arrival_optimistic: string
  predicted_arrival_pessimistic: string
  delay_minutes: number
  confidence: number
  confidence_label: 'High' | 'Medium' | 'Low'
  explanation: string
}

export interface TrainOut {
  train_number: string
  train_name: string
  train_type: string
  is_demo: boolean
}

export interface TrainPositionOut {
  latitude: number
  longitude: number
  speed_kmh: number
  prev_speed_kmh: number
  current_delay_minutes: number
  last_station_code: string | null
  next_station_code: string | null
  distance_to_next_km: number
  status: string
  timestamp: string
  seconds_ago?: number
}

export interface LiveTrainSummary {
  train_number: string
  train_name: string
  train_type: string
  current_location: string
  speed_kmh: number
  delay_minutes: number
  next_station: string
  predicted_eta: string | null
  confidence_label: string | null
  status: string
}

export interface TrainDetail {
  train: TrainOut
  position: TrainPositionOut | null
  route: RouteStopOut[]
  eta: ETAStationOut[]
}

export interface DashboardStats {
  active_trains: number
  on_time_pct: number
  delayed_pct: number
  average_delay_minutes: number
  prediction_accuracy_pct: number
}

export interface ModelPerformancePoint {
  label: string
  mae: number
  rmse: number
  accuracy_pct: number
}

export interface PredictionRecord {
  train_number: string
  station_name: string
  predicted_arrival: string
  actual_arrival: string | null
  error_minutes: number | null
  created_at: string
}

export interface AdminMetrics {
  total_tracked_trains: number
  active_predictions: number
  average_delay_minutes: number
  eta_accuracy_pct: number
  mean_absolute_error: number
  rmse: number
  data_freshness_seconds: number
  api_status: string
  model_version: string
  performance_over_time: ModelPerformancePoint[]
  recent_predictions: PredictionRecord[]
}

export interface AlertOut {
  id: number
  train_id: number
  alert_type: string
  message: string
  is_read: boolean
  created_at: string
}

export interface WsPositionUpdate {
  type: 'position_update'
  train_number: string
  note: string | null
  position: TrainPositionOut
  next_station_eta: ETAStationOut | null
  route: RouteStopOut[]
}
