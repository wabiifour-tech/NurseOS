/**
 * Script to fix error.message leaks across API routes.
 * Replaces { error: '...', details: error.message } with safeErrorResponse().
 * 
 * Run: npx tsx scripts/fix-error-leaks.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const SRC_DIR = path.join(__dirname, '..', 'src', 'app', 'api')

// Files that leak error.message with their specific patterns
const TARGETS: { file: string; replacements: { old: string; new: string }[] }[] = [
  {
    file: 'course-materials/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to fetch materials', details: error.message }`,
        new: `{ error: 'Failed to fetch materials' }`,
      },
      {
        old: `{ error: 'Failed to upload material', details: error.message }`,
        new: `{ error: 'Failed to upload material' }`,
      },
    ],
  },
  {
    file: 'course-materials/share/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to share material', details: error.message }`,
        new: `{ error: 'Failed to share material' }`,
      },
    ],
  },
  {
    file: 'course-materials/bulk/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to bulk upload materials', details: error.message }`,
        new: `{ error: 'Failed to bulk upload materials' }`,
      },
    ],
  },
  {
    file: 'course-materials/presign/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to generate upload URL', details: error.message }`,
        new: `{ error: 'Failed to generate upload URL' }`,
      },
    ],
  },
  {
    file: 'course-materials/[id]/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to fetch material', details: error.message }`,
        new: `{ error: 'Failed to fetch material' }`,
      },
      {
        old: `{ error: 'Failed to delete material', details: error.message }`,
        new: `{ error: 'Failed to delete material' }`,
      },
    ],
  },
  {
    file: 'course-materials/[id]/analytics/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to fetch analytics', details: error.message }`,
        new: `{ error: 'Failed to fetch analytics' }`,
      },
    ],
  },
  {
    file: 'course-materials/[id]/track/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to track event', details: error.message }`,
        new: `{ error: 'Failed to track event' }`,
      },
    ],
  },
  {
    file: 'course-materials/[id]/comments/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to fetch comments', details: error.message }`,
        new: `{ error: 'Failed to fetch comments' }`,
      },
      {
        old: `{ error: 'Failed to create comment', details: error.message }`,
        new: `{ error: 'Failed to create comment' }`,
      },
    ],
  },
  {
    file: 'course-materials/shared/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to fetch shared materials', details: error.message }`,
        new: `{ error: 'Failed to fetch shared materials' }`,
      },
    ],
  },
  {
    file: 'course-materials/shared/[id]/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to update share', details: error.message }`,
        new: `{ error: 'Failed to update share' }`,
      },
    ],
  },
  {
    file: 'email/send/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to send email', details: error.message }`,
        new: `{ error: 'Failed to send email' }`,
      },
    ],
  },
  {
    file: 'email/broadcast/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to broadcast email', details: error.message }`,
        new: `{ error: 'Failed to broadcast email' }`,
      },
    ],
  },
  {
    file: 'seed/courses/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to seed courses', details: error.message }`,
        new: `{ error: 'Failed to seed courses' }`,
      },
      {
        old: `{ error: 'Failed to check course seed status', details: error.message }`,
        new: `{ error: 'Failed to check course seed status' }`,
      },
    ],
  },
  {
    file: 'nurseacademy/seed-courses/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to import courses', details: error.message }`,
        new: `{ error: 'Failed to import courses' }`,
      },
      {
        old: `{ error: 'Failed to fetch course stats', details: error.message }`,
        new: `{ error: 'Failed to fetch course stats' }`,
      },
    ],
  },
  {
    file: 'setup/test-accounts/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to create test accounts', details: error.message }`,
        new: `{ error: 'Failed to create test accounts' }`,
      },
    ],
  },
  {
    file: 'auth/dev-login/route.ts',
    replacements: [
      {
        old: `{ error: 'Failed to log in', details: error.message }`,
        new: `{ error: 'Failed to log in' }`,
      },
    ],
  },
]

// The analytics/dashboard has a slightly different pattern
const SPECIAL_TARGETS: { file: string; old: string; new: string }[] = [
  {
    file: 'nurseanalytics/dashboard/route.ts',
    old: `details: error instanceof Error ? error.message : 'Unknown error'`,
    new: `details: 'Error occurred while processing your request'`,
  },
]

let totalReplacements = 0
let filesModified = 0

for (const target of TARGETS) {
  const filePath = path.join(SRC_DIR, target.file)
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP (not found): ${target.file}`)
    continue
  }

  let content = fs.readFileSync(filePath, 'utf-8')
  let fileChanged = false

  for (const r of target.replacements) {
    if (content.includes(r.old)) {
      content = content.replace(r.old, r.new)
      totalReplacements++
      fileChanged = true
    } else {
      console.log(`  PATTERN NOT FOUND in ${target.file}: ${r.old.slice(0, 60)}...`)
    }
  }

  if (fileChanged) {
    fs.writeFileSync(filePath, content, 'utf-8')
    filesModified++
    console.log(`  FIXED: ${target.file}`)
  }
}

for (const target of SPECIAL_TARGETS) {
  const filePath = path.join(SRC_DIR, target.file)
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP (not found): ${target.file}`)
    continue
  }

  let content = fs.readFileSync(filePath, 'utf-8')
  if (content.includes(target.old)) {
    content = content.replace(target.old, target.new)
    fs.writeFileSync(filePath, content, 'utf-8')
    totalReplacements++
    filesModified++
    console.log(`  FIXED: ${target.file}`)
  }
}

console.log(`\nTotal: ${filesModified} files modified, ${totalReplacements} replacements made`)
