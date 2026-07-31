# Architect Review Standards v1.0

**Status:** Active  
**Effective:** 2026-07-27  
**Applies to:** All architecture reviews, security audits, code reviews, and roadmap documents produced for the NurseOS project.

---

## Purpose

This document is the **single source of truth** for how architecture reviews are conducted, structured, and reported within the NurseOS project. Every audit, review, or roadmap must reference this document by version number rather than duplicating its contents.

```
Review Standard: Architect Review Standards v1.0
```

When this document is updated, historical reports retain the version they were written against. Only the version reference in future reports changes.

---

## 1. Evidence Classification Framework

Every material technical finding, recommendation, risk, or architectural conclusion must carry an evidence tag. Routine narrative text and document transitions do not require tagging.

| Tag | Meaning | When to Use |
|-----|---------|-------------|
| `[Verified]` | Confirmed by direct observation: source code read, live HTTP test, production log, database query, or build output. | The claim is provable from artifacts the reviewer personally inspected. |
| `[Observed]` | Witnessed through behavior: HTTP response, UI behavior, error message, or system state seen during testing. | The claim describes behavior seen but not traced to specific code. |
| `[Inferred]` | Logically deduced from verified/observed evidence combined with known system architecture. | The claim follows from evidence but is not itself directly observed. |
| `[Hypothesis]` | Plausible but unconfirmed explanation requiring further investigation. | The claim fills a gap in understanding and needs targeted verification. |

**Rules:**
- Never label a claim `[Verified]` if you did not personally inspect the artifact.
- If evidence is unavailable, clearly state it is `[Inferred]` or `[Hypothesis]` rather than omitting a tag.
- Never fabricate evidence tags. An untagged material finding is a document defect.

---

## 2. Confidence Scores

Each **major conclusion** in a Tier 2 or Tier 3 report must include a confidence score.

| Score | Meaning | When to Use |
|-------|---------|-------------|
| 95-100% | Near-certain. Multiple independent verified evidence sources. | Findings backed by code + live tests + production logs. |
| 80-94% | High confidence. Single strong verified source or multiple observed sources. | Findings backed by code inspection + production behavior. |
| 60-79% | Moderate confidence. Primarily inferred from indirect evidence. | Findings deduced from architecture patterns, not directly tested. |
| 40-59% | Low confidence. Hypothesis with some supporting evidence. | Findings that need targeted investigation to confirm. |
| <40% | Speculative. Insufficient evidence; requires investigation before acting. | Gaps identified but not understood. |

**Rule:** A confidence score below 60% must be accompanied by a recommended investigation action before the finding is used to justify a change.

---

## 3. Never-Guess Discipline

The reviewer must never guess, assume, or fabricate:

- System behavior not observed or verified
- Code contents not read
- Test results not executed
- Configuration values not inspected
- Error messages not seen
- Performance metrics not measured

**When information is unavailable:**
1. State explicitly what is unknown.
2. Classify the gap with `[Hypothesis]` if an educated guess is needed for continuity.
3. Recommend the specific action needed to convert the hypothesis to `[Verified]`.

A report that contains unmarked assumptions is incomplete. An assumption without a tag is a defect.

---

## 4. Root Cause Analysis

Every finding (P0, P1, and significant P2) must include a root cause analysis that answers:

1. **What is the proximate cause?** The code path, configuration, or design decision that directly produces the issue.
2. **What is the systemic cause?** The process, architecture, or cultural factor that allowed the proximate cause to exist.
3. **Why was it not caught earlier?** The missing control, test, or review that should have detected it.

**Format:** Root cause analysis must be a short paragraph (3-5 sentences), not a single line. It must reference specific files, lines, or decisions where applicable.

---

## 5. Blast Radius Assessment

Every security finding and every P0/P1 operational issue must include a blast radius assessment:

| Dimension | What to Assess |
|-----------|---------------|
| **Data exposure** | What data could an attacker access? How many records? What sensitivity level (PHI, PII, operational)? |
| **Lateral movement** | Can this be used to reach other systems or escalate privileges? |
| **User impact** | How many users are affected? Can they continue working? |
| **Regulatory impact** | Does this trigger a breach notification under HIPAA, GDPR, or NDPR? |
| **Temporal scope** | How long has the vulnerability existed? Was it ever exploited (check logs)? |

---

## 6. Rollback Plans

Every recommended fix must include a rollback plan that answers:

