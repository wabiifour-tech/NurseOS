'use client'

import { useEffect } from 'react'

/**
 * ThemeProvider reads the saved theme preference from localStorage
 * and applies it to the document by toggling the 'dark' class on <html>.
 * It also listens for changes to localStorage from the Settings page.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function applyTheme() {
      try {
        const savedTheme = localStorage.getItem('nurseos-theme') as 'light' | 'dark' | 'system' | null
        const theme = savedTheme || 'system'

        const root = document.documentElement
        root.classList.remove('light', 'dark')

        if (theme === 'dark') {
          root.classList.add('dark')
        } else if (theme === 'light') {
          root.classList.remove('dark')
        } else {
          // System preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            root.classList.add('dark')
          }
        }
      } catch {}
    }

    // Apply on mount
    applyTheme()

    // Listen for storage changes (from Settings page in another tab or same tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nurseos-theme') {
        applyTheme()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Also listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => {
      try {
        const savedTheme = localStorage.getItem('nurseos-theme')
        if (!savedTheme || savedTheme === 'system') {
          applyTheme()
        }
      } catch {}
    }
    mediaQuery.addEventListener('change', handleMediaChange)

    // Poll for same-tab changes (localStorage 'storage' event only fires cross-tab)
    const interval = setInterval(applyTheme, 2000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      mediaQuery.removeEventListener('change', handleMediaChange)
      clearInterval(interval)
    }
  }, [])

  return <>{children}</>
}
