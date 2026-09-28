import { NavLink, useNavigate } from 'react-router-dom'
import { TrainFront, LayoutDashboard, MapPinned, LineChart, BellRing, ShieldCheck, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { DemoBadge } from './DemoBadge'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/live-map', label: 'Live Map', icon: MapPinned },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/alerts', label: 'Alerts', icon: BellRing },
]

export function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rail-800 text-white shadow-glow">
              <TrainFront size={18} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-extrabold tracking-tight text-rail-900">RailPulse</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-rail-500">
                Dynamic Railway ETA Intelligence
              </span>
            </span>
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-rail-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-rail-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <ShieldCheck size={15} />
                Admin
              </NavLink>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <DemoBadge />
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">{user.name}</span>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink to="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Log in
              </NavLink>
              <NavLink to="/register" className="rounded-lg bg-rail-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rail-700">
                Sign up
              </NavLink>
            </div>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="mb-3"><DemoBadge /></div>
          <nav className="flex flex-col gap-1">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-rail-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={16} /> {label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                <ShieldCheck size={16} /> Admin
              </NavLink>
            )}
            <div className="mt-2 border-t border-slate-100 pt-2">
              {user ? (
                <button
                  onClick={() => {
                    logout()
                    setOpen(false)
                    navigate('/')
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  <LogOut size={16} /> Logout
                </button>
              ) : (
                <div className="flex gap-2">
                  <NavLink to="/login" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium">
                    Log in
                  </NavLink>
                  <NavLink to="/register" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-rail-800 px-3 py-2 text-center text-sm font-semibold text-white">
                    Sign up
                  </NavLink>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