1. **What is the rollback procedure?** Git revert, Vercel rollback, database migration reversal.
2. **What is the rollback trigger?** The specific condition that indicates the fix should be reversed.
3. **What is the blast radius of the rollback itself?** Will reverting the fix re-expose the original vulnerability?
4. **What is the estimated rollback time?** Minutes, hours, or requires manual intervention?

**Rule:** If a fix cannot be safely rolled back, the report must explicitly flag this as a deployment risk and recommend a staged rollout or canary deployment strategy instead.

---

## 7. Performance Impact Assessment

Every architectural change recommendation must assess performance impact:

- **Latency:** Expected change in p50/p95/p99 response times.
- **Throughput:** Expected change in requests per second capacity.
- **Cold start:** Impact on serverless function cold start time (Vercel edge).
- **Database:** Additional query load, index requirements, migration duration.
- **Client:** Bundle size impact, hydration cost, memory usage.

If performance cannot be estimated, state `[Hypothesis]` and recommend benchmarking before deployment.

---

## 8. Compliance Impact Assessment

Every finding that touches patient data, user data, or regulated operations must assess compliance impact under:

| Regulation | Scope | Key Concerns |
|------------|-------|-------------|
| **HIPAA** | Covered entities and business associates handling PHI in the US | Encryption at rest/transit, access controls, audit trails, breach notification, BAAs |
| **GDPR** | Processing personal data of EU residents | Lawful basis, data minimization, right to erasure, DPO, data processing agreements |
| **NDPR** | Processing personal data in Nigeria | Consent, data subject rights, data protection impact assessments, registration with NITDA |

**Rule:** If a finding has compliance implications but the reviewer cannot determine whether the regulation applies (e.g., unclear if NurseOS is a covered entity), this must be stated as `[Inferred]` with the specific assumption noted.

---

## 9. Decision Logs

Every review must maintain a decision log recording significant choices made during the review process:

| Decision | Rationale | Alternatives Considered | Evidence |
|----------|-----------|------------------------|----------|
| Example: Chose blocklist-over-whitelist for middleware | Simpler to maintain, catches catch-all bypass | Option B: Remove catch-all entirely; Option C: Explicit route registration | `[Verified]` middleware.ts structure |

**Rule:** If a decision was made without considering alternatives, state this explicitly. Unconsidered alternatives are a form of technical risk.

---

## 10. Technical Debt Register

Reviews must contribute to or reference the living Technical Debt Register. Each debt item must include:

| Field | Required | Description |
|-------|----------|-------------|
| ID | Yes | Unique identifier (TD-NNN) |
| Description | Yes | Clear, specific statement of the debt |
| Severity | Yes | P0 (critical) / P1 (high) / P2 (medium) / P3 (low) |
| Evidence Tag | Yes | How this debt was identified |
| Owner | Recommended | Person or role responsible |
| Target Release | Recommended | Sprint, milestone, or date |
| Related ADR | If applicable | ADR that documents the decision creating or resolving this debt |

**Rule:** New debt discovered during a review must be added to the register with an `[Observed]` or `[Verified]` tag. Resolved debt must be marked with resolution details and the commit/PR that resolved it.

---

## 11. Architecture Principles Check

Every architectural review must assess compliance with the established architecture principles:

| Principle | Description |
|-----------|-------------|
| Single Source of Truth (SSOT) | Data has one authoritative source; no duplicated logic or divergent stores. |
| Offline-First | The system is usable without network connectivity; sync is a background concern. |
| FHIR Compatibility | Data model and APIs align with HL7 FHIR R4 where applicable. |
| Multi-Tenancy | Data is isolated by facility/tenant; no cross-tenant data leakage. |
| Security by Default | All endpoints require authentication unless explicitly whitelisted; defense in depth. |
| Auditability | All state-changing operations produce audit logs with actor, action, resource, and timestamp. |
| Simplicity | Prefer the simplest solution that meets requirements; avoid premature abstraction. |

**Rule:** If a proposed change violates a principle, the review must explicitly call out the violation, assess the tradeoff, and recommend either an alternative approach or a formal exception with justification.

---

## 12. Production Readiness Checklist

Every change destined for production must pass this checklist before merge:

- [ ] **Build passes** with zero TypeScript errors (`ignoreBuildErrors` not relied upon)
- [ ] **Tests pass** (unit, integration, or E2E as applicable to the change)
- [ ] **Database migration reviewed** (if schema change); rollback migration prepared
- [ ] **Rollback prepared**: git revert or Vercel rollback procedure documented
- [ ] **Monitoring added**: relevant metrics, error tracking, or logging for new code paths
- [ ] **Security reviewed**: new endpoints auth-checked, no new attack surface
- [ ] **Documentation updated**: ADR written for architectural decisions, README updated for user-facing changes
- [ ] **Compliance assessed**: no new PHI/PII exposure, audit logging where required
- [ ] **Performance assessed**: no regression in p95 latency or bundle size
- [ ] **Staging verified**: change tested in staging environment before production

