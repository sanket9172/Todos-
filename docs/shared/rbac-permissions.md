# Shared · RBAC / ABAC Permission Model

Canonical authorization model. Module permission matrices reference these roles/scopes and
document only module-specific rules.

## Model overview

Numil combines **RBAC** (org + project roles) with **ABAC** (attribute checks: ownership,
visibility, membership, guest-scope). Authorization is a pure function:

```text
can(actor, action, resource) =
     roleGrants(actor.orgRole, action)
  && scopeAllows(actor, resource)         // membership/visibility/guest-scope
  && attributeRules(actor, resource)      // ownership, privacy, lifecycle state
```

All checks run **server-side**; the client mirrors them only to hide/disable UI.

## Organization roles

| Role | Summary |
|------|---------|
| **Owner** | Everything + billing + delete/transfer org. |
| **Admin** | Manage members/roles/security/all projects (no billing/delete org). |
| **Manager** | Create/manage own/assigned projects, assign work, team reports. |
| **Member** | Create/complete tasks in accessible projects, comment, personal tasks. |
| **Guest** | External; only explicitly shared projects/tasks. |

## Project roles (per project)

| Project role | Powers |
|--------------|--------|
| **Lead** | Project settings, members, delete/archive, all task ops |
| **Contributor** | Create/edit/complete/assign tasks, comment |
| **Viewer** | Read + comment only |

## Scopes & attributes

- **Visibility:** `private` (members + org Admins) vs `org_readable` (all org members can
  view read-only).
- **Ownership:** personal tasks (`projectId = null`) are visible only to the owner — even
  Admins cannot read them.
- **Guest scope:** guests resolve only to resources in an explicit share list.
- **Lifecycle:** archived projects are read-only; deleted resources return `gone`.

## Master action matrix (org level)

| Action | Owner | Admin | Manager | Member | Guest |
|--------|:-----:|:-----:|:-------:|:------:|:-----:|
| View org-readable project | ✅ | ✅ | ✅ | ✅ | shared |
| Create project | ✅ | ✅ | ✅ | ⚙️ | ❌ |
| Manage any project | ✅ | ✅ | own/assigned | ❌ | ❌ |
| CRUD tasks | ✅ | ✅ | ✅ | ✅* | shared* |
| Assign to others | ✅ | ✅ | ✅ | project-policy | ❌ |
| Comment / mention | ✅ | ✅ | ✅ | ✅* | shared* |
| Manage automation | ✅ | ✅ | project | ❌ | ❌ |
| Invite members | ✅ | ✅ | ≤Member/Guest | ❌ | ❌ |
| Change roles | ✅ | ≤Admin | ❌ | ❌ | ❌ |
| Org settings/security | ✅ | ✅ | ❌ | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete/transfer org | ✅ | ❌ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | scoped | ❌ | ❌ |

`⚙️` gated by org setting "Members can create projects". `*` within accessible scope.

## Custom roles (enterprise, v2)

- Admins can define custom roles as an allow-list of granular permissions
  (`task.create`, `automation.manage`, `report.view.team`, …). Stored per org; evaluated
  the same way. Guests remain share-scoped regardless.

## Enforcement points

1. **API middleware:** `can()` guard on every route before handler.
2. **Query scoping:** list endpoints filter to authorized rows (no over-fetch then filter).
3. **Realtime:** channel subscription authorized on connect + per-message.
4. **Client:** hide/disable unauthorized affordances; never rely on client for security.

## Acceptance (global)

- [ ] Every mutation authorized server-side with role + scope + attribute checks.
- [ ] Personal tasks never readable by Admins/others.
- [ ] Guests resolve only shared resources across all endpoints and realtime.
- [ ] Org-readable projects are read-only for non-members.
- [ ] Role changes take effect immediately (token/claims refresh).
