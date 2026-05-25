'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Trash2,
  ChevronLeft,
  Sparkles,
  User,
  StopCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import { useIdea } from '@/hooks/useIdeas'
import { useChatHistory, useClearChat, useStreamChat } from '@/hooks/useChat'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@launchpad/shared'
import UpgradeModal from '@/components/ui/UpgradeModal'

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STARTERS = [
  'What should my top priority be this week?',
  'Help me craft a cold email to potential customers',
  'What are the biggest risks for this idea right now?',
  'Draft a 60-second elevator pitch for investors',
  'Who are my top 3 competitors and how do I differentiate?',
  'What metrics should I be tracking at this stage?',
]

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-7 h-7 rounded-full bg-orange-500/15 border border-orange-500/20 flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-orange-400" />
      </div>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-stone-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-base font-bold text-[var(--text-primary)] mt-4 mb-2 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-bold text-[var(--text-primary)] mt-3 mb-1.5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-stone-300 mt-2 mb-1 first:mt-0">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-stone-300 leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-1 mb-2 pl-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="space-y-1 mb-2 pl-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm text-stone-300 leading-relaxed flex gap-2">
      <span className="text-orange-400 mt-1 shrink-0">•</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-stone-400">{children}</em>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-orange-500/50 pl-3 my-2 text-stone-400 text-sm italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.includes('language-')
    return isBlock ? (
      <pre className="bg-black/30 border border-[var(--border-ui)] rounded-lg p-3 overflow-x-auto my-2">
        <code className="text-xs font-mono text-stone-300">{children}</code>
      </pre>
    ) : (
      <code className="bg-black/25 text-orange-300 text-xs font-mono px-1.5 py-0.5 rounded">
        {children}
      </code>
    )
  },
}

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex items-end gap-3', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
          isUser
            ? 'bg-stone-700 border border-[var(--border-ui)]'
            : 'bg-orange-500/15 border border-orange-500/20'
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-stone-400" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
        )}
      </div>

      {/* Bubble + meta */}
      <div className={cn('flex flex-col gap-1 max-w-[78%]', isUser && 'items-end')}>
        <div
          className={cn(
            'group relative px-4 py-3 rounded-2xl text-sm',
            isUser
              ? 'bg-orange-500 text-white rounded-br-sm'
              : 'bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-bl-sm'
          )}
        >
          {isUser ? (
            <p className="leading-relaxed">{message.content}</p>
          ) : message.content ? (
            <div>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={mdComponents as Record<string, React.ComponentType<unknown>>}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-0.5 h-3.5 bg-orange-400 animate-pulse ml-0.5 align-middle" />
              )}
              {/* Copy button — AI messages only */}
              {!isStreaming && (
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 text-[var(--text-muted)] hover:text-stone-300 transition-all"
                  title="Copy response"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          ) : null}
        </div>
        {/* Timestamp */}
        {message.created_at && (
          <span className="text-[10px] text-[var(--text-muted)] px-1">
            {formatTime(message.created_at)}
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default function ChatPage() {
  const params = useParams()
  const id = params.id as string

  const { data: idea } = useIdea(id)
  const { data: messages = [], isLoading } = useChatHistory(id)
  const clearChat = useClearChat(id)
  const { send, abort, streaming, error, limitReached } = useStreamChat(id)

  const [input, setInput] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (limitReached) setShowUpgrade(true)
  }, [limitReached])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hadMessages = useRef(false)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: hadMessages.current ? 'smooth' : 'instant' })
    if (messages.length > 0) hadMessages.current = true
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || streaming) return
    setInput('')
    await send(trimmed)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    await clearChat()
    setConfirmClear(false)
  }

  const showStarters = !isLoading && messages.length === 0 && !streaming

  return (
    <div className="flex flex-col h-[calc(100vh-64px-2rem)] max-h-[900px]">
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-ui)] bg-[var(--bg-surface)] rounded-t-2xl shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/ideas/${id}`}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-[var(--text-primary)] font-semibold text-sm">AI Co-Founder</p>
            <p className="text-[var(--text-muted)] text-xs truncate max-w-[220px]">
              {idea?.title ?? '…'}
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          disabled={messages.length === 0 && !streaming}
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
            confirmClear
              ? 'border-red-500/40 text-red-400 bg-red-500/10'
              : 'border-[var(--border-ui)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Trash2 className="w-3 h-3" />
          {confirmClear ? 'Confirm clear' : 'Clear chat'}
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-[var(--bg-base)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" />
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
                />
              ))}
            </AnimatePresence>

            {/* Show typing indicator when streaming but last message is still empty */}
            {streaming && messages[messages.length - 1]?.content === '' && (
              <TypingIndicator />
            )}

            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5"
              >
                {error} — please try again.
              </motion.div>
            )}

            {/* Starter prompts */}
            {showStarters && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-5 pt-10"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-orange-400" />
                </div>
                <div className="text-center">
                  <p className="text-[var(--text-primary)] font-semibold text-base mb-1">
                    Your AI Co-Founder is ready
                  </p>
                  <p className="text-[var(--text-muted)] text-sm max-w-sm">
                    Ask anything about your idea — strategy, competitors, customers, pitches, and more.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl mt-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setInput(s)
                        inputRef.current?.focus()
                      }}
                      className="text-left text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-ui)] hover:border-orange-500/25 hover:bg-[var(--bg-surface-hover)] px-3.5 py-2.5 rounded-xl transition-colors leading-relaxed"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-[var(--border-ui)] bg-[var(--bg-surface)] rounded-b-2xl px-4 py-3">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI co-founder anything…"
            disabled={streaming}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-[var(--bg-input)] border border-[var(--border-ui)]',
              'rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20',
              'disabled:opacity-50 transition-colors leading-relaxed'
            )}
            style={{ minHeight: '42px', maxHeight: '160px', overflowY: 'auto' }}
          />

          {streaming ? (
            <button
              onClick={abort}
              className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 flex items-center justify-center shrink-0 transition-colors"
              title="Stop generation"
            >
              <StopCircle className="w-4.5 h-4.5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                input.trim()
                  ? 'bg-orange-500 hover:bg-orange-500/90 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-[var(--bg-surface-hover)] border border-[var(--border-ui)] text-[var(--text-muted)] cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-[var(--text-muted)]">
            Enter to send · Shift+Enter for new line
          </p>
          {input.length > 0 && (
            <span className={cn(
              'text-[10px] tabular-nums',
              input.length > 900 ? 'text-red-400' : input.length > 700 ? 'text-amber-400' : 'text-[var(--text-muted)]'
            )}>
              {input.length}/1000
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