**Rule:** A review must not recommend deployment if any critical item on this checklist is unchecked. Unchecked items must be documented as known risks with remediation timelines.

---

## 13. Tiered Reporting with Evidence Traceability

All review and audit outputs are classified into one of three tiers. The selected tier must be **justified at the beginning of the report**. If the requested tier is insufficient for the risk involved (e.g., a Quick Review of a production security incident), the reviewer **must recommend escalating to a higher tier before drawing firm conclusions**.

### Tier 1 — Quick Review

**Purpose:** Fast feedback during active development.

**Expected scope:**
- High-level findings only
- Major risks
- No exhaustive verification
- Suitable for PRs and feature reviews

**Evidence requirement:**
- `[Observed]`, `[Inferred]`, limited `[Verified]`
- No confidence scores required

### Tier 2 — Standard Review

**Purpose:** Default architecture and code review.

**Expected scope:**
- Full architectural assessment
- Security implications
- Technical debt
- Compliance implications
- Executive action plan
- ADR recommendation where applicable

**Evidence requirement:**
- Mostly `[Verified]`
- Clearly distinguish `[Observed]` and `[Inferred]`
- State any assumptions
- Confidence scores on major conclusions (recommended, not mandatory)

### Tier 3 — Comprehensive Audit

**Purpose:** Production readiness, security audits, major releases, regulatory reviews.

