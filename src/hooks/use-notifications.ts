"use client"

import * as React from "react"
import { useAuthStore } from "@/lib/auth-store"
import { toast } from "sonner"

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  data: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

interface NotificationCount {
  unreadCount: number
  typeBreakdown: Record<string, number>
}

/**
 * Custom hook for real-time notification polling.
 *
 * Polls the unread count every `pollIntervalMs` (default 5 seconds for near-real-time).
 * When the unread count increases, shows a toast popup for each new notification.
 * Automatically stops polling when user is not authenticated.
 *
 * Also supports browser/device push notifications via the Web Push API (if permission granted).
 * Users can enable this in Settings → Notifications.
 */
export function useNotifications(pollIntervalMs = 5000) {
  const { token, isAuthenticated } = useAuthStore()
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [typeBreakdown, setTypeBreakdown] = React.useState<Record<string, number>>({})
  const [loading, setLoading] = React.useState(false)

  // Track previously-seen notification IDs so we only toast NEW ones
  const seenIdsRef = React.useRef<Set<string>>(new Set())
  const isFirstFetchRef = React.useRef(true)

  const getHeaders = React.useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (token) headers["Authorization"] = `Bearer ${token}`
    return headers
  }, [token])

  // Fetch unread count
  const fetchUnreadCount = React.useCallback(async () => {
    if (!isAuthenticated || !token) return
    try {
      const res = await fetch("/api/notifications/count", { headers: getHeaders() })
      if (res.ok) {
        const data: NotificationCount = await res.json()
        setUnreadCount(data.unreadCount)
        setTypeBreakdown(data.typeBreakdown || {})
      }
    } catch {
      // Silent fail — non-critical
    }
  }, [isAuthenticated, token, getHeaders])

  // Fetch notifications list — also detects NEW notifications and shows toasts + device push
  const fetchNotifications = React.useCallback(async (limit = 10) => {
    if (!isAuthenticated || !token) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?limit=${limit}`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        const fetched: NotificationItem[] = data.notifications ?? []
        setNotifications(fetched)

        // Detect NEW unread notifications (skip on first fetch to avoid spamming toasts on page load)
        if (!isFirstFetchRef.current) {
          const newOnes = fetched.filter(
            (n) => !n.isRead && !seenIdsRef.current.has(n.id)
          )
          for (const n of newOnes) {
            // 1. In-app toast popup
            toast.info(n.title, {
              description: n.message,
              duration: 6000,
            })
            // 2. Device push notification (if permission granted)
            try {
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                new Notification(n.title, {
                  body: n.message,
                  icon: "/nurseos-icon-1024.png",
                  badge: "/favicon-32x32.png",
                  tag: n.id, // prevents duplicate notifications for same ID
                })
              }
            } catch {
              // silent — push API may not be available
            }
          }
        }
        // Mark all fetched IDs as seen
        for (const n of fetched) {
          seenIdsRef.current.add(n.id)
        }
        isFirstFetchRef.current = false
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, token, getHeaders])

  // Mark a notification as read
  const markAsRead = React.useCallback(async (notificationId: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ notificationId }),
      })
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch {
      // Silent fail
    }
  }, [getHeaders])

  // Mark all as read
  const markAllAsRead = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ markAllRead: true }),
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
        setUnreadCount(0)
      }
    } catch {
      // Silent fail
    }
  }, [getHeaders])

  // Dismiss a notification
  const dismissNotification = React.useCallback(async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
        headers: getHeaders(),
      })
      if (res.ok) {
        const dismissed = notifications.find(n => n.id === notificationId)
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        if (dismissed && !dismissed.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch {
      // Silent fail
    }
  }, [getHeaders, notifications])

  // Request browser notification permission (called from Settings page)
  const requestPushPermission = React.useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false
    }
    if (Notification.permission === "granted") return true
    if (Notification.permission === "denied") return false
    const result = await Notification.requestPermission()
    return result === "granted"
  }, [])

  // Poll for unread count + fetch notifications (near-real-time)
  React.useEffect(() => {
    if (!isAuthenticated) return

    // Initial fetch
    fetchUnreadCount()
    fetchNotifications(10)

    // Poll unread count every pollIntervalMs (default 5s)
    const countInterval = setInterval(fetchUnreadCount, pollIntervalMs)
    // Fetch full notifications list every 10 seconds (to detect new ones + show toasts)
    const listInterval = setInterval(() => fetchNotifications(10), 10000)

    return () => {
      clearInterval(countInterval)
      clearInterval(listInterval)
    }
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications, pollIntervalMs])

  // Reset seen IDs when user changes (e.g., logout/login)
  React.useEffect(() => {
    if (!isAuthenticated) {
      seenIdsRef.current = new Set()
      isFirstFetchRef.current = true
    }
  }, [isAuthenticated])

  return {
    notifications,
    unreadCount,
    typeBreakdown,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    requestPushPermission,
  }
}
