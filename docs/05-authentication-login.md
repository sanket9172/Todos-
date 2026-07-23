# 05 · Authentication & Login

> Follows the [Master PRD Template](./00-prd-template.md). Cross-cutting security details are
> the deltas over [shared/security-baseline.md](./shared/security-baseline.md); this module
> owns the **auth UX, factors, and session lifecycle** on iOS.

---

## 1. Purpose

Authentication is the gate to every piece of org and personal data in Numil. It must be
**fast and frictionless** for the 99% happy path (open app → Face ID → in), yet **enterprise-
hard** underneath (SSO, SCIM, passkeys, 2FA, token rotation, device trust).

**User problem it solves.** Users hate typing passwords on mobile and expect Apple-native
sign-in; enterprises require federated identity, provisioning, and auditability. Numil bridges
both: a consumer-grade one-tap experience over a standards-based (SAML/OIDC/WebAuthn) core.

**User goals**
- Get in instantly on a trusted device (biometrics), no re-typing.
- Sign up / sign in with Apple or Google in one tap.
- Use my company's SSO by typing my work email.
- Trust that my account is protected (2FA, new-device alerts, remote sign-out).

**Business goals**
- Maximize activation (minimize drop-off at the very first screen).
- Unlock enterprise deals (SSO/SCIM/passkeys are procurement checkboxes).
- Reduce support/fraud cost (self-serve recovery, lockout, anomaly detection).

**KPIs:** sign-in success rate, time-to-authenticated (median), % biometric unlock adoption,
SSO adoption in enterprise orgs, password-reset rate, account-takeover incidents (→0),
`login_failed` rate by `error_code`.

**Platform constraints (from `app.json`):** scheme `numil://` (OAuth/SSO redirects), bundle
`com.sanketsss.numil` (Apple/Google client config + Associated Domains for passkeys),
`ITSAppUsesNonExemptEncryption: false` (standard HTTPS/TLS only — no custom crypto).

---

## 2. Navigation

**Entry points**
- App launch with no valid session → **Welcome**.
- App launch with a valid refresh token → **Biometric unlock** (if enabled) → last screen.
- Deep links: `numil://auth/callback` (OAuth/SSO redirect), `numil://reset?token=…`
  (password reset), `numil://invite/{code}` (routes to sign-up/sign-in then
  [06 · Onboarding](./06-onboarding.md)).
- Session expiry / `401` that can't silently refresh → **Sign in** with a toast.
- "Sign out" from [15 · Profile & Settings](./15-profile-settings.md).

**Route group:** `src/app/(auth)/` — `welcome`, `login`, `signup`, `otp`, `forgot`, `reset`,
`sso`, `mfa`, `lock` (biometric). The **root layout guard** (`src/app/_layout.tsx`) redirects
unauthenticated users here and authenticated-but-org-less users to onboarding.

**Navigation hierarchy**
```text
Welcome ─┬─ Sign in ─┬─ (email/password) ─┬─ MFA challenge ─▶ App
         │           ├─ Apple / Google ───┴────────────────▶ App / Onboarding
         │           └─ SSO (work email) ─▶ IdP (web) ──────▶ App
         └─ Create account ─▶ Verify (OTP) ─▶ Onboarding
Forgot ─▶ Reset (deep link) ─▶ Sign in
Biometric lock ─▶ App (returning users)
```

**Modal vs push:** auth screens are **push** within a full-screen `(auth)` stack (no tab bar).
The biometric **lock** is a full-screen cover presented over the app on resume. MFA and
consent are **sheets** layered over Sign in to preserve context. Transitions use the default
iOS slide; the lock screen fades (`motion.base`).

---

## 3. Complete UI Layout

