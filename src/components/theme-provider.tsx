'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * ThemeProvider wraps next-themes' ThemeProvider to manage light/dark/system
 * theme switching. It uses the "class" attribute strategy (adds/removes "dark"
 * class on <html>) and persists the user's preference to localStorage under
 * the key "nurseos-theme".
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="nurseos-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
