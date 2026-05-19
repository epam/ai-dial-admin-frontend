## Context

The change `global-firewall-audit-shortcut` introduced a one-click navigation from the Global Firewall modal (`Deployments/Modals/GlobalWhitelist.tsx`) to the standalone Activity Audit list. The handoff is done via `localStorage` keyed by `'audit-list-preselect'`, with a write at the modal click site followed by `window.open(ApplicationRoute.ActivityAudit, '_blank')`; the audit list reads the value in a `useState` lazy initializer on mount and clears it inside a gridApi-ready effect once `setFilterModel` has run.

Two pieces of feedback from real usage:

1. **Dead navigation control on audit-detail header.** The audit detail header (`ActivityAudit/View/Header/Header.tsx`) renders a "Resource identifier" row with an external-link icon button whenever `activity.resourceId` is set and `resourceType` is neither `SYSTEM_PROPERTIES` nor `ADMIN_PROPERTIES`. The button calls `openResourceInNewTab(activity)`, which uses the `auditResourceRoute` map (`Header/constants.ts`) to compute a target URL. The map has no entry for `IMAGE_BUILD_DOMAIN_WHITELIST` (the global firewall resource type), so for global-firewall activities the button is visible but inert.

2. **localStorage handoff races in production.** Users intermittently report opening the audit list from the modal with no preselected filter. The most plausible mechanism (confirmed by code inspection ruling out other readers/clearers, double-mounts, and auth bounces): in production builds with site isolation, `localStorage` writes are mediated by an out-of-process storage service, so the synchronous `setItem` call in the modal's tab does not guarantee that the commit has been propagated to the new tab's renderer process by the time the new tab reads the value during initial mount. Once the read returns `null`, the existing `useState(() => readAuditListPreselect())` snapshot caches `null` forever for that audit-list instance — the bug is unrecoverable on that page load.

### What was ruled out before landing on sessionStorage

| Alternative | Why rejected |
| --- | --- |
| URL query parameter (`?preselect=...`) | Off the table per user direction (URL surface must remain canonical). |
| URL hash fragment (`#preselect=...`) | Off the table per user direction (same rule extends to the hash). |
| Add a `storage`-event listener in the audit list | `storage` events broadcast to **all** same-origin tabs. An unrelated audit tab (Tab C) that happens to be open at the moment the modal writes would catch the event and apply the filter / clear the key, sabotaging the actual destination tab. State "slips" sideways. |
| Listener in the modal that fires before navigate | The `storage` event does not fire in the same tab that called `setItem`. A monkey-patched same-tab event would fire synchronously inside `setItem` — before the cross-process commit completes — so it cannot signal durability. |
| postMessage handshake (new tab requests value from `window.opener`) | Works correctly but requires ~30 lines of new coordination spread across the writer and reader, plus a holder for the pending value in the modal page. The current call site uses no `noopener`, so `window.opener` is available, but the additional surface area is not justified for this single one-shot handoff. |
| IndexedDB with awaited `put` then navigate | Works correctly and is the only Web Storage API exposing a real "commit complete" signal. ~40 lines of wrapper for a single enum-valued boolean — heavier than the problem deserves. |

## Goals / Non-Goals

**Goals:**

- Eliminate the dead "open resource in new tab" icon on the audit detail header for global-firewall activities, by extending the existing exclusion chain rather than rewriting it into an allow-list.
- Eliminate the cross-tab preselect race deterministically, without introducing new transport mechanisms (postMessage, IndexedDB), without URL surface changes, and without broadcasting state to unrelated tabs.
- Preserve the entire surrounding behavior of the audit list preselect: lazy `useState` read on mount, deferred clear inside the gridApi-ready effect (StrictMode-safe), single-shot per consume.

**Non-Goals:**

- Restructuring the header's icon-visibility rule into a positive (allow-list against `auditResourceRoute` keys). That would be safer against future entity types but is a larger change with broader behavioral implications and is explicitly out of scope per user direction.
- Hiding the `Resource identifier` row's text content for global-firewall activities — only the navigation icon is being removed. Hiding the entire row is a separate UX call.
- Generalizing the preselect mechanism to support more than one value. The `AuditListPreselect` enum currently has a single member (`GlobalFirewall`); we keep it that way.

## Decisions

### D1. Add `IMAGE_BUILD_DOMAIN_WHITELIST` to the existing exclusion chain in `Header.tsx`

The header already guards the "open in new tab" icon with two negative checks (`SYSTEM_PROPERTIES`, `ADMIN_PROPERTIES`). We add a third with the same shape:

```tsx
{activity.resourceId &&
  activity.resourceType !== ActivityAuditResourceType.SYSTEM_PROPERTIES &&
  activity.resourceType !== ActivityAuditResourceType.ADMIN_PROPERTIES &&
  activity.resourceType !== ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST && (
    ...
  )}
```

**Rationale.** Smallest possible diff. Keeps the deny-list shape that already exists. Does not touch `auditResourceRoute` or `openResourceInNewTab`. Per user direction.

**Alternative considered:** rewrite to an allow-list checking membership in `auditResourceRoute`. Rejected — broader change, more behavioral surface area to verify, not asked for.

### D2. Swap `localStorage` → `sessionStorage` in the preselect util

