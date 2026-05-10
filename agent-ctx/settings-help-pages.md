# Task: Create Settings and Help & Support Pages

## Summary

Created two missing pages that the NurseOS sidebar links to but didn't exist yet:

### 1. Settings Page (`/src/app/(dashboard)/settings/page.tsx`)
- **Profile Settings**: Shows current user's name, email, role (from `useAuthStore`), with edit mode for updating first name, last name, email, phone, bio, and avatar
- **Notification Preferences**: 6 toggle switches (patient alerts, appointment reminders, medication alerts, referral updates, system updates, email digest) managed with local state
- **Appearance**: Theme selector (light/dark/system) with visual buttons, compact mode toggle, collapsed sidebar toggle
- **Security**: Two-factor authentication toggle, password change form with current/new/confirm fields, show/hide password toggles, password strength indicator
- **Data & Privacy**: Data retention period selector, usage analytics toggle, data export button, delete account with confirmation
- Uses Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Badge, Separator, Switch, Avatar, Textarea from shadcn components
- Uses emerald/teal color scheme consistent with NurseOS
- All interactive with real state management

### 2. Help & Support Page (`/src/app/(dashboard)/help/page.tsx`)
- **Quick Help Banner**: Shows support email and response time
- **FAQ Section**: 12 FAQs across 6 categories (NurseAI, CareGrid, Analytics, NurseID, Academy, Account) with category filter buttons and Accordion component for expand/collapse
- **Contact Support Form**: Name, email, subject, message fields with validation and success state animation
- **Quick Links**: 6 cards linking to key platform modules (NurseAI, CareGrid, Analytics, NurseID, Academy, Dashboard) with icons and descriptions
- **Keyboard Shortcuts**: 3 categories (Navigation, NurseAI, General) with formatted keyboard shortcut keys and a pro tip
- Uses Accordion, Card, Button, Input, Label, Badge, Separator, Textarea from shadcn components
- Uses emerald/teal color scheme consistent with NurseOS

### Verification
- Both pages return HTTP 200 from the dev server
- No compilation errors
- Lint passes (only pre-existing lint error in `src/app/page.tsx`, unrelated to these pages)
