'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface ShortcutAction {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: () => void
}

export function useKeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const shortcuts: ShortcutAction[] = [
      {
        key: 'k',
        ctrl: true,
        description: 'Focus search',
        action: () => {
          const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]')
          if (searchInput) {
            searchInput.focus()
            searchInput.select()
          }
        },
      },
      {
        key: 'b',
        ctrl: true,
        description: 'Toggle sidebar',
        action: () => {
          const toggle = document.querySelector<HTMLButtonElement>('[data-sidebar="trigger"]')
          if (toggle) toggle.click()
        },
      },
      {
        key: '1',
        ctrl: true,
        description: 'Go to Dashboard',
        action: () => router.push('/dashboard'),
      },
      {
        key: '2',
        ctrl: true,
        description: 'Go to NurseAI',
        action: () => router.push('/nurseai/patients'),
      },
      {
        key: '3',
        ctrl: true,
        description: 'Go to CareGrid',
        action: () => router.push('/caregrid/facilities'),
      },
      {
        key: '4',
        ctrl: true,
        description: 'Go to Analytics',
        action: () => router.push('/analytics'),
      },
      {
        key: '5',
        ctrl: true,
        description: 'Go to NurseID',
        action: () => router.push('/nurseid/profile'),
      },
      {
        key: '6',
        ctrl: true,
        description: 'Go to Academy',
        action: () => router.push('/academy/courses'),
      },
      {
        key: ',',
        ctrl: true,
        description: 'Open Settings',
        action: () => router.push('/settings'),
      },
      {
        key: '/',
        ctrl: true,
        description: 'Open Help & Support',
        action: () => router.push('/help'),
      },
    ]

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      const matchingShortcut = shortcuts.find(s => {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase()
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey
        const altMatch = s.alt ? e.altKey : !e.altKey
        return keyMatch && ctrlMatch && shiftMatch && altMatch
      })

      if (matchingShortcut) {
        e.preventDefault()
        matchingShortcut.action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, pathname])
}
