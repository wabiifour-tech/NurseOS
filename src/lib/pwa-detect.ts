/**
 * PWA Detection Utilities
 *
 * Google OAuth blocks requests from embedded/standalone browsers (Error 403: disallowed_useragent).
 * These helpers detect when the app is running as an installed PWA so we can
 * open the OAuth flow in the system browser instead.
 */

/**
 * Returns true if the app is running in PWA standalone mode
 * (installed to home screen on Android/iOS).
 *
 * Checks:
 * - CSS display-mode media query (most reliable, works on both Android & iOS)
 * - iOS Safari standalone navigator property
 * - Android TWA (Trusted Web Activity) referrer check
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false

  // CSS display-mode check (works on Android Chrome, iOS Safari, desktop)
  const isStandaloneMQ = window.matchMedia('(display-mode: standalone)').matches

  // iOS Safari standalone property
  const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true

  // Android TWA detection
  const isTWA = document.referrer.includes('android-app://')

  return isStandaloneMQ || isIOSStandalone || isTWA
}

/**
 * Returns true if the device is iOS (iPhone, iPad, iPod).
 * iOS PWAs require special handling because window.open() does NOT
 * open the system browser — it stays in the same WKWebView.
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false

  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * Open a URL in the system browser from a PWA.
 *
 * - On Android: `window.open(url)` opens Chrome (system browser).
 * - On iOS: `window.open()` stays in the WebView, so we use a hidden
 *   `<a target="_blank">` element and trigger a click — iOS Safari
 *   interprets this as opening an external link in Safari.
 *
 * Must be called from a user-initiated event handler (e.g. onClick).
 */
export function openInSystemBrowser(url: string): Window | null {
  if (isIOSDevice()) {
    // On iOS PWA, create and click a hidden <a target="_blank"> to open Safari
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.target = '_blank'
    anchor.rel = 'noopener'
    // Style it to be invisible but still clickable
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    // Clean up after a short delay
    setTimeout(() => document.body.removeChild(anchor), 100)
    return null
  }

  // On Android / desktop, window.open() opens the system browser
  return window.open(url, '_blank', 'noopener')
}