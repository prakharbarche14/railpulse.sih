import { create } from 'zustand'
import type { UserOut } from '../types'

interface AuthState {
  user: UserOut | null
  token: string | null
  login: (user: UserOut, token: string) => void
  logout: () => void
}

const storedToken = localStorage.getItem('railpulse_token')
const storedUser = localStorage.getItem('railpulse_user')

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? (JSON.parse(storedUser) as UserOut) : null,
  token: storedToken,
  login: (user, token) => {
    localStorage.setItem('railpulse_token', token)
    localStorage.setItem('railpulse_user', JSON.stringify(user))
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('railpulse_token')
    localStorage.removeItem('railpulse_user')
    set({ user: null, token: null })
  },
}))
