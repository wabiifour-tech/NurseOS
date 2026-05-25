'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  senderId: string
  content: string
  createdAt: string
  sender: {
    id: string
    user: { firstName: string; lastName: string }
  }
}

interface ChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  consultationId: string
  currentNurseId: string
  otherPartyName: string
  token: string | null
}

export function ChatDialog({
  open,
  onOpenChange,
  consultationId,
  currentNurseId,
  otherPartyName,
  token,
}: ChatDialogProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const lastMessageIdRef = React.useRef<string>('')

  const headers = React.useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) h['Authorization'] = `Bearer ${token}`
    return h
  }, [token])

  // Fetch messages
  const fetchMessages = React.useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (lastMessageIdRef.current) {
        params.set('afterId', lastMessageIdRef.current)
      }
      const res = await fetch(
        `/api/caregrid/consultations/${consultationId}/messages?${params.toString()}`,
        { headers }
      )
      if (!res.ok) return
      const data = await res.json()
      const newMsgs: ChatMessage[] = data.messages || []
      if (newMsgs.length > 0) {
        setMessages(prev => [...prev, ...newMsgs])
        lastMessageIdRef.current = newMsgs[newMsgs.length - 1].id
      }
    } catch {
      // silent
    }
  }, [consultationId, headers])

  // Initial load + polling
  React.useEffect(() => {
    if (!open) return

    setLoading(true)
    lastMessageIdRef.current = ''
    setMessages([])

    fetchMessages().finally(() => setLoading(false))

    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [open, fetchMessages])

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = React.useCallback(async () => {
    if (!newMessage.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/caregrid/consultations/${consultationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: newMessage.trim() }),
      })
      if (!res.ok) {
        toast.error('Failed to send message')
        return
      }
      setNewMessage('')
      await fetchMessages()
      inputRef.current?.focus()
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }, [newMessage, consultationId, headers, fetchMessages])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] flex flex-col p-0 gap-0 overflow-hidden" style={{ height: '520px' }}>
        <DialogHeader className="p-4 pb-2 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-5 text-emerald-600" />
            Chat Consultation
          </DialogTitle>
          <DialogDescription>
            Chat with {otherPartyName}
          </DialogDescription>
        </DialogHeader>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 text-emerald-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageCircle className="size-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === currentNurseId
              const senderName = `${msg.sender?.user?.firstName ?? ''} ${msg.sender?.user?.lastName ?? ''}`.trim() || 'Unknown'
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${isMine ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm ${
                        isMine
                          ? 'bg-emerald-600 text-white rounded-br-md'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                      }`}
                    >
                      {!isMine && (
                        <p className={`text-[10px] font-semibold mb-0.5 ${isMine ? 'text-emerald-200' : 'text-emerald-600'}`}>
                          {senderName}
                        </p>
                      )}
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                    <p className={`text-[10px] text-muted-foreground mt-0.5 ${isMine ? 'text-right' : 'text-left'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Input area */}
        <div className="p-3 border-t bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              disabled={sending || !newMessage.trim()}
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
