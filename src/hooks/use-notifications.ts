"use client"

import * as React from "react"
import { useAuthStore } from "@/lib/auth-store"

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
 * Fetches unread count every 30 seconds and notifications on demand.
 * Automatically stops polling when user is not authenticated.
 */
export function useNotifications(pollIntervalMs = 30000) {
  const { token, isAuthenticated } = useAuthStore()
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [typeBreakdown, setTypeBreakdown] = React.useState<Record<string, number>>({})
  const [loading, setLoading] = React.useState(false)

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

  // Fetch notifications list
  const fetchNotifications = React.useCallback(async (limit = 10) => {
    if (!isAuthenticated || !token) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?limit=${limit}`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
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

  // Poll for unread count
  React.useEffect(() => {
    if (!isAuthenticated) return

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, pollIntervalMs)
    return () => clearInterval(interval)
  }, [isAuthenticated, fetchUnreadCount, pollIntervalMs])

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
  }
}
