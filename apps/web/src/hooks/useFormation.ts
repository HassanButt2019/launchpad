import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export const formationKeys = {
  profile: (ideaId: string) => ['formation', ideaId] as const,
  documents: (ideaId: string) => ['formation', ideaId, 'documents'] as const,
  compliance: (ideaId: string) => ['formation', ideaId, 'compliance'] as const,
  jurisdictions: ['jurisdictions'] as const,
}

export function useFormationProfile(ideaId: string) {
  return useQuery({
    queryKey: formationKeys.profile(ideaId),
    queryFn: async () => {
      try {
        const res = await api.get(`/api/v1/ideas/${ideaId}/formation`)
        return res.data
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } }
        if (e?.response?.status === 404) return null
        throw err
      }
    },
    retry: false,
  })
}

export function useJurisdictions() {
  return useQuery({
    queryKey: formationKeys.jurisdictions,
    queryFn: async () => (await api.get('/api/v1/formation/jurisdictions')).data,
  })
}

export function useRecommendJurisdictions() {
  return useMutation({
    mutationFn: async (payload: {
      founder_location: string
      customer_location: string
      business_type: string
      plans_vc_funding: boolean
      prefers_remote_setup: boolean
      prefers_full_online: boolean
    }) => (await api.post('/api/v1/formation/jurisdictions/recommend', payload)).data,
  })
}

export function useStartFormation(ideaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { jurisdiction: string; legal_structure: string }) =>
      (await api.post(`/api/v1/ideas/${ideaId}/formation`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: formationKeys.profile(ideaId) }),
  })
}

export function useUpdateFormation(ideaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { status?: string; incorporation_date?: string }) =>
      (await api.put(`/api/v1/ideas/${ideaId}/formation`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: formationKeys.profile(ideaId) }),
  })
}

export function useToggleFormationChecklist(ideaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      (
        await api.patch(`/api/v1/ideas/${ideaId}/formation/checklist/${itemId}`, { completed })
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: formationKeys.profile(ideaId) }),
  })
}

export function useFormationDocuments(ideaId: string) {
  return useQuery({
    queryKey: formationKeys.documents(ideaId),
    queryFn: async () => (await api.get(`/api/v1/ideas/${ideaId}/formation/documents`)).data,
  })
}

export function useGenerateFormationDocument(ideaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { doc_type: string; jurisdiction: string }) =>
      (await api.post(`/api/v1/ideas/${ideaId}/formation/documents`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formationKeys.documents(ideaId) })
      qc.invalidateQueries({ queryKey: formationKeys.profile(ideaId) })
    },
  })
}

export function useComplianceEvents(ideaId: string) {
  return useQuery({
    queryKey: formationKeys.compliance(ideaId),
    queryFn: async () => (await api.get(`/api/v1/ideas/${ideaId}/formation/compliance`)).data,
  })
}

export function useToggleComplianceEvent(ideaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ eventId, completed }: { eventId: string; completed: boolean }) =>
      (
        await api.patch(`/api/v1/ideas/${ideaId}/formation/compliance/${eventId}`, { completed })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formationKeys.compliance(ideaId) })
      qc.invalidateQueries({ queryKey: formationKeys.profile(ideaId) })
    },
  })
}
