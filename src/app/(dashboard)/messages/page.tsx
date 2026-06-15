'use client'

import * as React from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { useNotifications } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  MessageCircle,
  Send,
  Loader2,
  Search,
  Plus,
  ArrowLeft,
  Building2,
  User,
  Video,
  PhoneCall,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCallProvider } from '@/components/call-provider'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConversationUser {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  role: string
  facilityId?: string | null
}

interface Conversation {
  threadKey: string
  otherUser: ConversationUser
  lastMessage: {
    id: string
    content: string
    senderId: string
    createdAt: string
    isRead: boolean
  }
  unreadCount: number
}

interface DirectMessageItem {
  id: string
  senderId: string
  recipientId: string
  content: string
  isRead: boolean
  createdAt: string
  sender: { id: string; firstName: string; lastName: string; avatarUrl: string | null }
  recipient: { id: string; firstName: string; lastName: string; avatarUrl: string | null }
}

interface SearchUser {
  id: string
  firstName: string
  lastName: string
  role: string
  facilityId: string | null
  facility?: { name: string } | null
  nurseProfile?: { currentFacility?: { name: string } | null } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(isoDate: string): string {
  const now = new Date()
  const date = new Date(isoDate)
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { token, user } = useAuthStore()
  const { fetchUnreadCount } = useNotifications(30000)
  const { initiateCall, isCallActive } = useCallProvider()
  const [initiatingCall, setInitiatingCall] = React.useState<'VIDEO' | 'PHONE' | null>(null)

  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [selectedThread, setSelectedThread] = React.useState<string | null>(null)
  const [selectedUser, setSelectedUser] = React.useState<ConversationUser | null>(null)
  const [messages, setMessages] = React.useState<DirectMessageItem[]>([])
  const [newMessage, setNewMessage] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [loadingMessages, setLoadingMessages] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showNewMessageDialog, setShowNewMessageDialog] = React.useState(false)
  const [searchUsers, setSearchUsers] = React.useState<SearchUser[]>([])
  const [searchingUsers, setSearchingUsers] = React.useState(false)
  const [searchUserQuery, setSearchUserQuery] = React.useState('')

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const lastMessageIdRef = React.useRef<string>('')