```text
┌───────────────────────────────────────────────┐
│▔▔▔▔  Dynamic Island / status bar safe area  ▔▔▔│
│                                                 │
│                   ◆  Numil                       │  ← logo (rounded), brand tint #208AEF
│           Plan calmly. Ship together.            │  ← one-line value prop
│                                                 │
│   [   Continue with Apple            ]          │  ← primary, top (Apple first)
│   [   Continue with Google           ]          │
│   ───────────────  or  ────────────────         │
│   ✉  Email                                       │  ← TextField
│   🔒 Password                        ( 👁 )      │  ← show/hide toggle
│                                                 │
│   [        Sign in                    ]         │  ← primary button (thumb zone)
│   Forgot password?            Use SSO ›          │  ← secondary links
│                                                 │
│   New here?  Create account ›                    │
│                                                 │
│   By continuing you agree to Terms · Privacy     │  ← legal, small print
│▁▁▁▁▁▁▁▁▁▁  home-indicator safe area  ▁▁▁▁▁▁▁▁▁▁│
└───────────────────────────────────────────────┘

  OTP verify sheet                 Biometric lock (returning)
┌─────────────────────────┐      ┌─────────────────────────┐
│ Enter the 6-digit code   │      │        ◆ Numil           │
│  [ 4 ][ 8 ][ 1 ][ _ ][_][_]     │      │                          │
│  Sent to p•••@acme.com   │      │      (Face ID icon)       │
│  Resend in 0:24          │      │   Unlock Numil with Face ID│
│  [   Verify   ]          │      │   [ Use passcode ]        │
└─────────────────────────┘      └─────────────────────────┘
```

- **Top:** logo + value prop, generous vertical rhythm, respects top safe area / Dynamic Island.
- **Middle:** social buttons first (**Apple above Google**, per App Store guidance), a divider,
  then email/password. Only **one** primary action visible at rest (Sign in).
- **Bottom:** primary CTA sits in the thumb zone; legal text pinned above the home indicator.
- **OTP sheet:** 6 auto-advancing boxes, paste + iOS Messages autofill (`oneTimeCode`),
  masked destination, resend countdown.
- **Biometric lock:** full-screen cover with Face ID/Touch ID glyph and passcode fallback.
- **iPad / landscape:** the auth card centers at ≤`MaxContentWidth`/2 with a calm background;
  content never stretches full-width. Split view keeps the card centered.
- **Keyboard:** inputs stay above the keyboard; `Sign in` remains reachable (KeyboardAvoiding).

---

## 4. Complete Component Breakdown

| Area | Components |
|------|-----------|
| Branding | `AuthHeader` (logo + value prop), `LegalFootnote` (Terms/Privacy links) |
| Social auth | `AppleSignInButton` (`expo-apple-authentication`), `GoogleSignInButton`, `SSOButton` |
| Forms | `TextField` (email), `PasswordField` (show/hide), `PasswordStrengthMeter`, `Checkbox` (accept terms), `FormBanner` (server errors), inline `FieldError` |
| Buttons | `Button` (primary/tonal/plain), `SubmitButton` (inline spinner), `LinkButton` (Forgot/SSO/Create) |
| OTP | `OTPInput` (6 boxes, auto-advance, paste, autofill), `ResendTimer` |
| MFA | `MfaChallengeSheet` (TOTP code), `RecoveryCodeInput`, `PasskeyPrompt` |
| Biometric | `BiometricLockScreen`, `FaceIDGlyph`, `PasscodeFallbackButton` |
| SSO | `SSOEmailStep`, in-app browser (`WebBrowser`/ASWebAuthenticationSession), `SSODiscoveryLoader` |
| Feedback | `Toast`/`Snackbar`, `Banner` (offline/new-device), `Skeleton`, `RateLimitCard`, `ConfirmDialog` (sign out) |

All primitives are defined in [03 · Design System & UI](./03-design-system-ui.md); auth adds
only the auth-specific composites above. Tokens (`tint`, `danger`, `Spacing`) come from
`src/constants/theme.ts`.

---

## 5. Modern Features

Each feature: **Purpose · Workflow · UI · Permissions · Offline · API · DB · Notify · AC.**

### 5.1 Email + password ✅
- **Purpose:** universal fallback identity.
- **Workflow:** enter email/password → `POST /auth/login` → tokens (or MFA challenge) → app.
- **UI:** email + `PasswordField` + `Sign in`; inline validation; form banner on failure.
- **Permissions:** role-agnostic; role assigned per org after join.
- **Offline:** cannot authenticate offline; a still-valid cached session unlocks read-only.
- **API:** `POST /auth/login {email,password}` → `{access,refresh,user,mfaRequired?}`.
- **DB:** `users`, `auth_credentials` (Argon2id hash), `sessions`.
- **Notify:** new-device login → security alert (email + push).
- **AC:** wrong credentials return a generic error (no user enumeration); lockout per §"Times".

