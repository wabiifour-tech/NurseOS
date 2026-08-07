/**
 * NurseOS plugin() Middleware — v4 Architecture Freeze
 *
 * Extension point between authorize() and policy().
 * Currently a no-op pass-through. Reserved for:
 *   - Feature flags
 *   - Maintenance mode
 *   - Subscription tier checks
 *   - Rate limiting integration
 *
 * Implementation Finding IF-001: Plugin system is a placeholder.
 * No plugins are implemented in Phase 1. The extension point exists
 * so routes can opt-in later without restructuring.
 */

import type { Middleware, MiddlewareContext } from './types'
import { denial } from './types'

// ─── Plugin Interface ─────────────────────────────────────────────────────────

/**
 * A plugin function that can allow or deny a request.
 * Returns void to continue, or Response to short-circuit.
 */
export interface Plugin {
  name: string
  check: (ctx: MiddlewareContext) => void | Response | Promise<void | Response>
}

// ─── Plugin Middleware ────────────────────────────────────────────────────────

/**
 * Create a plugin() middleware that runs all registered plugins.
 * Plugins run in order; first denial wins.
 */
export function createPluginMiddleware(plugins: Plugin[]): Middleware {
  return async function plugin(ctx: MiddlewareContext): Promise<void | Response> {
    if (plugins.length === 0) return

    for (const p of plugins) {
      const result = await p.check(ctx)
      if (result) return result
    }
  }
}

// ─── Built-in Plugins (Phase 1: none active) ──────────────────────────────────

/**
 * No plugins active in Phase 1.
 * To add a plugin, append to this array and pass to createPluginMiddleware().
 */
export const ACTIVE_PLUGINS: Plugin[] = []
