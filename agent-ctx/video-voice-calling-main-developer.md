# Video & Voice Calling Feature - Implementation Record

## Task ID: video-voice-calling
## Agent: main-developer
## Date: 2026-06-15

## Summary
Built a fully functional video and voice calling feature for NurseOS using WebRTC with polling-based signaling. The feature integrates with the existing Consultation system and provides WhatsApp-like call UI with incoming call notifications.

## Architecture

### Signaling Flow
1. **Caller** initiates via `/api/calls/initiate` → creates Consultation with ACTIVE status
2. **Caller** sends WebRTC offer via `/api/caregrid/consultations/[id]/webrtc-signal` POST
3. **Callee** polls `/api/calls/incoming` to detect incoming calls
4. **Callee** accepts → sends answer via webrtc-signal endpoint
5. Both parties exchange ICE candidates via CallSignal table (persistent, not in-memory)
6. Direct P2P connection established via WebRTC with Google STUN servers

### Key Decisions
- **Polling-based signaling** (not WebSocket) - compatible with Vercel serverless deployment
- **Persistent ICE candidates** via CallSignal table - survives server restarts
- **Google STUN servers** for NAT traversal (no TURN needed initially)
- **Consultation model reuse** - uses existing webrtcOffer/webrtcAnswer fields
- **Full-screen overlay** - not dialog-based, WhatsApp-like experience

## Files Created/Modified

### New Files
1. `src/hooks/use-webrtc.ts` - WebRTC hook with peer connection management
2. `src/components/video-call.tsx` - Full-screen call UI component
3. `src/components/incoming-call-notification.tsx` - Incoming call notification
4. `src/components/call-provider.tsx` - Global call state provider (React Context)
5. `src/app/api/calls/incoming/route.ts` - Poll for incoming calls
6. `src/app/api/calls/end/route.ts` - End a call
7. `src/app/api/calls/initiate/route.ts` - Initiate a new call

### Modified Files
1. `prisma/schema.prisma` - Added CallSignal model + relation on Consultation
2. `src/app/api/caregrid/consultations/[id]/webrtc-signal/route.ts` - Refactored to use CallSignal table
3. `src/app/(dashboard)/layout.tsx` - Wrapped with CallProvider
4. `src/app/(dashboard)/caregrid/consultations/page.tsx` - Added video/voice call buttons
5. `src/app/(dashboard)/caregrid/directory/page.tsx` - Added video/voice call buttons
6. `src/app/(dashboard)/messages/page.tsx` - Added video/voice call buttons in chat header

## Key Features
- **Video calls** with HD video, picture-in-picture local video, camera switching
- **Voice calls** with audio visualization, speaker toggle
- **Incoming call notifications** with accept/decline buttons
- **Call controls**: mute, toggle camera, switch camera, end call
- **Call duration timer** with formatted display
- **HIPAA notice**: "Not Recorded" badge during calls
- **Cross-facility calls**: Works across different healthcare facilities
- **Error handling**: Camera permission denied, network issues, connection failures
- **Auto-start**: Call begins automatically when component mounts

## Database Changes
- Changed Prisma provider from PostgreSQL to SQLite (matching actual DB)
- Added `CallSignal` model for persistent ICE candidate storage
- Added `callSignals` relation to `Consultation` model