### 5.2 Sign in with Apple ✅
- **Purpose:** one-tap native identity (required by App Store when other social logins exist).
- **Workflow:** `expo-apple-authentication` → identity token → `POST /auth/apple` → session;
  first time creates the user (name/email relay honored).
- **UI:** `AppleSignInButton` placed **above** Google.
- **Permissions:** role-agnostic.
- **Offline:** requires network.
- **API:** `POST /auth/apple {identityToken, nonce}`.
- **DB:** `identities(provider='apple', sub, user_id)`; email may be a private relay.
- **Notify:** new-device alert as usual.
- **AC:** works with Hide-My-Email; re-auth links to the same account by `sub`.

### 5.3 Google sign-in ✅
- **Purpose:** one-tap for Google users.
- **Workflow:** OAuth via ASWebAuthenticationSession → `numil://auth/callback` → `POST /auth/google`.
- **UI:** `GoogleSignInButton` below Apple.
- **Permissions:** role-agnostic.
- **Offline:** requires network.
- **API:** `POST /auth/google {authCode, codeVerifier}` (PKCE).
- **DB:** `identities(provider='google', sub, user_id)`.
- **Notify:** new-device alert.
- **AC:** account-linking by verified email; PKCE enforced.

### 5.4 Enterprise SSO (SAML 2.0 / OIDC) ✅
- **Purpose:** federated login via the org's IdP (Okta, Azure AD, Google Workspace).
- **Workflow:** user types **work email** → server resolves the org's IdP from the domain →
  opens IdP in a secure web session → assertion/`id_token` → `numil://auth/callback` → session.
- **UI:** `SSOEmailStep` → `SSODiscoveryLoader` → in-app browser → back to app.
- **Permissions:** org must have SSO configured (see [30 · Workspace Administration](./30-workspace-administration.md)).
- **Offline:** requires network.
- **API:** `POST /auth/sso/discover {email}` → `{ssoUrl}`; `POST /auth/sso/callback`.
- **DB:** `org_sso_config(org_id, protocol, metadata_url, cert, domain[])`, `identities`.
- **Notify:** new-device alert; admin sees SSO login in audit.
- **AC:** enforced-SSO orgs block password login; JIT-provisions the user on first SSO login.

### 5.5 SCIM provisioning (enterprise) 🔜
- **Purpose:** auto-provision/deprovision users & groups from the IdP.
- **Workflow:** IdP pushes SCIM 2.0 changes → users created/updated/deactivated automatically;
  deprovision instantly revokes sessions.
- **UI:** admin-facing token issuance in module 30 (not an end-user screen).
- **Permissions:** Admin/Owner configure; bearer-token authenticated endpoint.
- **Offline:** N/A (server-to-server).
- **API:** `SCIM /Users`, `/Groups` (RFC 7644) under `/scim/v2`.
- **DB:** `scim_tokens(org_id, hash)`, maps to `users`/`memberships`.
- **Notify:** deprovision → session-revoked; admin audit entry.
- **AC:** deprovisioned user is signed out within seconds; group→role mapping applied.

### 5.6 OTP email/phone verification ✅
- **Purpose:** verify ownership at sign-up and step-up.
- **Workflow:** 6-digit code emailed; `OTPInput` auto-advances; autofill from Messages; verify.
- **UI:** OTP sheet with masked destination + `ResendTimer`.
- **Permissions:** N/A.
- **Offline:** requires network.
- **API:** `POST /auth/otp/send`, `POST /auth/otp/verify {code}`.
- **DB:** `otp_challenges(id, user_id?, dest_hash, code_hash, expires_at, attempts)`.
- **Notify:** the OTP delivery itself.
- **AC:** code expires in 10 min; ≤5 attempts; resend cooldown 30s; constant-time compare.

### 5.7 Passkeys (WebAuthn) 🟣
- **Purpose:** phishing-resistant, passwordless sign-in synced via iCloud Keychain.
- **Workflow:** register a passkey after login; next sign-in uses Face ID against the passkey.
- **UI:** `PasskeyPrompt`; requires Associated Domains for `numil.app`.
- **Permissions:** per-user; org may require it.
- **Offline:** local assertion works; server verification needs network.
- **API:** `POST /auth/webauthn/register/options|verify`, `.../assert/options|verify`.
- **DB:** `webauthn_credentials(id, user_id, credential_id, public_key, sign_count, aaguid)`.
- **Notify:** new-passkey-registered security alert.
- **AC:** passkey sign-in requires no password; sign-count replay is rejected.

