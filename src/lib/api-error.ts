/**
 * Centralized safe API error handling.
 * 
 * External responses contain only generic messages.
 * Internal logging retains full diagnostic information.
 * 
 * Usage in API routes:
 *   } catch (error) {
 *     return safeErrorResponse(error, 'Failed to fetch data')
 *   }
 */

/**
 * Classify an error to determine the appropriate HTTP status.
 */
function classifyError(error: unknown): 'client' | 'server' | 'db_unavailable' {
  const msg = (error as Error)?.message || ''
  
  // Known client errors that are safe to expose with generic messages
  if (
    msg.includes('P2002') || 
    msg.includes('Unique constraint') ||
    msg.includes('P2025') ||
    msg.includes('Record to update not found') ||
    msg.includes('P2028') ||
    msg.includes('Transaction API error')
  ) {
    return 'client'
  }
  
  // Database connection errors
  if (
    msg.includes('connect') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('P1001') ||
    msg.includes('server is not reachable') ||
    msg.includes('does not exist')
  ) {
    return 'db_unavailable'
  }
  
  return 'server'
}

/**
 * Log the full error internally for debugging.
 */
function logError(context: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`${context}:`, error.message)
    // Stack trace is logged to server logs only, never sent to client
  } else {
    console.error(`${context}:`, error)
  }
}

/**
 * Create a safe API error response.
 * Returns a generic message to the client — never exposes internal error details.
 * 
 * @param error - The caught error
 * @param context - A short description of what operation failed (for logging)
 * @param options - Optional overrides
 */
export function safeErrorResponse(
  error: unknown,
  context: string,
  options?: {
    /** Override the default client-facing message */
    message?: string
    /** Override the default HTTP status */
    status?: number
    /** Include a structured error code for known error patterns */
    code?: string
  },
): Response {
  // Always log the full error internally
  logError(context, error)
  
  const classification = classifyError(error)
  const msg = (error as Error)?.message || ''
  
  // Database unavailable
  if (classification === 'db_unavailable') {
    return Response.json(
      { error: 'Service temporarily unavailable. Please try again.', code: 'DB_UNAVAILABLE' },
      { status: 503 },
    )
  }
  
  // Known client errors (unique constraint, etc.)
  if (classification === 'client') {
    if (msg.includes('P2002') || msg.includes('Unique constraint')) {
      return Response.json(
        { error: options?.message || 'A duplicate record already exists.', code: options?.code || 'CONFLICT' },
        { status: 409 },
      )
    }
    if (msg.includes('P2025') || msg.includes('Record to update not found')) {
      return Response.json(
        { error: options?.message || 'The requested resource was not found.', code: options?.code || 'NOT_FOUND' },
        { status: 404 },
      )
    }
  }
  
  // Default: generic server error
  const status = options?.status || 500
  const message = options?.message || 'An internal error occurred. Please try again.'
  
 const body: Record<string, unknown> = { error: message }
  if (options?.code) body.code = options.code
  
  return Response.json(body, { status })
}
