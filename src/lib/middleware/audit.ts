/**
 * NurseOS audit() Middleware — v4 Architecture Freeze
 *
 * Records authorization decisions to AuditLog.
 * Runs near the end of the chain (before handler) to capture
 * the full context including facility and permissions.
 *
 * Only writes to DB for HIGH/CRITICAL severity actions.
 * INFO/WARNING actions are logged to console only (Phase 1 optimization).
 */

import type { Middleware, MiddlewareContext } from './types'
import { db } from '@/lib/db'

/**
 * Create an audit() middleware.
 *
 * @param action - Audit action name (e.g., 'patient.list', 'consultation.create')
 * @param resource - Resource type (e.g., 'patient', 'consultation')
 * @param severity - Default severity if not overridden by denial
 */
export function createAuditMiddleware(
  action: string,
  resource: string,
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL' = 'INFO',
): Middleware {
  return async function audit(ctx: MiddlewareContext): Promise<void> {
    // Set audit metadata on context for the denial layer to enrich
    ctx.audit = {
      severity,
      action,
      resource,
      outcome: 'ALLOW',
    }
  }
}

/**
 * Write an audit log entry to the database.
 * Called after the handler completes.
 *
 * Phase 1: Only writes for HIGH/CRITICAL to avoid DB overhead.
 */
export async function writeAuditLog(
  ctx: MiddlewareContext,
  response: Response,
  durationMs: number,
): Promise<void> {
  const audit = ctx.audit
  if (!audit) return

  // Phase 1: only persist HIGH/CRITICAL
  if (audit.severity === 'INFO' || audit.severity === 'WARNING') {
    console.log(
      `[audit:${audit.severity}] ${ctx.user.role} ${audit.action} → ${audit.outcome} (${durationMs}ms)`,
    )
    return
  }

  try {
    await db.auditLog.create({
      data: {
        userId: ctx.user.id,
        role: ctx.role,
        action: audit.action,
        resourceType: audit.resource,
        outcome: audit.outcome,
        reasonCode: audit.reasonCode || null,
        facilityId: ctx.facilityId,
        ipAddress: ctx.request.headers.get('x-forwarded-for') ||
          ctx.request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: ctx.request.headers.get('user-agent') || null,
        duration: durationMs,
        details: audit.details ? JSON.stringify(audit.details) : null,
      },
    })
  } catch (error) {
    // Audit failures must never break the request
    console.error('[audit] Failed to write audit log:', error)
  }
}