Three identifier changes in `apps/ai-dial-admin/src/utils/audit-list-preselect.ts` — the calls inside `saveAuditListPreselect`, `readAuditListPreselect`, and `clearAuditListPreselect`. Nothing else moves: same key, same callers, same `useState` lazy initializer in `ActivityAuditList`, same gridApi-ready effect that applies + clears.

**Why this fixes the race.**

`sessionStorage` is scoped to a single top-level browsing context. The HTML specification (`webstorage`, "Session storage"/"Cloning data") requires that when a script in a window creates a new top-level browsing context via `window.open(...)`, the new context's session storage area for the origin SHALL start as a copy of the opener's. This clone is part of the tab-spawn handshake — it is sequenced after the JS that called `window.open` ran (including any `setItem` that preceded it) and before any script in the new tab runs. There is therefore no "is the commit durable yet?" question at all: the value is in the new tab's session storage at the instant its first JS executes, by construction.

This rules out the failure mode the bug exhibits:

```
Tab A (modal)                                    Tab B (new audit tab)
─────────────                                    ─────────────────────
sessionStorage.setItem(KEY, 'global-firewall')   (does not exist yet)
   │
   ├─ updates Tab A's session storage area
   │  (per-context, no cross-process service)
   │
window.open('/activity-audit', '_blank')
   │
   └─ browser clones Tab A's session storage
      into the new context as part of the
      navigation/spawn handshake
                                                 first JS runs
                                                 sessionStorage.getItem(KEY)
                                                 → 'global-firewall' ✅
                                                 (apply + remove)
```

**Why this also fixes the leakage problem.**

`sessionStorage` is *not* shared across tabs. Tab C (an unrelated audit tab the user already had open) keeps its own session storage; Tab A's write does not appear in it, and `sessionStorage` does not emit cross-tab `storage` events at all. The "sideways consume" failure mode of any localStorage-event-based fix is therefore architecturally impossible here.

**Cost.**

```diff
- localStorage.setItem(AUDIT_LIST_PRESELECT_STORAGE_KEY, value);
+ sessionStorage.setItem(AUDIT_LIST_PRESELECT_STORAGE_KEY, value);
```

…repeated for `getItem` and `removeItem`. No new APIs, no new files, no new tests required beyond updating existing assertions.

**Alternatives considered:** localStorage + storage-event listener (rejected: leaks to Tab C); listener in modal before navigate (rejected: doesn't fire); postMessage / `window.opener` (rejected: more code, more surface); IndexedDB awaited put (rejected: heavyweight for one enum value). See the Context table for the full reasoning.

### D3. Comment the `window.open` call to flag the `noopener` interaction

Add a single-line comment above `window.open(ApplicationRoute.ActivityAudit, '_blank')` in `Deployments/Modals/GlobalWhitelist.tsx`. The comment names the dependency on opener-inherited `sessionStorage` and warns that adding `'noopener'` here (or moving to a `rel="noopener"` link) would silently break the preselect handoff.

**Rationale.** The fix relies on a non-obvious browser behavior whose precondition is invisible at the read site. A future contributor refactoring this code (e.g., security-pass over `window.open` calls, switching to an `<a>` element) could plausibly add `noopener` and break the feature with no test failure. One comment is cheap insurance.

### D4. Do not rename the storage key or the enum

`AUDIT_LIST_PRESELECT_STORAGE_KEY === 'audit-list-preselect'` stays. `AuditListPreselect.GlobalFirewall === 'global-firewall'` stays. The semantics of the slot are unchanged from the caller's perspective; only the backing storage changes.

**Rationale.** Renaming would create noise in the diff without clarifying anything. Future maintainers who grep the codebase will find the key, follow it to the util, and see the util uses `sessionStorage` — no ambiguity.

## Risks / Trade-offs

- **Risk:** Future contributor adds `noopener` to the `window.open` call. → Mitigation: D3 comment at the call site.
- **Risk:** Stale `localStorage['audit-list-preselect']` left over from before this change persists in some users' browsers indefinitely. → Mitigation: harmless — nothing reads or writes that key anymore. Optionally a one-time `localStorage.removeItem` cleanup could be added, but it's not necessary for correctness and would add visible noise to the writer.
- **Trade-off:** sessionStorage inheritance only applies to programmatic `window.open(...)` from the same script. If anyone in the future wires the same handoff to a user-initiated middle-click / Ctrl-click "open in new tab" on a real link, the new tab will *not* inherit session storage and the preselect will be lost. → Mitigation: the only caller is `GlobalWhitelist.tsx`'s `onViewInActivityAudit`, which is a button-click handler that programmatically calls `window.open`. The risk is hypothetical and would manifest at the new call site, not silently.
- **Trade-off:** Anyone who relied on cross-tab visibility of the preselect (none in the current codebase) would be broken. → Mitigation: there are no other readers — verified by grepping for `AUDIT_LIST_PRESELECT_STORAGE_KEY`, `readAuditListPreselect`, and `audit-list-preselect`.

## Migration Plan

No data migration. The change is forward-only: after deploy, the new modal writes to `sessionStorage` and the new audit list reads from `sessionStorage`. Old code paths (and any in-flight tabs running pre-deploy code that may have written to `localStorage`) are isolated from the new flow.

Rollback: revert the three-line swap in `audit-list-preselect.ts` and the one-line header guard. Trivial, no schema or data implications.

## Open Questions

None. Both fixes were explicitly chosen by the user after exploring alternatives.