### 5.8 Two-factor authentication (TOTP) 🔜
- **Purpose:** second factor for password accounts.
- **Workflow:** enroll authenticator (QR) → verify → recovery codes; login prompts for code.
- **UI:** `MfaChallengeSheet`, `RecoveryCodeInput`, enrollment QR (in Settings).
- **Permissions:** per-user; org can enforce.
- **Offline:** the authenticator app is offline; Numil verification needs network.
- **API:** `POST /auth/mfa/totp/enroll|verify`, `POST /auth/mfa/challenge`.
- **DB:** `mfa_totp(user_id, secret_enc, confirmed_at)`, `recovery_codes(user_id, code_hash, used)`.
- **Notify:** 2FA enabled/disabled security alert.
- **AC:** ±1 time-step tolerance; recovery codes single-use; enforced-org users must enroll.

### 5.9 Biometric app lock (Face ID / Touch ID) ✅
- **Purpose:** protect an already-authenticated session on the device.
- **Workflow:** on cold start or after idle timeout, present `BiometricLockScreen`;
  `expo-local-authentication` → unlock; fallback to device passcode.
- **UI:** full-screen lock cover; passcode fallback.
- **Permissions:** per-user setting; org can require.
- **Offline:** fully offline (local biometric).
- **API:** none (local); toggling the setting syncs a pref.
- **DB:** `biometric_enabled`, `auto_lock_min` in local secure prefs.
- **Notify:** none.
- **AC:** after failed biometric, passcode fallback appears; tokens stay in Keychain, never exposed.

### 5.10 Sessions & token rotation ✅
- **Purpose:** keep users signed in securely across launches/devices.
- **Workflow:** short access JWT (~15m) + rotating refresh (30–90d); silent refresh on `401`;
  refresh-reuse detection revokes the whole token family (replay protection).
- **UI:** invisible; "Signed out for security" toast on family revoke.
- **Permissions:** N/A.
- **Offline:** valid tokens unlock read-only offline; refresh deferred until online.
- **API:** `POST /auth/refresh {refresh}`, `POST /auth/logout`, `POST /auth/logout-all`.
- **DB:** `sessions(id, user_id, device_id, refresh_hash, family_id, expires_at, revoked_at?)`.
- **Notify:** "New device signed in" alert; "signed out everywhere" confirmation.
- **AC:** single silent refresh + retry on `401`; reused refresh token revokes the family.

---

## 6. Smart AI Features

Auth is deliberately **low-AI** (security-sensitive), but a few assistive/protective uses:

| Capability | What it does |
|-----------|--------------|
| **Anomaly / risk scoring** 🔜 | Server-side model flags impossible travel, credential-stuffing bursts, and new-device risk → triggers step-up MFA (not a hard block). |
| **Smart step-up** 🔜 | Only challenges MFA when risk is elevated (adaptive auth), reducing friction on trusted devices. |
| **Support triage** 💡 | On repeated failures, an in-app helper explains the exact cause (locked, wrong method, SSO required) instead of a generic error. |

All scoring uses **metadata only** (device, IP geo, timing) — never task content — and is logged
per [19 · AI Assistant & Copilot](./19-ai-assistant-copilot.md) governance. AI never bypasses a
factor; it can only *raise* assurance requirements.

---

## 7. Productivity Features

- **One-tap return:** biometric unlock makes the common case zero-typing.
- **iOS autofill:** Password AutoFill + Associated Domains so Keychain/passkeys prefill;
  OTP autofill from Messages (`textContentType="oneTimeCode"`).
- **Remember active workspace:** the last org is restored on unlock so users land where they left.
- **Deferred sign-in:** deep links captured while unauthenticated are replayed post-auth
  (e.g., open an invite or a task straight after signing in).
- **Fast SSO:** domain→IdP discovery means enterprise users only type an email.

---

## 8. Enterprise Features

- **Enforced SSO:** org can require SSO and disable password login for its members.
- **SCIM lifecycle** (🔜): provision/deprovision + group→role mapping (see 5.5).
- **Session policy:** org-set idle + absolute lifetimes, required biometric lock, and device
  allow-listing (enterprise) — configured in [30 · Workspace Administration](./30-workspace-administration.md).
