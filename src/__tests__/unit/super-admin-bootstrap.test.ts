import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the database module BEFORE importing the bootstrap module
const mockFindFirst = vi.fn()
const mockFindUnique = vi.fn()
const mockUpdate = vi.fn()
const mockCreate = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    adminProfile: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
    // Mock $transaction — calls the callback with a tx that proxies to db
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      mockTransaction()
      // The tx object uses the same mocks (Prisma interactive tx proxies)
      const tx = {
        adminProfile: {
          findFirst: (...args: unknown[]) => mockFindFirst(...args),
          findUnique: (...args: unknown[]) => mockFindUnique(...args),
          update: (...args: unknown[]) => mockUpdate(...args),
          create: (...args: unknown[]) => mockCreate(...args),
        },
        user: {
          update: (...args: unknown[]) => mockUpdate(...args),
        },
        auditLog: {
          create: (...args: unknown[]) => mockCreate(...args),
        },
      }
      return fn(tx)
    },
  },
}))

// Import AFTER mocking
const { shouldAttemptBootstrap, bootstrapSuperAdmin } = await import('@/lib/super-admin-bootstrap')

describe('Super Admin Bootstrap', () => {
  const FOUNDER = 'founder@nurseos.digital'
  const RANDOM_USER = 'someone@example.com'
  const USER_ID = 'user_abc123'

  beforeEach(() => {
    vi.resetAllMocks()
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: 'audit_1' })
    mockTransaction.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // === Property 1: Only executes when NO Super Admin exists ===
  describe('Property 1: Only when no SA exists', () => {
    it('should bootstrap when zero users have accessLevel >= 10', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      // Pre-tx SA check (Step 2): no SA
      // Inside-tx SA re-check: no SA
      mockFindFirst.mockResolvedValue(null)
      // User lookup (Step 3)
      mockFindUnique
        .mockResolvedValueOnce({ id: USER_ID, email: FOUNDER, role: 'ADMIN', status: 'ACTIVE' })
        .mockResolvedValueOnce(null) // AdminProfile lookup inside tx

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(true)
      expect(mockTransaction).toHaveBeenCalledTimes(1)
    })

    it('should NOT bootstrap when a Super Admin already exists', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      mockFindFirst.mockResolvedValue({ id: 'existing_sa' })

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(false)
      expect(result.reason).toBe('Super Admin already exists')
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('short-circuits early when SA exists (no transaction, no user queries)', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      mockFindFirst.mockResolvedValue({ id: 'existing_sa' })

      await bootstrapSuperAdmin(USER_ID)

      expect(mockFindFirst).toHaveBeenCalledTimes(1)
      expect(mockFindUnique).not.toHaveBeenCalled()
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('handles concurrent SA creation via transaction re-check', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      // Step 2 (pre-tx): no SA
      mockFindFirst
        .mockResolvedValueOnce(null)             // Step 2: no SA
        .mockResolvedValueOnce({ id: 'racer' })  // Inside tx: SA appeared (concurrent)
      mockFindUnique
        .mockResolvedValueOnce({ id: USER_ID, email: FOUNDER, role: 'ADMIN', status: 'ACTIVE' })

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(false)
      expect(result.reason).toBe('Super Admin already exists (concurrent request)')
      // Transaction ran but rolled back — no profile created
      const profileCreates = mockCreate.mock.calls.filter(
        (c: unknown[]) => c[0] && typeof c[0] === 'object' && 'accessLevel' in (c[0] as object)
      )
      expect(profileCreates.length).toBe(0)
    })
  })

  // === Property 2: Only matches FOUNDER_EMAIL exactly ===
  describe('Property 2: Exact FOUNDER_EMAIL match required', () => {
    it('bootstraps when email exactly matches FOUNDER_EMAIL', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      mockFindFirst.mockResolvedValue(null)
      mockFindUnique
        .mockResolvedValueOnce({ id: USER_ID, email: FOUNDER, role: 'ADMIN', status: 'ACTIVE' })
        .mockResolvedValueOnce(null)

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(true)
    })

    it('rejects email that differs from FOUNDER_EMAIL', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      mockFindFirst.mockResolvedValue(null)
      mockFindUnique.mockResolvedValue({
        id: USER_ID, email: RANDOM_USER, role: 'ADMIN', status: 'ACTIVE',
      })

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(false)
      expect(result.reason).toBe('Email does not match FOUNDER_EMAIL')
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('rejects when FOUNDER_EMAIL is not set', async () => {
      delete process.env.FOUNDER_EMAIL

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(false)
      expect(result.reason).toBe('FOUNDER_EMAIL not configured')
    })

    it('matches case-insensitively', async () => {
      process.env.FOUNDER_EMAIL = 'Founder@NurseOS.Digital'
      mockFindFirst.mockResolvedValue(null)
      mockFindUnique
        .mockResolvedValueOnce({ id: USER_ID, email: 'founder@nurseos.digital', role: 'ADMIN', status: 'ACTIVE' })
        .mockResolvedValueOnce(null)

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(true)
    })

    it('rejects partial email matches (different local part)', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      mockFindFirst.mockResolvedValue(null)
      mockFindUnique.mockResolvedValue({
        id: USER_ID, email: 'notfounder@nurseos.digital', role: 'ADMIN', status: 'ACTIVE',
      })

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(false)
    })

    it('rejects partial email matches (different domain)', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      mockFindFirst.mockResolvedValue(null)
      mockFindUnique.mockResolvedValue({
        id: USER_ID, email: 'founder@evil.com', role: 'ADMIN', status: 'ACTIVE',
      })

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(false)
    })
  })

  // === Property 3: Cannot elevate any other account ===
  describe('Property 3: Cannot elevate other accounts', () => {
    it('does NOT elevate user with different email even if no SA exists', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      mockFindFirst.mockResolvedValue(null)
      mockFindUnique.mockResolvedValue({
        id: USER_ID, email: 'attacker@evil.com', role: 'ADMIN', status: 'ACTIVE',
      })

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(false)
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('correctly upgrades non-ADMIN role to ADMIN (necessary for SA pattern)', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      mockFindFirst.mockResolvedValue(null)
      mockFindUnique
        .mockResolvedValueOnce({ id: USER_ID, email: FOUNDER, role: 'NURSE', status: 'ACTIVE' })
        .mockResolvedValueOnce(null)

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: USER_ID }, data: { role: 'ADMIN' } })
      )
    })
  })

  // === Property 4: Idempotent ===
  describe('Property 4: Idempotent', () => {
    it('second call is a no-op because SA already exists', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER

      // Call 1: no SA outside tx, no SA inside tx, user found, no profile
      mockFindFirst
        .mockResolvedValueOnce(null)   // Step 2 pre-tx
        .mockResolvedValueOnce(null)   // tx re-check
        .mockResolvedValueOnce({ id: 'p1' }) // Call 2: Step 2 pre-tx
      mockFindUnique
        .mockResolvedValueOnce({ id: USER_ID, email: FOUNDER, role: 'ADMIN', status: 'ACTIVE' })
        .mockResolvedValueOnce(null)   // AdminProfile lookup in tx

      const r1 = await bootstrapSuperAdmin(USER_ID)
      expect(r1.bootstrapped).toBe(true)

      const r2 = await bootstrapSuperAdmin(USER_ID)
      expect(r2.bootstrapped).toBe(false)
      expect(r2.reason).toBe('Super Admin already exists')
    })

    it('3 sequential calls produce exactly 1 SA', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER

      // Call 1: pre-tx null, tx-recheck null, user, no profile
      // Call 2: pre-tx {p1}
      // Call 3: pre-tx {p1}
      mockFindFirst
        .mockResolvedValueOnce(null)   // Call 1 Step 2
        .mockResolvedValueOnce(null)   // Call 1 tx re-check
        .mockResolvedValue({ id: 'p1' }) // Calls 2+3

      mockFindUnique
        .mockResolvedValueOnce({ id: USER_ID, email: FOUNDER, role: 'ADMIN', status: 'ACTIVE' })
        .mockResolvedValueOnce(null)   // Call 1 tx: AdminProfile lookup

      const r1 = await bootstrapSuperAdmin(USER_ID)
      const r2 = await bootstrapSuperAdmin(USER_ID)
      const r3 = await bootstrapSuperAdmin(USER_ID)

      expect(r1.bootstrapped).toBe(true)
      expect(r2.bootstrapped).toBe(false)
      expect(r3.bootstrapped).toBe(false)
    })
  })

  // === shouldAttemptBootstrap pre-check ===
  describe('shouldAttemptBootstrap (pre-check)', () => {
    it('returns false when FOUNDER_EMAIL is not set', () => {
      delete process.env.FOUNDER_EMAIL
      expect(shouldAttemptBootstrap('any@email.com')).toBe(false)
    })

    it('returns false for non-matching email', () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      expect(shouldAttemptBootstrap(RANDOM_USER)).toBe(false)
    })

    it('returns true for exact match', () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      expect(shouldAttemptBootstrap(FOUNDER)).toBe(true)
    })

    it('returns true for case-insensitive match', () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      expect(shouldAttemptBootstrap('FOUNDER@NURSEOS.DIGITAL')).toBe(true)
    })

    it('returns true for trimmed match', () => {
      process.env.FOUNDER_EMAIL = '  founder@nurseos.digital  '
      expect(shouldAttemptBootstrap('founder@nurseos.digital')).toBe(true)
    })

    it('returns false for empty email', () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      expect(shouldAttemptBootstrap('')).toBe(false)
    })
  })

  // === Edge cases ===
  describe('Edge cases', () => {
    it('handles user not found', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      mockFindFirst.mockResolvedValue(null)
      mockFindUnique.mockResolvedValue(null)

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(false)
      expect(result.reason).toBe('User not found')
    })

    it('upgrades existing AdminProfile from 5 to 10', async () => {
      process.env.FOUNDER_EMAIL = FOUNDER
      mockFindFirst.mockResolvedValue(null)
      mockFindUnique
        .mockResolvedValueOnce({ id: USER_ID, email: FOUNDER, role: 'ADMIN', status: 'ACTIVE' })
        .mockResolvedValueOnce({ id: 'p1', userId: USER_ID, accessLevel: 5 })

      const result = await bootstrapSuperAdmin(USER_ID)
      expect(result.bootstrapped).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: { accessLevel: 10 },
        })
      )
    })
  })
})
