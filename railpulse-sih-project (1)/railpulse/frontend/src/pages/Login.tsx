import { useState, type FormEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { TrainFront, LogIn } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('passenger@railpulse.demo')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.login(email, password)
      login(res.user, res.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rail-950 to-rail-800 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rail-800 text-white"><TrainFront size={22} /></span>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to track trains and manage alerts.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-rail-400 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-rail-400 focus:ring-2"
            />
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rail-800 py-3 font-bold text-white transition hover:bg-rail-700 disabled:opacity-60"
          >
            <LogIn size={16} /> {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          Demo accounts — passenger: <span className="font-mono">passenger@railpulse.demo</span> · admin:{' '}
          <span className="font-mono">admin@railpulse.demo</span> (password: <span className="font-mono">password123</span>)
        </p>

        <p className="mt-4 text-center text-sm text-slate-500">
          No account? <NavLink to="/register" className="font-semibold text-rail-700">Sign up</NavLink>
        </p>
      </div>
    </div>
  )
}