- **Audit:** every auth event (login, refresh-family revoke, role/method change, export) is
  written to the immutable audit log ([29 · Activity & Audit](./29-activity-feed-audit-logs.md))
  and surfaced in [40 · Security & Compliance Center](./40-security-compliance-center.md).
- **Remote sign-out:** admin can revoke a member's sessions instantly (on deprovision/removal).
- **Data residency / no-log PII:** auth logs store hashes/metadata, not raw credentials.

**Auth capability permission matrix** (roles per
[shared/rbac-permissions.md](./shared/rbac-permissions.md)):

| Action | Owner | Admin | Manager | Member | Guest |
|--------|:-----:|:-----:|:-------:|:------:|:-----:|
| Manage own MFA / passkey / biometric | ✅ | ✅ | ✅ | ✅ | ✅ |
| View / revoke own sessions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configure org SSO (SAML/OIDC) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Issue / rotate SCIM token | ✅ | ✅ | ❌ | ❌ | ❌ |
| Set org session & lock policy | ✅ | ✅ | ❌ | ❌ | ❌ |
| Enforce SSO / require 2FA for org | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remotely sign out a member | ✅ | ✅ | ❌ | ❌ | ❌ |
| View auth audit log | ✅ | ✅ | scoped | ❌ | ❌ |

Authentication itself is role-agnostic (anyone can sign in); the matrix above governs
**auth administration**. Every member controls their own factors and sessions.

---

## 9. Collaboration Features

Auth enables collaboration but is mostly single-user; the collaborative touchpoints are:
- **Invite-to-auth continuity:** an `numil://invite/{code}` deep link carries the user through
  sign-up/sign-in and hands off to [06 · Onboarding](./06-onboarding.md) with the invite intact.
- **Shared-device awareness:** a warning when signing in on a device that already has another
  active Numil account (prevents cross-account leakage); explicit account switch required.
- **Team security posture:** admins see who uses SSO/2FA/passkeys (adoption), enabling nudges.

---

## 10. Offline Architecture

Deltas over [shared/offline-sync-engine.md](./shared/offline-sync-engine.md):
- **No fresh authentication offline** — login/SSO/OTP/refresh all require network.
- A **valid cached session** (unexpired access or refreshable token) unlocks the app in
  read-only/optimistic mode; mutations queue in the outbox as usual.
- **Biometric unlock is fully offline** (local `expo-local-authentication`).
- If the refresh token is expired at launch with no network → show "You're offline — connect to
  sign in" rather than a dead spinner; allow retry when connectivity returns.
- Auth state (tokens) lives in **Keychain**, never in the SQLite mirror or AsyncStorage.

---

## 11. Security

Deltas over [shared/security-baseline.md](./shared/security-baseline.md) (canonical):
- **Tokens:** access ~15m + rotating refresh (30–90d) in Keychain via `expo-secure-store`;
  refresh-reuse detection revokes the family (replay protection).
- **Passwords:** Argon2id server-side; never logged; generic errors (no user enumeration).
- **Transport:** TLS 1.2+, **certificate pinning** (backup pins + kill-switch).
- **OTP:** hashed, constant-time compare, 10-min expiry, ≤5 attempts, 30s resend cooldown.
- **Lockout:** progressive backoff after 5 failures; CAPTCHA/step-up after 10.
- **Device trust:** register `deviceId`; new-device login raises an alert; optional admin
  device allow-listing (enterprise).
- **Jailbreak/root:** best-effort detection → warn + restrict sensitive actions; wipe tokens
  on detected compromise.
- **App Store compliance:** Sign in with Apple offered wherever Google is; respects
  `ITSAppUsesNonExemptEncryption: false`.

---

## 12. Notification System

Deltas over [12 · Notifications & Alerts](./12-notifications-alerts.md):
- **Security alerts (high priority, cannot be muted):** new-device sign-in, password changed,
  2FA/passkey added or removed, "signed out of all devices."
- Delivered via **push + email**; push category has an **"It wasn't me → Secure account"** action
  that opens the security center.
- OTP delivery is transactional email/SMS (not a push).
- No task/PII content in security notifications; they reference device/location metadata only.

---

## 13. Accessibility

