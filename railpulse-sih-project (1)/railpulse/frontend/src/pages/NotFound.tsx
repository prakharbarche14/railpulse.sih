import { NavLink } from 'react-router-dom'
import { TrainFront } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <TrainFront size={40} className="text-slate-300" />
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Station not found</h1>
      <p className="mt-2 text-sm text-slate-500">That route doesn't exist on this line.</p>
      <NavLink to="/dashboard" className="mt-6 rounded-xl bg-rail-800 px-5 py-2.5 text-sm font-bold text-white">
        Back to Dashboard
      </NavLink>
    </div>
  )
}