**Expected scope:**
- Exhaustive verification
- Root cause analysis (Rule #4)
- Blast radius (Rule #5)
- Rollback plan (Rule #6)
- Performance impact (Rule #7)
- Compliance mapping (Rule #8)
- Technical debt register (Rule #10)
- Architecture maturity assessment (Rule #11)
- Living roadmap updates
- Production verification
- Risk matrix
- Unknowns
- Assumptions
- Confidence score on every major conclusion

**Evidence requirement:**
- Every material finding tagged: `[Verified]` / `[Observed]` / `[Inferred]` / `[Hypothesis]`
- Confidence percentage for each major conclusion

### Tier Selection Guide

| Scenario | Recommended Tier |
|----------|-----------------|
| PR review, feature branch check | Tier 1 — Quick Review |
| Architecture assessment, monthly roadmap, technical debt review | Tier 2 — Standard Review |
| Security audit, production readiness, regulatory review, major release | Tier 3 — Comprehensive Audit |
| Production security incident | Tier 3 (mandatory) |
| Minor configuration change | Tier 1, escalate to Tier 2 if blast radius is unclear |

### Escalation Clause

If during any review the reviewer discovers findings that exceed the scope of the selected tier, the reviewer must:

1. Document the discovery that triggered escalation.
2. Recommend the appropriate higher tier.
3. Either proceed at the higher tier (if time/resources allow) or deliver the current tier with a clear handoff note for the follow-up review.

---

## 14. Decision Outcome Tracking

Every recommendation must eventually be closed with a recorded outcome. ADRs and recommendation registers are living documents, not historical archives.

| Field | Purpose |
|-------|---------|
| Decision | What was recommended |
| Status | `Proposed` / `Accepted` / `Implemented` / `Verified` / `Rejected` |
| Verification Date | When production verification occurred |
| Success Metrics | Quantifiable criteria confirming the decision worked (e.g., brute-force attempts blocked, latency unchanged) |
| Lessons Learned | What was discovered after deployment that was not anticipated |
| Rejection Reason | If rejected, why (with evidence tag) |

**Rule:** A recommendation with status `Implemented` but no `Verification Date` or `Success Metrics` is incomplete. The reviewer or follow-up architect must close the loop.

---

## 15. Explicit Unknowns Section

Every Tier 2 (Standard Review) and Tier 3 (Comprehensive Audit) report must finish with a **Known Unknowns** section that lists items the reviewer could not verify or assess.

**Format:**

```
[Unknown] Production WAF configuration not available for review.
[Unknown] Database backup schedule and retention not verified.
[Unknown] Cloud IAM roles and service account permissions not reviewed.
[Unknown] Third-party vendor security posture (Paystack, Resend, Neon) not assessed.
```

**Rules:**
- Every `[Unknown]` must include what would be needed to convert it to `[Verified]` or `[Observed]`.
- Unknowns that represent material risk must be classified as P1 or P2 in the issue tracker.
- A report with zero unknowns in a Tier 2+ review is suspect; the reviewer has likely overlooked something.

---

## 16. Evidence Reference IDs

For Tier 3 (Comprehensive Audit) reviews, every piece of evidence must be assigned a unique reference ID at the beginning of the report in an **Evidence Index** section.

**Format:**

| ID | Evidence | Type |
|----|----------|------|
| E-001 | `curl POST /api/setup` returned 200 unauthenticated | Live HTTP test |
| E-002 | `middleware.ts` lines 47–65: publicApiRoutes whitelist | Code inspection |
| E-003 | Commit `e30d315` on `origin/main` | Git log |
| E-004 | ADR-001: Middleware Security Hardening | Document reference |
| E-005 | `package.json`: no APM dependency | Dependency analysis |

**Usage in findings:**

```
Finding: /api/setup publicly accessible [Verified | E-001, E-002]
```

**Rules:**
- Evidence IDs must be sequential (E-001, E-002, ...) within a single report.
- The same piece of evidence may be referenced by multiple findings.
- Tier 2 reviews may use evidence IDs optionally; Tier 3 must use them.
- Evidence that is cited but not listed in the index is a document defect.

---

## 17. Recommendation Acceptance Criteria

Every recommendation must define what "done" means with concrete, verifiable acceptance criteria.

**Format:**

| Field | Example |
|-------|--------|
| Recommendation | Protect `/api/setup` endpoint |
| Acceptance Criteria | 1. Returns 401 unauthenticated. 2. Returns 200 with ADMIN auth. 3. Existing `/api/health` endpoint unaffected. 4. Regression tests pass. 5. Production verified. |
| Verification Method | Live HTTP test against production |
| Assigned To | Engineering lead |
| Target Date | 2026-07-27 |

**Rules:**
- Acceptance criteria must be binary (pass/fail), not subjective ("improved", "better").
- Every criterion must be independently verifiable without interpretation.
- A recommendation without acceptance criteria is incomplete and must not be marked as "done."
- If a recommendation is partially completed, list which criteria passed and which remain open.

---

## 18. Architectural Drift Review

Every quarter, the current system must be compared against its intended architecture to detect drift.

**Review inputs:**
- All ADRs (current status and decisions)
- Living Architecture Roadmap (current state vs. target state)
- Architecture Principles (Section 11)
- This governance document
- Recent git history (architecturally significant commits)

**Review output:**

| Drift Detected | ADR/Principle Affected | Evidence | Reason | Action |
|----------------|------------------------|----------|--------|--------|
| Rate limiter bypassed on new route | #6 Security by Default | `[Verified]` E-005 | Route added without auth check | Add auth, update blocklist |

**Rules:**
- The drift review must be a distinct activity, not bundled into a feature review.
- Every detected drift must be classified: `Accept` (intentional divergence, update ADR) or `Remediate` (unintentional, create fix task).
- Accepted drift must update the relevant ADR or principle documentation to reflect the new reality.
- The drift review result feeds back into the Living Architecture Roadmap and Technical Debt Register.

---

## 19. Risk Ranking (P0–P3)

| Priority | Definition | Response Time | Example |
|----------|-----------|---------------|----------|
| **P0 Critical** | Active exploitation risk or data breach. Production system is vulnerable right now. | Immediate (within hours) | Unauthenticated admin endpoint in production |
| **P1 High** | Significant risk but no active exploitation observed. Could become P0 if left unaddressed. | Within 1 sprint | No CSP headers, incomplete audit logging |
| **P2 Medium** | Operational concern or compliance gap. Does not pose immediate risk. | Within 1 quarter | Missing API versioning, no .env.example |
| **P3 Low** | Improvement opportunity. No risk or compliance implication. | When convenient | Code style inconsistency, minor UX debt |

**Rule:** A review must not downgrade a risk without evidence. If the true severity is uncertain, classify at the higher severity and note `[Inferred]` with the rationale for potential downgrade.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-07-27 | Security Audit / AI Architect | Initial publication. Rules #1–#13 established. |
| 1.1 | 2026-07-27 | Security Audit / AI Architect | Added Rules #14–#18: Decision Outcome Tracking, Explicit Unknowns, Evidence Reference IDs, Recommendation Acceptance Criteria, Architectural Drift Review. Renumbered Risk Ranking to §19. |
