import type {
  AuthResponse, LiveTrainSummary, TrainDetail, DashboardStats,
  AdminMetrics, AlertOut, RouteStopOut, ETAStationOut,
} from '../types'

const BASE = '/api'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('railpulse_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

export const api = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    return handle(res)
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return handle(res)
  },

  async listTrains(query?: string): Promise<LiveTrainSummary[]> {
    const url = query ? `${BASE}/trains?q=${encodeURIComponent(query)}` : `${BASE}/trains`
    const res = await fetch(url)
    return handle(res)
  },

  async getTrain(trainNumber: string): Promise<TrainDetail> {
    const res = await fetch(`${BASE}/trains/${trainNumber}`)
    return handle(res)
  },

  async getRoute(trainNumber: string): Promise<RouteStopOut[]> {
    const res = await fetch(`${BASE}/trains/${trainNumber}/route`)
    return handle(res)
  },

  async getEta(trainNumber: string): Promise<ETAStationOut[]> {
    const res = await fetch(`${BASE}/trains/${trainNumber}/eta`)
    return handle(res)
  },

  async subscribe(trainNumber: string): Promise<{ subscribed: boolean; message: string }> {
    const res = await fetch(`${BASE}/trains/${trainNumber}/subscribe`, {
      method: 'POST',
      headers: { ...authHeaders() },
    })
    return handle(res)
  },

  async unsubscribe(trainNumber: string): Promise<{ subscribed: boolean }> {
    const res = await fetch(`${BASE}/trains/${trainNumber}/subscribe`, {
      method: 'DELETE',
      headers: { ...authHeaders() },
    })
    return handle(res)
  },

  async getAnalytics(): Promise<DashboardStats> {
    const res = await fetch(`${BASE}/analytics`)
    return handle(res)
  },

  async getAdminMetrics(): Promise<AdminMetrics> {
    const res = await fetch(`${BASE}/admin/metrics`, { headers: { ...authHeaders() } })
    return handle(res)
  },

  async getMyAlerts(): Promise<AlertOut[]> {
    const res = await fetch(`${BASE}/alerts/me`, { headers: { ...authHeaders() } })
    return handle(res)
  },
}
