# Shared · Security & Privacy Baseline

Canonical security spec. Module **Section 11 (Security)** links here and lists deltas.
See also `40-security-compliance-center.md` for admin-facing controls.

## Identity & sessions

- **Tokens:** short-lived access JWT (~15m) + rotating refresh token (30–90d).
- **Storage:** Keychain via `expo-secure-store`; never AsyncStorage.
- **Refresh flow:** on 401, single silent refresh + retry; refresh reuse detection
  revokes the token family (replay protection).
- **Session expiry:** idle + absolute lifetimes; server can revoke (logout all devices).
- **Device trust:** register `deviceId`; new-device login triggers security alert
  (email + push). Optional admin device allow-listing (enterprise).

## Authentication factors

- Email+password (Argon2id server-side), Sign in with Apple, Google, enterprise SSO
  (SAML 2.0 / OIDC), **SCIM** provisioning (enterprise).
- **2FA:** TOTP (v1.1), WebAuthn **passkeys** (v2).
- **Biometric app lock:** Face ID/Touch ID via `expo-local-authentication`; auto-lock
  timeout; fallback to device passcode.

## Authorization

- **RBAC + ABAC** — see `shared/rbac-permissions.md`. Enforced **server-side**; client
  hides UI as UX only. Every mutation re-checks permission + org/project scope.

## Transport & app hardening

- TLS 1.2+; **certificate pinning** for the API domain (with backup pins + kill-switch).
- Jailbreak/root best-effort detection → warn + restrict sensitive actions.
- No secrets in the bundle; use EAS secrets + remote config.
- `ITSAppUsesNonExemptEncryption: false` (standard HTTPS only).

## Data protection & privacy

- At rest: server DB encryption; optional on-device SQLCipher (enterprise).
- **PII minimization**; task content never in logs/analytics.
- **GDPR/CCPA:** data export (machine-readable) + right-to-erasure; account deletion
  cascades/anonymizes per retention policy.
- **Retention policy:** configurable per org (e.g., delete completed tasks/audit after N
  days); legal hold overrides.
- **SOC 2 / ISO 27001 considerations:** audit logging, access reviews, change mgmt,
  encryption, vendor management (documented in compliance center).

## Abuse & integrity

- **Rate limiting** per user/IP/endpoint (see api-conventions); progressive login lockout.
- **Fraud/anomaly detection:** impossible travel, burst signups, credential-stuffing.
- **Input validation** server-side (zod/schema); output encoding to prevent injection/XSS
  in rich text/comments.
- **Attachment scanning:** type/size validation + malware scan before availability.

## Audit & observability

- Immutable **audit log** for security-relevant actions (auth, role change, export,
  deletion, permission change) — see `29-activity-feed-audit-logs.md`.
- Security events feed SIEM (enterprise).

## Acceptance (global)

- [ ] Tokens only in Keychain; refresh reuse revokes family.
- [ ] All mutations authorized server-side with scope checks.
- [ ] Cert pinning active with safe rotation path.
- [ ] Data export + erasure flows function and are audited.
- [ ] No PII/task content in logs or analytics.
- [ ] New-device login raises a security alert.
