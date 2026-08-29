#!/bin/bash
# NurseOS Security Remediation — Runtime Verification v2
# Post-deployment testing against https://www.nurseos.digital
set -euo pipefail
BASE="https://www.nurseos.digital"
P=""; F=""; S=""
log(){ local st="$1" id="$2" msg="$3"; if [ "$st" = "PASS" ]; then P="$P[$id]"; elif [ "$st" = "FAIL" ]; then F="$F[$id]"; else S="$S[$id]"; fi; echo "  [$st] $id: $msg"; }

echo "=========================================="
echo "NurseOS Runtime Verification (Post-Deploy)"
echo "Target: $BASE"
echo "Time: $(date -u)"
echo "=========================================="
echo ""

# ═══ F1: PATIENT Privilege Escalation ═════════════════════════════
echo "=== F1: PATIENT Privilege Escalation ==="

PAT_RESP=$(curl -s "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"strix-patient-a@nurseos.digital","password":"PatientTest123"}')

PAT_ERR=$(echo "$PAT_RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("error",""))' 2>/dev/null || echo "")
PAT_TOK=$(echo "$PAT_RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("token",""))' 2>/dev/null || echo "")

if echo "$PAT_ERR" | rg -qi 'too many|rate'; then
  log "SKIP" "F1" "Rate limited — cannot test (IP cooldown active)"
  PAT_TOK=""
elif [ -z "$PAT_TOK" ] && [ -n "$PAT_ERR" ]; then
  if echo "$PAT_ERR" | rg -qi 'role|recognize|unauthorized'; then
    log "PASS" "F1.0" "PATIENT login rejected at compose: $PAT_ERR"
  else
    log "FAIL" "F1.0" "PATIENT login error (unexpected): $PAT_ERR"
  fi
  PAT_TOK=""
else
  log "INFO" "F1.0" "PATIENT login succeeded (token len=${#PAT_TOK}) — testing endpoint access"
fi

if [ -n "$PAT_TOK" ]; then
  for EP in "caregrid/directory" "nurseai/patients" "course-materials"; do
    CODE=$(curl -s -o /tmp/f1_ep.json -w '%{http_code}' "$BASE/api/$EP" -H "Authorization: Bearer $PAT_TOK")
    if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
      log "PASS" "F1.$EP" "PATIENT -> /api/$EP: HTTP $CODE (blocked)"
    else
      log "FAIL" "F1.$EP" "PATIENT -> /api/$EP: HTTP $CODE (expected 401/403)"
    fi
  done
else
  log "INFO" "F1.endpoints" "No PATIENT token — cannot test endpoint access (this is correct if PATIENT was rejected at login/middleware)"
fi

# NURSE baseline
NUR_RESP=$(curl -s "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"strix-test@nurseos.digital","password":"NurseTest123"}')

NUR_ERR=$(echo "$NUR_RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("error",""))' 2>/dev/null || echo "")
NUR_TOK=$(echo "$NUR_RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("token",""))' 2>/dev/null || echo "")

if echo "$NUR_ERR" | rg -qi 'too many|rate'; then
  log "SKIP" "F1.NURSE" "Rate limited — cannot get NURSE token"
  NUR_TOK=""
elif [ -n "$NUR_TOK" ]; then
  log "PASS" "F1.NURSE" "NURSE login succeeded (baseline comparison)"
else
  log "FAIL" "F1.NURSE" "NURSE login failed: $NUR_ERR"
fi

echo ""

# ═══ F2: Rate Limiting ══════════════════════════════════════════
echo "=== F2: Rate Limiting ==="

if echo "$PAT_ERR" | rg -qi 'too many|rate' || echo "$NUR_ERR" | rg -qi 'too many|rate'; then
  log "PASS" "F2.0" "Rate limiting IS active (login returned rate limit error during test)"
fi

# Use a unique email prefix to avoid hitting existing rate limits
R429=0; R401=0; ROTH=0
for i in $(seq 1 25); do
  RC=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"f2batch${i}$(date +%s)@fake.com\",\"password\":\"wrong\"}" 2>&1)
  if [ "$RC" = "429" ]; then R429=$((R429+1))
  elif [ "$RC" = "401" ]; then R401=$((R401+1))
  else ROTH=$((ROTH+1)); fi
done

if [ "$R429" -gt 0 ]; then
  log "PASS" "F2.1" "25 rapid logins: ${R429}x429, ${R401}x401, ${ROTH}x other"
else
  log "FAIL" "F2.1" "25 rapid logins: 0x429, ${R401}x401 — rate limit NOT triggered (serverless: each req may hit different instance)"
fi

# Forgot-password rate limit
FP429=0
for i in $(seq 1 12); do
  FPC=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/auth/forgot-password" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"f2fp${i}@fake.com\"}" 2>&1)
  if [ "$FPC" = "429" ]; then FP429=$((FP429+1)); fi
done

if [ "$FP429" -gt 0 ]; then
  log "PASS" "F2.2" "Forgot-password: ${FP429}x429 in 12 requests"
else
  log "FAIL" "F2.2" "Forgot-password: 0x429 in 12 requests"
fi

echo ""

# ═══ F5: Auth Token Storage ════════════════════════════════════
echo "=== F5: Auth Token Storage ==="

if [ -n "$NUR_TOK" ]; then
  log "PASS" "F5.1" "Login returns token (for HttpOnly cookie + in-memory use)"
fi

# Check if HttpOnly cookie is set
COOKIES=$(curl -s -D /tmp/h5.txt -o /dev/null "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"strix-test@nurseos.digital","password":"NurseTest123"}')

if rg -q 'nurseos-token' /tmp/h5.txt 2>/dev/null; then
  if rg -qi 'nurseos-token.*HttpOnly' /tmp/h5.txt 2>/dev/null; then
    log "PASS" "F5.2" "Server sets nurseos-token as HttpOnly cookie"
  else
    log "FAIL" "F5.2" "Server sets nurseos-token but WITHOUT HttpOnly flag"
  fi
else
  log "INFO" "F5.2" "Could not verify HttpOnly cookie (login may have been rate-limited)"
fi

# Check auth callback page source
CB_SRC=$(curl -s "$BASE/auth/callback" 2>&1)
if echo "$CB_SRC" | rg -q 'token.*data\.token|token:.*data\.token'; then
  log "FAIL" "F5.3" "auth/callback may still store token in localStorage"
else
  log "PASS" "F5.3" "auth/callback does NOT contain token-to-localStorage pattern"
fi

echo ""

# ═══ F6: CareGrid Cross-Facility PII ════════════════════════════
echo "=== F6: CareGrid Cross-Facility PII ==="

if [ -n "$NUR_TOK" ]; then
  DIR_RESP=$(curl -s -o /tmp/f6_dir.json "$BASE/api/caregrid/directory" -H "Authorization: Bearer $NUR_TOK")
  DIR_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/caregrid/directory" -H "Authorization: Bearer $NUR_TOK")

  python3 << 'PYEOF'
import json
try:
    d = json.load(open("/tmp/f6_dir.json"))
    nurses = d.get("nurses", [])
    facilities = set()
    has_email = has_phone = has_license = has_status = False
    for n in nurses:
        f = n.get("facility", {}) or {}
        facilities.add(f.get("id", "none"))
        u = n.get("user", {})
        if "email" in u: has_email = True
        if "phone" in u: has_phone = True
        if "status" in u: has_status = True
        if "licenseNumber" in n: has_license = True
    print(f"F6_DIR_NURSES={len(nurses)}")
    print(f"F6_FACILITIES={','.join(sorted(facilities))}")
    print(f"F6_HAS_EMAIL={has_email}")
    print(f"F6_HAS_PHONE={has_phone}")
    print(f"F6_HAS_STATUS={has_status}")
    print(f"F6_HAS_LICENSE={has_license}")
except Exception as e:
    print(f"F6_PARSE_ERROR={e}")
PYEOF

  source /tmp/f6_results.txt 2>/dev/null || true

  # Re-read results from the python output
  eval $(python3 -c '
import json
try:
    d = json.load(open("/tmp/f6_dir.json"))
    nurses = d.get("nurses", [])
    facilities = set()
    has_email = has_phone = has_license = has_status = False
    for n in nurses:
        f = n.get("facility", {}) or {}
        facilities.add(f.get("id", "none"))
        u = n.get("user", {})
        if "email" in u: has_email = True
        if "phone" in u: has_phone = True
        if "status" in u: has_status = True
        if "licenseNumber" in n: has_license = True
    print(f"F6_N={len(nurses)}")
    print(f"F6_EMAIL={has_email}")
    print(f"F6_PHONE={has_phone}")
    print(f"F6_STATUS={has_status}")
    print(f"F6_LICENSE={has_license}")
    # NURSE is in facility 1861deff (Test University). Check if other facilities present.
    other_fac = [f for f in facilities if f not in ("none", "1861deff-5871-4f0d-8ebe-2692aae34ddd")]
    print(f"F6_OTHER_FAC={len(other_fac)}")
except Exception as e:
    print(f"F6_ERR={e}")
' 2>/dev/null)

  if [ "${F6_EMAIL:-false}" = "False" ]; then
    log "PASS" "F6.1" "Directory does NOT expose email addresses"
  else
    log "FAIL" "F6.1" "Directory DOES expose email addresses (F6 data minimization not deployed or ineffective)"
  fi

  if [ "${F6_PHONE:-false}" = "False" ]; then
    log "PASS" "F6.2" "Directory does NOT expose phone numbers"
  else
    log "FAIL" "F6.2" "Directory DOES expose phone numbers"
  fi

  if [ "${F6_OTHER_FAC:-0}" -eq 0 ] 2>/dev/null; then
    log "PASS" "F6.3" "Directory is facility-scoped (no cross-facility data)"
  else
    log "FAIL" "F6.3" "Directory returns data from ${F6_OTHER_FAC} other facility/ies (F6 facility isolation not effective)"
  fi
else
  log "SKIP" "F6" "No NURSE token available (rate limited or login failed)"
fi

echo ""

# ═══ F7: Error Disclosure ═══════════════════════════════════════
echo "=== F7: Error Disclosure ==="

# F7.1: Non-existent resource
F7_1=$(curl -s "$BASE/api/nurseai/patients/nonexistent-xyz" -H "Authorization: Bearer ${NUR_TOK:-none}")
if echo "$F7_1" | rg -qiq 'stack|trace|prisma|sql|postgresql|column.*does not exist|relation.*does not exist|error.*at line'; then
  log "FAIL" "F7.1" "404 response exposes internal error details"
else
  log "PASS" "F7.1" "404 response: safe generic error only"
fi

# F7.2: Invalid input
F7_2=$(curl -s -X POST "$BASE/api/auth/forgot-password" -H "Content-Type: application/json" -d '{"email":"not-an-email"}')
if echo "$F7_2" | rg -qiq 'stack|trace|prisma|prisma.*error|Unique.*constraint|P2002|P2025'; then
  log "FAIL" "F7.2" "Invalid input response exposes Prisma/internal errors"
else
  log "PASS" "F7.2" "Invalid input response: safe error only"
fi

# F7.3: Health endpoint
F7_3=$(curl -s "$BASE/api/health")
if echo "$F7_3" | rg -qiq 'DATABASE_URL|password.*=|secret.*=|connection.*string'; then
  log "FAIL" "F7.3" "Health endpoint exposes internal config"
else
  log "PASS" "F7.3" "Health endpoint: no sensitive config exposed"
fi

echo ""

# ═══ F11: 2FA ══════════════════════════════════════════════════
echo "=== F11: 2FA ==="

if [ -n "$NUR_TOK" ]; then
  # Try the old toggle endpoint
  F11_RESP=$(curl -s -w '
%{http_code}' -X POST "$BASE/api/auth/2fa/toggle" \
    -H "Authorization: Bearer $NUR_TOK" \
    -H "Content-Type: application/json" \
    -d '{"enabled":true}')
  F11_CODE=$(echo "$F11_RESP" | tail -1)
  F11_BODY=$(echo "$F11_RESP" | head -1)

  if [ "$F11_CODE" = "404" ] || [ "$F11_CODE" = "405" ]; then
    log "PASS" "F11.1" "Old toggle endpoint: HTTP $F11_CODE (removed/disabled)"
  elif [ "$F11_CODE" = "401" ]; then
    # 401 could mean auth issue (token expired) or the endpoint still exists
    if echo "$F11_BODY" | rg -qi 'not found|no longer|removed|use setup'; then
      log "PASS" "F11.1" "Old toggle endpoint: HTTP $F11_CODE — endpoint disabled"
    else
      log "INFO" "F11.1" "Old toggle endpoint: HTTP 401 (may be auth-required, need to verify behavior)"
    fi
  else
    # If 200, check if 2FA was actually enabled without verification
    if echo "$F11_BODY" | rg -qi 'enabled|twoFactor|2fa'; then
      log "FAIL" "F11.1" "Old toggle STILL enables 2FA: $F11_BODY"
    else
      log "INFO" "F11.1" "Old toggle: HTTP $F11_CODE — $F11_BODY"
    fi
  fi

  # Check if 2fa/setup endpoint exists (new flow)
  F11_SETUP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/2fa/setup" \
    -H "Authorization: Bearer $NUR_TOK")
  if [ "$F11_SETUP" = "200" ] || [ "$F11_SETUP" = "201" ]; then
    log "PASS" "F11.2" "2FA setup endpoint exists: HTTP $F11_SETUP (new verify-then-enable flow)"
  elif [ "$F11_SETUP" = "404" ]; then
    log "INFO" "F11.2" "2FA setup endpoint: HTTP 404 (may not be created yet — toggle fix is the priority)"
  else
    log "INFO" "F11.2" "2FA setup endpoint: HTTP $F11_SETUP"
  fi
else
  log "SKIP" "F11" "No NURSE token — cannot test 2FA"
fi

echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
PC=$(echo "$P" | rg -o '\[F[0-9]' | wc -l || echo 0)
FC=$(echo "$F" | rg -o '\[F[0-9]' | wc -l || echo 0)
SC=$(echo "$S" | rg -o '\[F[0-9]' | wc -l || echo 0)
echo "PASS: $PC"
echo "FAIL: $FC"
echo "SKIP: $SC"
echo "=========================================="

rm -f /tmp/f1_ep.json /tmp/h5.txt /tmp/f6_dir.json 2>/dev/null || true
