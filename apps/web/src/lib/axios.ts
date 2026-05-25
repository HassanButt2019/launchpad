import axios from 'axios'
import Cookies from 'js-cookie'
import { toast } from 'sonner'

const getAuthStore = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useAuthStore } = require('@/store/auth')
  return useAuthStore
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = getAuthStore().getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // ── 401: attempt token refresh, then logout ──────────────────────────
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      const refreshToken = Cookies.get('refresh_token')
      const store = getAuthStore()
      if (!refreshToken) {
        store.getState().logout()
        // Redirect with reason so login page can show a message
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=session_expired'
        }
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/refresh`,
          { refresh_token: refreshToken }
        )
        store.getState().setAccessToken(data.access_token)
        processQueue(null, data.access_token)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        store.getState().logout()
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=session_expired'
        }
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    // ── 429: rate limit ───────────────────────────────────────────────────
    if (status === 429) {
      toast.warning("You're going too fast — please wait a moment before trying again.", {
        id: 'rate-limit',
        duration: 4000,
      })
      return Promise.reject(error)
    }

    // ── 503: AI service unavailable ───────────────────────────────────────
    if (status === 503) {
      toast.error('AI service is not configured. Please check your API key settings.', {
        id: 'ai-unavailable',
        duration: 5000,
      })
      return Promise.reject(error)
    }

    // ── 5xx: server errors ────────────────────────────────────────────────
    if (status >= 500) {
      toast.error('Something went wrong on the server. Please try again.', {
        id: `server-error-${status}`,
        duration: 4000,
      })
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api