  const headers = React.useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) h['Authorization'] = `Bearer ${token}`
    return h
  }, [token])

  // Fetch conversations
  const fetchConversations = React.useCallback(async () => {
    try {
      const res = await fetch('/api/messages', { headers })
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [headers])

  // Fetch messages for selected thread
  const fetchMessages = React.useCallback(async () => {
    if (!selectedThread) return
    try {
      const params = new URLSearchParams({ view: 'thread', threadKey: selectedThread })
      if (lastMessageIdRef.current) {
        params.set('afterId', lastMessageIdRef.current)
      }
      const res = await fetch(`/api/messages?${params.toString()}`, { headers })
      if (!res.ok) return
      const data = await res.json()
      const newMsgs: DirectMessageItem[] = data.messages || []
      if (newMsgs.length > 0) {
        setMessages(prev => [...prev, ...newMsgs])
        lastMessageIdRef.current = newMsgs[newMsgs.length - 1].id
      }
    } catch {
      // silent
    }
  }, [selectedThread, headers])

  // Initial load
  React.useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Poll for conversation updates
  React.useEffect(() => {
    const interval = setInterval(fetchConversations, 15000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  // Load messages when thread selected
  React.useEffect(() => {
    if (!selectedThread) return

    setLoadingMessages(true)
    lastMessageIdRef.current = ''
    setMessages([])

    fetchMessages().finally(() => setLoadingMessages(false))

    // Mark as read
    fetch('/api/messages', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ threadKey: selectedThread, markAllRead: true }),
    }).then(() => {
      fetchConversations()
      fetchUnreadCount()
    }).catch(() => {})

    // Poll for new messages
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [selectedThread, fetchMessages, headers, fetchConversations, fetchUnreadCount])

  // Auto-scroll
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Send message
  const sendMessage = React.useCallback(async () => {
    if (!newMessage.trim() || !selectedUser) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipientId: selectedUser.id,
          content: newMessage.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to send message')
        return
      }
      setNewMessage('')
      await fetchMessages()
      await fetchConversations()
      inputRef.current?.focus()
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }, [newMessage, selectedUser, headers, fetchMessages, fetchConversations])

  // Search users for new message
  const searchForUsers = React.useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchUsers([])
      return
    }
    setSearchingUsers(true)
    try {
      const res = await fetch(`/api/caregrid/directory?search=${encodeURIComponent(query)}&limit=20`, { headers })
      if (res.ok) {
        const data = await res.json()
        setSearchUsers(data.nurses || [])
      }
    } catch {
      // silent
    } finally {
      setSearchingUsers(false)
    }
  }, [headers])

  // Debounced user search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      searchForUsers(searchUserQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchUserQuery, searchForUsers])

  // Select conversation
  const selectConversation = React.useCallback((conv: Conversation) => {
    setSelectedThread(conv.threadKey)
    setSelectedUser(conv.otherUser)
  }, [])

  // Start new conversation
  const startNewConversation = React.useCallback((targetUser: SearchUser) => {
    const threadKey = [user?.id, targetUser.id].sort().join('::')
    setSelectedThread(threadKey)
    setSelectedUser({
      id: targetUser.id,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      avatarUrl: null,
      role: targetUser.role,
      facilityId: targetUser.facilityId,
    })
    setShowNewMessageDialog(false)
    setSearchUserQuery('')
    setSearchUsers([])
  }, [user?.id])

  // Filter conversations by search
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(
      (c) =>
        c.otherUser.firstName.toLowerCase().includes(q) ||
        c.otherUser.lastName.toLowerCase().includes(q) ||
        c.lastMessage.content.toLowerCase().includes(q)
    )
  }, [conversations, searchQuery])

  // Is this an inter-facility conversation?
  const isInterFacility = React.useMemo(() => {
    if (!selectedUser?.facilityId || !user?.facilityId) return true
    return selectedUser.facilityId !== user.facilityId
  }, [selectedUser, user])

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* ─── Sidebar: Conversations List ─── */}
      <div className={`w-80 border-r bg-white flex flex-col shrink-0 ${selectedThread ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-5 text-emerald-600" />
              <h1 className="text-lg font-semibold">Messages</h1>
              {totalUnread > 0 && (
                <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4 min-w-[18px]">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Badge>
              )}
            </div>
            <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
              <DialogTrigger asChild>
                <Button size="icon" className="size-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                  <DialogDescription>
                    Search for a nurse to start a conversation. You can message nurses at any facility.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <Input
                    placeholder="Search by name..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="w-full"
                  />
                  <ScrollArea className="max-h-[300px]">
                    {searchingUsers ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="size-5 animate-spin text-emerald-500" />
                      </div>
                    ) : searchUsers.length > 0 ? (
                      <div className="space-y-1">
                        {searchUsers.map((u) => (
                          <button
                            key={u.id}
                            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-emerald-50 text-left transition-colors"
                            onClick={() => startNewConversation(u)}
                          >
                            <Avatar className="size-9 border border-emerald-500/30">
                              <AvatarFallback className="bg-emerald-500/20 text-emerald-700 text-xs font-semibold">
                                {getInitials(u.firstName, u.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {u.role} {u.nurseProfile?.currentFacility?.name ? `at ${u.nurseProfile.currentFacility.name}` : ''}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : searchUserQuery.length >= 2 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Type a name to search</p>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 text-emerald-500 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <MessageCircle className="size-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start a new message to communicate with nurses at your facility or across facilities
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.threadKey}
                  className={`flex items-start gap-3 w-full p-3 text-left transition-colors hover:bg-muted/50 ${
                    selectedThread === conv.threadKey ? 'bg-emerald-50/70 border-l-2 border-l-emerald-500' : ''
                  }`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="relative">
                    <Avatar className="size-10 border border-emerald-500/20">
                      <AvatarFallback className="bg-emerald-500/15 text-emerald-700 text-xs font-semibold">
                        {getInitials(conv.otherUser.firstName, conv.otherUser.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white leading-none">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {conv.otherUser.firstName} {conv.otherUser.lastName}
                      </p>
                      <span className="text-[10px] text-muted-foreground/70 shrink-0">
                        {formatRelativeTime(conv.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-slate-700 font-medium' : 'text-muted-foreground'}`}>
                      {conv.lastMessage.senderId === user?.id ? 'You: ' : ''}{conv.lastMessage.content}
                    </p>
                    {conv.otherUser.facilityId && conv.otherUser.facilityId !== user?.facilityId && (
                      <span className="inline-flex items-center gap-0.5 mt-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0 rounded-full">
                        <Building2 className="size-2.5" />
                        Other facility
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ─── Main: Chat View ─── */}
      <div className={`flex-1 flex flex-col bg-slate-50 ${selectedThread ? 'flex' : 'hidden md:flex'}`}>
        {selectedThread && selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-3 border-b bg-white shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 md:hidden"
                onClick={() => {
                  setSelectedThread(null)
                  setSelectedUser(null)
                }}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Avatar className="size-9 border border-emerald-500/20">
                <AvatarFallback className="bg-emerald-500/15 text-emerald-700 text-xs font-semibold">
                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedUser.role}
                  {isInterFacility && (
                    <span className="inline-flex items-center gap-0.5 ml-1.5 text-blue-600">
                      <Building2 className="size-3" />
                      Inter-facility
                    </span>
                  )}
                </p>
              </div>
              {/* Call buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  disabled={isCallActive || initiatingCall !== null}
                  onClick={async () => {
                    setInitiatingCall('VIDEO')
                    try {
                      // Find nurse profile ID from directory
                      const res = await fetch(`/api/caregrid/directory?search=${encodeURIComponent(selectedUser.firstName + ' ' + selectedUser.lastName)}&limit=5`, { headers })
                      if (res.ok) {
                        const data = await res.json()
                        const nurse = data.nurses?.find((n: { userId: string }) => n.userId === selectedUser.id)
                        if (nurse) {
                          await initiateCall(nurse.id, 'VIDEO', {
                            id: nurse.id,
                            firstName: selectedUser.firstName,
                            lastName: selectedUser.lastName,
                            avatarUrl: selectedUser.avatarUrl,
                            specialization: nurse.specialty,
                          })
                        } else {
                          toast.error('Could not find nurse profile for this user')
                        }
                      }
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to start video call')
                    } finally {
                      setInitiatingCall(null)
                    }
                  }}
                  title="Start Video Call"
                >
                  {initiatingCall === 'VIDEO' ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  disabled={isCallActive || initiatingCall !== null}
                  onClick={async () => {
                    setInitiatingCall('PHONE')
                    try {
                      const res = await fetch(`/api/caregrid/directory?search=${encodeURIComponent(selectedUser.firstName + ' ' + selectedUser.lastName)}&limit=5`, { headers })
                      if (res.ok) {
                        const data = await res.json()
                        const nurse = data.nurses?.find((n: { userId: string }) => n.userId === selectedUser.id)
                        if (nurse) {
                          await initiateCall(nurse.id, 'PHONE', {
                            id: nurse.id,
                            firstName: selectedUser.firstName,
                            lastName: selectedUser.lastName,
                            avatarUrl: selectedUser.avatarUrl,
                            specialization: nurse.specialty,
                          })
                        } else {
                          toast.error('Could not find nurse profile for this user')
                        }
                      }
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to start voice call')
                    } finally {
                      setInitiatingCall(null)
                    }
                  }}
                  title="Start Voice Call"
                >
                  {initiatingCall === 'PHONE' ? <Loader2 className="size-4 animate-spin" /> : <PhoneCall className="size-4" />}
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 text-emerald-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="size-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === user?.id
                  const senderName = `${msg.sender?.firstName ?? ''} ${msg.sender?.lastName ?? ''}`.trim() || 'Unknown'
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
                          <p className="leading-relaxed">{msg.content}</p>
                        </div>
                        <p className={`text-[10px] text-muted-foreground mt-0.5 ${isMine ? 'text-right' : 'text-left'}`}>
                          {isMine ? 'You' : senderName} · {formatRelativeTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Input */}
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
                  onChange={(e) => setNewMessage(e.target.value)}
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
          </>
        ) : (
          /* Empty state when no thread selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center text-center px-6">
              <MessageCircle className="size-16 text-emerald-200 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700">NurseOS Messages</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Communicate with nurses at your facility or across facilities. Send direct messages, coordinate patient care, and collaborate seamlessly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
