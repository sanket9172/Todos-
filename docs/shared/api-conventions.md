# Shared · API & Realtime Conventions

Canonical API rules. Module **Section 17 (API Design)** follows these and documents only
its endpoints/events. Base: REST/JSON + WebSocket realtime; optional GraphQL read layer.

## Base

- Base URL: `https://api.numil.app/v1`
- All timestamps ISO-8601 **UTC**. All ids UUID v4/v7.
- `Content-Type: application/json`. `Authorization: Bearer <accessToken>`.
- Every request: `X-Request-Id` (client) echoed in responses/logs.

## Standard headers

| Header | Purpose |
|--------|---------|
| `Idempotency-Key` | Required on non-GET mutations; dedupes retries |
| `X-Org-Id` | Active workspace scope |
| `X-Client-Version` | app version/build |
| `If-Match` / `ETag` | Optimistic concurrency (version) |

## Response envelope

```json
{ "data": { }, "meta": { "requestId": "..." } }
```

List responses:

```json
{ "data": [ ], "meta": { "nextCursor": "opaque", "total": 128 } }
```

## Pagination, filtering, sorting

- **Cursor pagination:** `?limit=50&cursor=<opaque>` (preferred over offset).
- **Filtering:** `?filter[status]=open&filter[assignee]=me&filter[due]=today`.
  Multi-value = comma (OR within a key; AND across keys).
- **Sorting:** `?sort=-dueAt,priority` (`-` = desc).
- **Sparse fields / expand:** `?fields=id,title,dueAt&expand=assignee,labels`.

## Errors

- Standard HTTP codes + machine-readable body:

```json
{ "error": { "code": "task_not_found", "message": "…", "field": null, "requestId": "…" } }
```

| Code | HTTP | Meaning |
|------|------|---------|
| `validation_failed` | 422 | field-level errors in `details[]` |
| `unauthorized` | 401 | missing/expired token |
| `forbidden` | 403 | lacks permission/scope |
| `not_found` | 404 | |
| `gone` | 409 | referenced entity deleted |
| `conflict` | 409 | version mismatch (If-Match) |
| `rate_limited` | 429 | `Retry-After` header |
| `server_error` | 500 | `requestId` for support |

## Idempotency & concurrency

- Mutations require `Idempotency-Key`; server caches result 24h.
- Updates use `If-Match: <version>`; mismatch → `409 conflict` with server copy.

## Rate limits

- Per-user + per-IP token buckets; defaults e.g. 600 req/min/user, tighter on auth
  (10/min) and AI (per-plan quotas). `429` returns `Retry-After` + `X-RateLimit-*`.

## Realtime (WebSocket)

- Connect: `wss://rt.numil.app/v1?token=<access>`; subscribe to channels:
  `org:{id}`, `project:{id}`, `task:{id}`, `user:{id}`.
- Event envelope:

```json
{ "type": "task.updated", "channel": "project:...", "version": 42, "data": { }, "ts": "…" }
```

- Event types: `*.created|updated|deleted`, `comment.created`, `presence.changed`,
  `typing.changed`, `notification.created`, `automation.triggered`.
- Client reconciles by `version`; missed events recovered via delta `GET /sync?since=`.
- Presence/typing are ephemeral (not persisted).

## Sync endpoint (offline)

- `GET /sync?since=<cursor>` → changed entities + `nextCursor`.
- `POST /sync` → batch ops (see `shared/offline-sync-engine.md`), idempotent by `opId`.

## Webhooks (outbound, enterprise)

- Signed (HMAC `X-Numil-Signature`), retried with backoff, delivery log, replay endpoint.
- Events mirror realtime types; configured in `38-developer-api-webhooks.md`.

## Versioning & deprecation

- URL-versioned (`/v1`). Additive changes are non-breaking; breaking changes → `/v2` with
  a deprecation window + `Sunset` header.

## GraphQL (optional read layer, v2)

- Single `/graphql` for complex reads (dashboards/reports) to reduce round-trips; mutations
  stay REST for idempotency clarity.