Deltas over [shared/accessibility-spec.md](./shared/accessibility-spec.md):
- OTP boxes announce position ("Digit 3 of 6") and accept paste/dictation.
- `PasswordField` show/hide toggle announces state; the field is never read aloud when masked.
- Biometric lock offers an equal **passcode** path for users who can't use Face ID.
- All buttons ≥44×44pt; error banners use `accessibilityLiveRegion="assertive"`.
- Social/SSO buttons have explicit labels ("Continue with Apple"); logo has a text alternative.
- Full Dynamic Type; the auth card scrolls rather than clips at AX5.

---

## 14. Animations

Deltas over [shared/animation-spec.md](./shared/animation-spec.md):
- Screen transitions use iOS slide; the **biometric lock** fades (`motion.base`), not slides.
- `SubmitButton` shows an inline spinner (no full-screen block); success → brief check before
  navigation.
- OTP box fill: subtle scale pop per digit (`motion.instant`); error → shake (disabled under
  Reduce Motion, replaced by a color+label change).
- Face ID success uses the system animation; no custom celebratory motion on auth.

---

## 15. Performance

- **Cold start to lock:** biometric prompt appears <500ms after a warm launch (token read from
  Keychain is synchronous-fast; no network on the unlock path).
- **Silent refresh** is single-flight and de-duped so concurrent `401`s trigger one refresh.
- Social/SSO SDKs are lazy-loaded on button tap to keep the initial auth bundle small.
- In-app browser (ASWebAuthenticationSession) is reused; SSO discovery response is cached per
  domain for the session.
- No blocking spinners: forms disable inputs + show inline progress; retries use backoff.

---

## 16. Database Design

```text
users(id, email, email_verified, name, avatar_url?, created_at, deleted_at?)
auth_credentials(user_id→users, password_hash, algo='argon2id', updated_at)  -- nullable for SSO-only
identities(id, user_id→users, provider, provider_sub, email?, created_at)
           UNIQUE(provider, provider_sub)                                    -- apple/google/oidc
sessions(id, user_id→users, device_id, refresh_hash, family_id, ip, user_agent,
         created_at, last_used_at, expires_at, revoked_at?)
otp_challenges(id, user_id?, dest_hash, code_hash, purpose, attempts, expires_at, consumed_at?)
mfa_totp(user_id→users, secret_enc, confirmed_at?)
recovery_codes(id, user_id→users, code_hash, used_at?)
webauthn_credentials(id, user_id→users, credential_id, public_key, sign_count, aaguid, created_at)
org_sso_config(org_id→orgs, protocol, metadata_url, cert, domains[], enforce, updated_at)
scim_tokens(id, org_id→orgs, token_hash, created_at, revoked_at?)
device_registry(id, user_id→users, device_id, name, platform, trusted, last_seen_at)
auth_audit(id, user_id?, org_id?, event, ip, geo, device_id, result, created_at)  -- immutable
```

**Indexes:** `users(email)` unique-ci; `identities(provider, provider_sub)` unique;
`sessions(user_id, revoked_at)`, `sessions(family_id)`; `otp_challenges(dest_hash, expires_at)`;
`auth_audit(user_id, created_at)`, `auth_audit(org_id, created_at)`.
**Constraints:** SSO-only users may have null `auth_credentials`; enforced-SSO orgs reject
password login. **Soft-delete:** `users.deleted_at` anonymizes PII; sessions cascade-revoke.
**History:** `auth_audit` is append-only/immutable. Aligns with
[17 · Data Model & API](./17-data-model-api.md).

---

## 17. API Design

