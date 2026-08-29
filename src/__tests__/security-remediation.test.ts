/**
 * Security Remediation Regression Tests
 * 
 * These tests verify the six fixed vulnerabilities (F1, F2, F5, F6, F7, F11)
 * using static analysis (no runtime/database required).
 * 
 * Run: npx tsx src/__tests__/security-remediation.test.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const ROOT = path.join(__dirname, '..', '..')
let passed = 0
let failed = 0
let total = 0

function test(name: string, fn: () => boolean | string) {
  total++
  try {
    const result = fn()
    if (result === true) {
      console.log(`  ✓ ${name}`)
      passed++
    } else {
      console.log(`  ✗ ${name}: ${result}`)
      failed++
    }
  } catch (e: any) {
    console.log(`  ✗ ${name}: ${e.message}`)
    failed++
  }
}

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8')
}

// ══════════════════════════════════════════════════════════════════════════════
// F1: PATIENT → NURSE Privilege Escalation
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── F1: PATIENT → NURSE Privilege Escalation ──')

const rolesContent = readFile('src/lib/permissions/roles.ts')

const f1_tests = [
  [
    'PATIENT is included in Role type',
    () => {
      const typeMatch = rolesContent.match(/export type Role = ([^;]+)/)
      if (!typeMatch) return 'Role type not found'
      return typeMatch[1].includes("'PATIENT'")
    }
  ],
  [
    'PATIENT has empty permissions',
    () => rolesContent.includes('PATIENT: []')
  ],
  [
    'PATIENT is in ROLE_HIERARCHY',
    () => rolesContent.includes("'PATIENT'") && rolesContent.includes('ROLE_HIERARCHY')
  ],
  [
    'compose.ts does NOT default to NURSE',
    () => {
      const compose = readFile('src/lib/middleware/compose.ts')
      return !compose.includes("isValidRole(authUser.role) ? authUser.role : 'NURSE'") &&
             !compose.includes("? 'NURSE'")
    }
  ],
  [
    'compose.ts rejects invalid roles with 401',
    () => {
      const compose = readFile('src/lib/middleware/compose.ts')
      return compose.includes('status: 401') &&
             compose.includes('role is not recognized')
    }
  ],
  [
    'PATIENT inherits zero permissions (no NURSE permissions)',
    () => {
      // PATIENT is at the bottom of hierarchy, has empty base, inherits nothing
      return rolesContent.includes('PATIENT: []') &&
             rolesContent.includes("'PATIENT',") &&
             rolesContent.includes('PATIENT < NURSE')
    }
  ],
]

for (const [name, fn] of f1_tests) {
  test(name as string, fn as () => boolean | string)
}

// ══════════════════════════════════════════════════════════════════════════════
// F2: Rate Limiting
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── F2: Rate Limiting ──')

const rateLimitContent = readFile('src/lib/rate-limit.ts')
const loginContent = readFile('src/app/api/auth/login/route.ts')
const resetPwContent = readFile('src/app/api/auth/reset-password/route.ts')
const forgotPwContent = readFile('src/app/api/auth/forgot-password/route.ts')
const registerContent = readFile('src/app/api/auth/register/route.ts')

const f2_tests = [
  [
    'Rate limiter does NOT use db.auditLog (requires userId FK unavailable pre-auth)',
    () => !rateLimitContent.includes('db.auditLog')
  ],
  [
    'Rate limiter uses in-memory sliding window',
    () => rateLimitContent.includes('const store = new Map') && rateLimitContent.includes('store.set')
  ],
  [
    'Rate limiter has cleanup mechanism (setInterval)',
    () => rateLimitContent.includes('setInterval') && rateLimitContent.includes('store.delete')
  ],
  [
    'checkRateLimit is async',
    () => rateLimitContent.includes('async function checkRateLimit') || rateLimitContent.includes('export async function checkRateLimit')
  ],
  [
    'Login uses await checkRateLimit',
    () => loginContent.includes('await checkRateLimit')
  ],
  [
    'Forgot-password uses await checkRateLimit',
    () => forgotPwContent.includes('await checkRateLimit')
  ],
  [
    'Reset-password has rate limiting',
    () => resetPwContent.includes('checkRateLimit') && resetPwContent.includes('429')
  ],
  [
    'Register uses await checkRateLimit',
    () => registerContent.includes('await checkRateLimit')
  ],
  [
    'Rate limit identifier does NOT leak account existence',
    () => !rateLimitContent.includes('email') || rateLimitContent.includes('IP-based')
  ],
]

for (const [name, fn] of f2_tests) {
  test(name as string, fn as () => boolean | string)
}

// ══════════════════════════════════════════════════════════════════════════════
// F5: localStorage Token Exposure
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n-- F5: localStorage Token Exposure --')

const authStoreContent = readFile('src/lib/auth-store.ts')
const callbackContent = readFile('src/app/auth/callback/page.tsx')

const f5_tests = [
  [
    'Auth store uses partialize to exclude token',
    () => authStoreContent.includes('partialize')
  ],
  [
    'Auth store partialize does NOT include token',
    () => {
      const partializeIdx = authStoreContent.indexOf('partialize')
      if (partializeIdx === -1) return 'partialize not found'
      // Get the block from partialize to the closing })
      const block = authStoreContent.slice(partializeIdx, partializeIdx + 300)
      if (block.includes('token')) return 'partialize block references token'
      return true
    }
  ],
  [
    'OAuth callback does NOT store token in localStorage',
    () => {
      const lines = callbackContent.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('localStorage.setItem')) {
          // Check next ~30 lines for token: data.token
          const block = lines.slice(i, i + 30).join('\n')
          if (block.includes('token: data.token')) return 'token: data.token still present in localStorage write'
        }
      }
      return true
    }
  ],
  [
    'Auth store login allows missing token (cookie-only auth)',
    () => !authStoreContent.includes("if (!token)") || authStoreContent.includes('token || null')
  ],
]

for (const [name, fn] of f5_tests) {
  test(name as string, fn as () => boolean | string)
}

// ══════════════════════════════════════════════════════════════════════════════
// F6: CareGrid Cross-Facility PII
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n-- F6: CareGrid Cross-Facility PII --')

const directoryContent = readFile('src/app/api/caregrid/directory/route.ts')

const f6_tests = [
  [
    'Directory has facility_required policy',
    () => directoryContent.includes('facility_required')
  ],
  [
    'Directory does NOT return email',
    () => !directoryContent.includes('email: true')
  ],
  [
    'Directory does NOT return phone',
    () => !directoryContent.includes('phone: true')
  ],
  [
    'Directory does NOT return licenseNumber',
    () => !directoryContent.includes('licenseNumber')
  ],
  [
    'Directory does NOT return userId',
    () => !directoryContent.includes('userId:')
  ],
  [
    'Directory scopes to facility for non-SUPER_ADMIN',
    () => directoryContent.includes('currentFacilityId') && directoryContent.includes('isSuperAdmin')
  ],
  [
    'Directory has audit action',
    () => directoryContent.includes('auditAction')
  ],
]

for (const [name, fn] of f6_tests) {
  test(name as string, fn as () => boolean | string)
}

// ══════════════════════════════════════════════════════════════════════════════
// F7: Database Error Details in Responses
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n-- F7: Database Error Details --')

const f7_tests = [
  [
    'api-error.ts utility exists',
    () => fs.existsSync(path.join(ROOT, 'src/lib/api-error.ts'))
  ],
  [
    'No API route leaks error.message in details field',
    () => {
      const apiDir = path.join(ROOT, 'src/app/api')
      const violations: string[] = []
      function checkDir(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) checkDir(full)
          else if (entry.name.endsWith('.ts') && entry.name !== 'route.ts') return
          else if (entry.name === 'route.ts') {
            const content = fs.readFileSync(full, 'utf-8')
            if (/details:\s*error\.message/.test(content)) {
              violations.push(full.replace(ROOT + '/', ''))
            }
            if (/details:\s*error\?\.message/.test(content)) {
              violations.push(full.replace(ROOT + '/', ''))
            }
          }
        }
      }
      checkDir(apiDir)
      return violations.length === 0 ? true : `Violations in: ${violations.join(', ')}`
    }
  ],
  [
    'No API route leaks error?.message?.substring',
    () => {
      const apiDir = path.join(ROOT, 'src/app/api')
      let found = false
      function checkDir(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) checkDir(full)
          else if (entry.name === 'route.ts') {
            const content = fs.readFileSync(full, 'utf-8')
            if (content.includes('error?.message?.substring')) {
              found = true
            }
          }
        }
      }
      checkDir(apiDir)
      return !found ? true : 'Found error?.message?.substring leak'
    }
  ],
]

for (const [name, fn] of f7_tests) {
  test(name as string, fn as () => boolean | string)
}

// ══════════════════════════════════════════════════════════════════════════════
// F11: 2FA Secret and Verification
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n-- F11: 2FA Secret and Verification --')

const toggleContent = readFile('src/app/api/auth/2fa/toggle/route.ts')
const verifyContent = readFile('src/app/api/auth/2fa/verify/route.ts')
const setupContent = readFile('src/app/api/auth/2fa/setup/route.ts')

const f11_tests = [
  [
    'Toggle endpoint does NOT enable 2FA (twoFactorEnabled: true)',
    () => {
      // Check that toggle endpoint does not WRITE twoFactorEnabled: true
      // The select clause { twoFactorEnabled: true } is a read, not a write.
      const lines = toggleContent.split('\n')
      for (const line of lines) {
        if (line.includes('twoFactorEnabled: true,') && !line.includes('select:')) {
          return 'found data write setting twoFactorEnabled to true: ' + line.trim()
        }
      }
      return true
    }
  ],
  [
    'Toggle endpoint rejects enable requests',
    () => toggleContent.includes('USE_SETUP_FLOW')
  ],
  [
    'Toggle endpoint keeps disable with password',
    () => toggleContent.includes('twoFactorEnabled: false') && toggleContent.includes('password')
  ],
  [
    'Setup uses base32 encoding',
    () => setupContent.includes('base32') || setupContent.includes('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567')
  ],
  [
    'Setup does NOT enable 2FA immediately',
    () => {
      // The setup should only store the secret, not enable 2FA
      const setupLines = setupContent.split('\n')
      const updateIdx = setupLines.findIndex(l => l.includes('twoFactorSecret: secret'))
      if (updateIdx === -1) return 'twoFactorSecret update not found'
      // Check surrounding lines for twoFactorEnabled: true
      const surrounding = setupLines.slice(Math.max(0, updateIdx - 5), updateIdx + 5).join('\n')
      if (surrounding.includes('twoFactorEnabled: true')) return 'setup still enables 2FA immediately'
      return true
    }
  ],
  [
    'Verify enables 2FA only after valid OTP',
    () => verifyContent.includes('twoFactorEnabled: true') && verifyContent.includes('isValid')
  ],
  [
    'Toggle does NOT use base64url encoding',
    () => {
      // Check that base64url is not used in code (comments explaining the bug are fine)
      const lines = toggleContent.split('\n')
      for (const line of lines) {
        if (line.includes('base64url') && !line.trim().startsWith('//')) {
          return 'base64url used in code: ' + line.trim()
        }
      }
      return true
    }
  ],
]

for (const [name, fn] of f11_tests) {
  test(name as string, fn as () => boolean | string)
}

// ══════════════════════════════════════════════════════════════════════════════
// Summary
// ══════════════════════════════════════════════════════════════════════════════
console.log(`\n${'='.repeat(60)}`)
console.log(`Results: ${passed}/${total} passed, ${failed} failed`)
console.log(`${'='.repeat(60)}`)

if (failed > 0) {
  process.exit(1)
}
