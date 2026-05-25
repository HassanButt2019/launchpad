import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { IdeaInput } from '@launchpad/shared'

export const ideaKeys = {
  all: ['ideas'] as const,
  detail: (id: string) => ['ideas', id] as const,
  journey: (id: string) => ['ideas', id, 'journey'] as const,
  validation: (id: string) => ['ideas', id, 'validation'] as const,
  documents: (id: string) => ['ideas', id, 'documents'] as const,
  checklist: (id: string) => ['ideas', id, 'checklist'] as const,
}

export function useIdeas() {
  return useQuery({
    queryKey: ideaKeys.all,
    queryFn: async () => (await api.get('/api/v1/ideas')).data,
  })
}

export function useIdea(id: string) {
  return useQuery({
    queryKey: ideaKeys.detail(id),
    queryFn: async () => (await api.get(`/api/v1/ideas/${id}`)).data,
  })
}

export function useCreateIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: IdeaInput) => (await api.post('/api/v1/ideas', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ideaKeys.all })
      toast.success('Idea created!')
    },
    onError: () => toast.error('Failed to create idea. Please try again.'),
  })
}

export function useUpdateIdea(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<IdeaInput>) =>
      (await api.put(`/api/v1/ideas/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ideaKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ideaKeys.all })
      toast.success('Idea updated.')
    },
    onError: () => toast.error('Failed to update idea.'),
  })
}

export function useDeleteIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/v1/ideas/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ideaKeys.all })
      toast.success('Idea deleted.')
    },
    onError: () => toast.error('Failed to delete idea.'),
  })
}

export function useValidateIdea(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post(`/api/v1/ideas/${id}/validate`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ideaKeys.validation(id) })
      qc.invalidateQueries({ queryKey: ideaKeys.detail(id) })
      toast.success('Validation complete!')
    },
    onError: () => toast.error('Validation failed. Please try again.'),
  })
}

export function useValidationReport(id: string) {
  return useQuery({
    queryKey: ideaKeys.validation(id),
    queryFn: async () => (await api.get(`/api/v1/ideas/${id}/validation`)).data,
    retry: false,
  })
}

export function useJourney(id: string) {
  return useQuery({
    queryKey: ideaKeys.journey(id),
    queryFn: async () => (await api.get(`/api/v1/ideas/${id}/journey`)).data,
  })
}

export function useDocuments(id: string) {
  return useQuery({
    queryKey: ideaKeys.documents(id),
    queryFn: async () => (await api.get(`/api/v1/ideas/${id}/documents`)).data,
  })
}

export function useDocument(ideaId: string, docId: string | null) {
  return useQuery({
    queryKey: ['ideas', ideaId, 'documents', docId],
    queryFn: async () => (await api.get(`/api/v1/ideas/${ideaId}/documents/${docId}`)).data,
    enabled: !!docId,
  })
}

export function useGenerateDocument(ideaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: string | { docType: string; jurisdiction?: string }) => {
      const docType = typeof payload === 'string' ? payload : payload.docType
      const jurisdiction = typeof payload === 'string' ? undefined : payload.jurisdiction
      return (await api.post(`/api/v1/ideas/${ideaId}/documents`, { doc_type: docType, jurisdiction })).data
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ideaKeys.documents(ideaId) })
      qc.invalidateQueries({ queryKey: ['ideas', ideaId, 'documents', doc.id] })
      toast.success('Document generated!')
    },
    onError: () => toast.error('Document generation failed. Please try again.'),
  })
}

export function useUpdateDocument(ideaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ docId, content }: { docId: string; content: string }) =>
      (await api.put(`/api/v1/ideas/${ideaId}/documents/${docId}`, { content })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ideaKeys.documents(ideaId) })
      toast.success('Document saved.')
    },
    onError: () => toast.error('Failed to save document.'),
  })
}

export function useChecklist(id: string) {
  return useQuery({
    queryKey: ideaKeys.checklist(id),
    queryFn: async () => (await api.get(`/api/v1/ideas/${id}/checklist`)).data,
  })
}

export function useUpdateChecklistItem(ideaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: number; completed: boolean }) =>
      (await api.patch(`/api/v1/ideas/${ideaId}/checklist/${itemId}`, { completed })).data,
    // Optimistic update — flip the checkbox instantly, revert on error
    onMutate: async ({ itemId, completed }) => {
      await qc.cancelQueries({ queryKey: ideaKeys.checklist(ideaId) })
      const previous = qc.getQueryData(ideaKeys.checklist(ideaId))
      qc.setQueryData(ideaKeys.checklist(ideaId), (old: unknown) => {
        if (!Array.isArray(old)) return old
        return old.map((cl: { items?: { id: number; completed: boolean }[] }) => ({
          ...cl,
          items: (cl.items || []).map((item) =>
            item.id === itemId ? { ...item, completed } : item
          ),
        }))
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(ideaKeys.checklist(ideaId), context.previous)
      }
      toast.error('Failed to update checklist item.')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ideaKeys.checklist(ideaId) }),
  })
}
