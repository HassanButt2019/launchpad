'use client'

import { useState, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth'
import type { ChatMessage } from '@launchpad/shared'

export const chatKeys = {
  messages: (ideaId: string) => ['chat', ideaId, 'messages'] as const,
}

export function useChatHistory(ideaId: string) {
  return useQuery<ChatMessage[]>({
    queryKey: chatKeys.messages(ideaId),
    queryFn: async () => (await api.get(`/api/v1/ideas/${ideaId}/chat`)).data,
    staleTime: 0,
  })
}

export function useClearChat(ideaId: string) {
  const qc = useQueryClient()
  return useCallback(async () => {
    await api.delete(`/api/v1/ideas/${ideaId}/chat`)
    qc.setQueryData(chatKeys.messages(ideaId), [])
  }, [ideaId, qc])
}

export interface StreamState {
  streaming: boolean
  error: string | null
  limitReached: boolean
}

export function useStreamChat(ideaId: string) {
  const qc = useQueryClient()
  const [state, setState] = useState<StreamState>({ streaming: false, error: null, limitReached: false })
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(
    async (content: string) => {
      setState({ streaming: true, error: null, limitReached: false })

      // Optimistically append user message
      const optimisticUser: ChatMessage = {
        id: `opt-${Date.now()}`,
        idea_id: ideaId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }
      qc.setQueryData<ChatMessage[]>(chatKeys.messages(ideaId), (prev) => [
        ...(prev ?? []),
        optimisticUser,
      ])

      // Placeholder for streaming assistant message
      const assistantPlaceholderId = `streaming-${Date.now()}`
      const assistantPlaceholder: ChatMessage = {
        id: assistantPlaceholderId,
        idea_id: ideaId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      }
      qc.setQueryData<ChatMessage[]>(chatKeys.messages(ideaId), (prev) => [
        ...(prev ?? []),
        assistantPlaceholder,
      ])

      const token = useAuthStore.getState().accessToken
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://launchpad-g3re.onrender.com'

      abortRef.current = new AbortController()

      try {
        const res = await fetch(`${baseURL}/api/v1/ideas/${ideaId}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          // Remove optimistic messages before handling the error
          qc.setQueryData<ChatMessage[]>(chatKeys.messages(ideaId), (prev) =>
            (prev ?? []).filter(
              (m) => m.id !== assistantPlaceholderId && m.id !== optimisticUser.id
            )
          )
          if (res.status === 402) {
            setState({ streaming: false, error: null, limitReached: true })
            return
          }
          if (res.status === 429) {
            toast.warning("You're going too fast — please wait a moment.", { id: 'rate-limit' })
          } else if (res.status === 503) {
            toast.error('AI service is not configured. Check your API key.', { id: 'ai-unavailable' })
          }
          throw new Error(`HTTP ${res.status}`)
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'chunk') {
                accumulated += event.content
                qc.setQueryData<ChatMessage[]>(chatKeys.messages(ideaId), (prev) =>
                  (prev ?? []).map((m) =>
                    m.id === assistantPlaceholderId
                      ? { ...m, content: accumulated }
                      : m
                  )
                )
              } else if (event.type === 'done') {
                // Replace placeholder id with the real persisted id
                qc.setQueryData<ChatMessage[]>(chatKeys.messages(ideaId), (prev) =>
                  (prev ?? []).map((m) =>
                    m.id === assistantPlaceholderId ? { ...m, id: event.message_id } : m
                  )
                )
              } else if (event.type === 'error') {
                throw new Error(event.message)
              }
            } catch {
              // ignore malformed SSE lines
            }
          }
        }

        setState({ streaming: false, error: null, limitReached: false })
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') {
          setState({ streaming: false, error: null, limitReached: false })
          return
        }
        const msg = err instanceof Error ? err.message : 'Something went wrong'
        setState({ streaming: false, error: msg, limitReached: false })
        // Remove the failed placeholder
        qc.setQueryData<ChatMessage[]>(chatKeys.messages(ideaId), (prev) =>
          (prev ?? []).filter(
            (m) => m.id !== assistantPlaceholderId && m.id !== optimisticUser.id
          )
        )
      }
    },
    [ideaId, qc]
  )

  const abort = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { send, abort, ...state }
}
