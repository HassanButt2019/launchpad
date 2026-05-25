import { create } from 'zustand'
import Cookies from 'js-cookie'
import { User } from '@launchpad/shared'

interface AuthState {
  accessToken: string | null
  user: User | null
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  logout: () => {
    // Clear in-memory token — never stored in localStorage
    set({ accessToken: null, user: null })
    Cookies.remove('refresh_token')
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },
  isAuthenticated: () => !!get().accessToken,
}))