Follows [shared/api-conventions.md](./shared/api-conventions.md). Auth endpoints are **tightly
rate-limited** (default 10/min/IP) and never require an existing session except refresh/logout.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/signup` | Create account (email/password) → OTP |
| POST | `/auth/login` | Email/password → tokens or `mfaRequired` |
| POST | `/auth/apple` · `/auth/google` | Social sign-in (token/PKCE) |
| POST | `/auth/sso/discover` · `/auth/sso/callback` | SSO domain discovery + assertion |
| POST | `/auth/otp/send` · `/auth/otp/verify` | Email/phone OTP |
| POST | `/auth/mfa/challenge` · `/auth/mfa/totp/enroll` · `/auth/mfa/totp/verify` | 2FA |
| POST | `/auth/webauthn/register/*` · `/auth/webauthn/assert/*` | Passkeys |
| POST | `/auth/refresh` | Rotate tokens (family reuse detection) |
| POST | `/auth/forgot` · `/auth/reset` | Password recovery |
| POST | `/auth/logout` · `/auth/logout-all` | Revoke session / all sessions |
| GET | `/auth/sessions` · DELETE `/auth/sessions/:id` | List/revoke devices |
| SCIM | `/scim/v2/Users` · `/scim/v2/Groups` | Provisioning (enterprise) |

**Realtime:** `user:{id}` → `session.revoked` (force sign-out on this device),
`security.alert` (new device). **Errors:** `401 unauthorized` (bad creds/expired),
`403 forbidden` (SSO required / device not allowed), `409 conflict` (email exists),
`422 validation_failed` (weak password/invalid code), `429 rate_limited` (`Retry-After`).
**Idempotency-Key** on signup/otp/reset to dedupe retries.

**Sample request/response**
```http
POST /v1/auth/login
Content-Type: application/json
Idempotency-Key: 2b7e…

{ "email": "priya@acme.com", "password": "•••••••••", "deviceId": "d_19a" }
```
```json
{
  "data": {
    "accessToken": "eyJhbGciOi…",
    "refreshToken": "rt_9f2c…",
    "expiresIn": 900,
    "user": { "id": "u_88", "name": "Priya", "email": "priya@acme.com" },
    "mfaRequired": false,
    "orgs": [ { "id": "org_1", "role": "member" } ]
  },
  "meta": { "requestId": "req_5c1" }
}
```
A `mfaRequired: true` response omits tokens and returns `mfaToken` for `POST /auth/mfa/challenge`.

---

## 18. Edge Cases

- **Offline at launch, expired refresh:** show "connect to sign in"; retry on reconnect.
- **Silent refresh fails (revoked family):** route to Sign in with "Signed out for security."
- **Reused refresh token (replay):** revoke whole family; alert user.
- **SSO required but user tries password:** `403` → route to SSO with an explanation.
- **Social email collides with an existing account:** offer account-linking after verification.
- **Apple Hide-My-Email / relay change:** match by stable `sub`, not email.
- **OTP expired / too many attempts:** clear error + resend after cooldown; new code invalidates old.
- **Clock skew (TOTP):** ±1 step tolerance; guidance to sync device time on repeated failure.
- **Deep link `reset` token expired:** show "link expired" + request a new one.
- **New-device login by attacker:** alert with "Secure account" action → revoke all + reset.
- **Deprovisioned via SCIM mid-session:** `session.revoked` signs the device out within seconds.
- **Biometric hardware unavailable/changed (new Face ID enrollment):** fall back to passcode;
  re-arm biometric after a full password/passkey sign-in (prevents enrollment hijack).
- **Rate-limited:** `RateLimitCard` with `Retry-After` countdown; core marketing screen usable.
- **Account deletion in progress:** login blocked with a recovery-window message.

---

## 19. User States

- **First-time:** Welcome → choose method; social/SSO emphasized; email/password available.
- **Returning (trusted device):** biometric unlock → straight into last workspace.
- **Returning (new device):** full sign-in + new-device alert; may face step-up MFA.
- **Power user:** passkey or biometric, multiple orgs, fast workspace restore.
- **Guest:** authenticates like anyone; role/scope limited after join (module 13).
- **Manager/Admin/Owner:** same auth; Admin/Owner also manage org SSO/session policy (module 30).
- **Enforced-SSO member:** password fields hidden; only the SSO path is offered.
- **Offline / poor network:** cached session unlocks read-only; auth actions deferred.
- **Tablet/landscape:** centered auth card; split-view friendly.
- **Dark mode / large text / a11y:** full token theming, Dynamic Type, VoiceOver flows verified.

---

## 20. Analytics Events

Schema per [shared/analytics-taxonomy.md](./shared/analytics-taxonomy.md). Auth events carry
**no PII** (no email/password); method + result codes only.

| event | key properties |
|-------|----------------|
| `signup_started` / `signup_completed` | `method` (email/apple/google/sso) |
| `login_succeeded` | `method`, `new_device`, `mfa_used` |
| `login_failed` | `method`, `error_code` |
| `otp_sent` / `otp_verified` | `purpose`, `attempts` |
| `mfa_challenged` / `mfa_succeeded` | `factor` (totp/passkey/recovery) |
| `sso_discovery` | `resolved` (bool) |
| `passkey_registered` | — |
| `biometric_unlock` | `result` (success/fallback/fail) |
| `token_refreshed` | `family_rotated` |
| `session_revoked` | `scope` (one/all), `reason` |
| `security_alert_shown` | `type` (new_device/pw_change/mfa_change) |
| `signout` | `cleared_cache` |

Funnels: `signup_started → signup_completed → org_created/joined` (activation);
`login_failed` clustering by `error_code` to catch outages/lockout spikes.

---

## 21. Acceptance Criteria

1. A user can sign up with email/password and verify via OTP, reaching onboarding.
2. Sign in with Apple works, including Hide-My-Email, and links by stable `sub`.
3. Google sign-in works via PKCE and links by verified email.
4. SSO discovery routes a work email to the correct IdP and back to the app.
5. Enforced-SSO orgs hide password login for their members.
6. SSO first login JIT-provisions the user with the mapped role.
7. OTP codes expire in 10 minutes, allow ≤5 attempts, and resend after a 30s cooldown.
8. OTP autofills from iOS Messages and supports paste.
9. Wrong credentials return a generic error (no user enumeration).
10. Progressive lockout triggers after 5 failures; step-up/CAPTCHA after 10.
11. Access token (~15m) + rotating refresh (30–90d) are stored only in Keychain.
12. A single silent refresh + retry occurs on a `401`; success is invisible to the user.
13. Reusing a refresh token revokes the entire token family and signs the user out.
14. Biometric lock appears on cold start / after idle timeout and unlocks the app.
15. Biometric failure falls back to device passcode.
16. Tokens are never exposed to JS logs, analytics, or AsyncStorage.
17. New-device sign-in raises an email + push security alert with a "Secure account" action.
18. Security alerts (new device / password / 2FA / passkey changes) cannot be muted.
19. 2FA (TOTP) enrollment issues single-use recovery codes; org can enforce enrollment (🔜).
20. Passkey sign-in requires no password and rejects sign-count replay (🟣).
21. Forgot/reset works end-to-end via a `numil://reset` deep link; expired links are handled.
22. SCIM deprovisioning signs the user out within seconds (🔜).
23. Sign out clears tokens; "sign out all devices" revokes every session.
24. A valid cached session unlocks the app read-only when offline.
25. No fresh authentication is attempted offline; a clear "connect to sign in" state is shown.
26. Auth traffic is TLS 1.2+ with certificate pinning (backup pins + kill-switch).
27. Passwords are hashed with Argon2id and never logged.
28. Auth endpoints are rate-limited (default 10/min/IP) with `429 Retry-After`.
29. Sign in with Apple is offered wherever Google sign-in is (App Store compliance).
30. Jailbreak/root detection warns and restricts sensitive actions.
31. Every auth event is written to the immutable audit log.
32. Adaptive step-up MFA triggers only on elevated risk, not on trusted devices (🔜).
33. All auth screens pass VoiceOver and Dynamic Type at AX5 without clipping.
34. Reduce Motion disables OTP shake/pop; state is conveyed by color + label.
35. Deep links captured pre-auth are replayed after successful sign-in.
36. iPad/landscape centers the auth card at ≤`MaxContentWidth`.
37. Analytics events fire with method/result but no PII.

---

## 22. Future Roadmap

- **V1 (✅):** email/password, Sign in with Apple, Google, enterprise SSO (SAML/OIDC), OTP,
  biometric app lock, sessions + rotating refresh with reuse detection, forgot/reset, remote
  sign-out, new-device alerts.
- **V1.1 (🔜):** TOTP 2FA + recovery codes, SCIM provisioning, adaptive step-up (risk scoring),
  device management UI, org session-policy enforcement.
- **V2 (🟣):** WebAuthn passkeys (iCloud-synced), org-required passkeys, hardware-key (FIDO2)
  support, device allow-listing.
- **Future (💡):** passwordless magic-link default, cross-app SSO for the Numil suite, in-app
  security helper that explains failures, per-org data-residency for auth logs.
- **Experimental (🧪):** continuous/behavioral authentication signals, on-device risk model.
- **AI track:** anomaly detection + phishing-resistant nudges (metadata-only, governed).
- **Enterprise track:** SIEM streaming of auth events, access reviews, eDiscovery of sign-in
  history, SCIM group→custom-role mapping.
