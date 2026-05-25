import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth'
import Cookies from 'js-cookie'
import { LoginInput, RegisterInput } from '@launchpad/shared'

export function useLogin() {
  const { setAccessToken, setUser } = useAuthStore()
  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await api.post('/api/v1/auth/login', data)
      return res.data
    },
    onSuccess: (data) => {
      setAccessToken(data.access_token)
      if (data.refresh_token) {
        Cookies.set('refresh_token', data.refresh_token, {
          secure: true,
          sameSite: 'strict',
        })
      }
      if (data.user) setUser(data.user)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const res = await api.post('/api/v1/auth/register', data)
      return res.data
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: async () => {
      await api.post('/api/v1/auth/logout')
    },
    onSettled: () => logout(),
  })
}

export function useCurrentUser() {
  const { setUser } = useAuthStore()
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/v1/auth/me')
      setUser(res.data)
      return res.data
    },
    retry: false,
  })
}
