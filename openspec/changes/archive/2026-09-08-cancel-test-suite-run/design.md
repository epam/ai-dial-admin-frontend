## Context

Two existing patterns cover the two surfaces this change touches:

- **Detail-page header action**: `stop-image-build` (`openspec/specs/stop-image-build/spec.md`,
  `ImagesButtonsWrapper.tsx`, `ImageStopBuild.tsx`) — a status-gated header button that opens a
  `DialConfirmationPopup`-based modal, then calls a server action and refreshes.
- **List row-menu action**: the Containers list's `getRunOperation`/`getStopOperation` pair
  (`src/constants/grid-columns/actions.tsx:198-228`, wired in `ContainersList.tsx:165-171`) — an
  inverse-gated pair of grid row operations, modal state lifted to the parent list component, status
  branching in a single handler, refresh via `router.refresh()`.

There are **two** list surfaces that show run rows with a context menu, each with its own independent
Export/Compare row-action wiring today — Cancel needs to be added to both:
- `TestSuites/Runs/Runs.tsx` — the Runs tab embedded in one Test Suite's own detail view, scoped to that
  suite's runs. AG Grid infinite-datasource driven; refresh via its own `refreshGrid()`.
- `ListView/Evaluation/List.tsx` — the shared list component behind the top-level `/runs` nav item
  (also reused, with different action sets, for TestSuites/Datasets/Metrics). Its Runs-specific actions
  are gated inline with `route === ApplicationRoute.Runs` (`List.tsx:267-270`); refresh via
  `router.refresh()` (`app/[lang]/runs/page.tsx` renders it as a server component that re-fetches on
  navigation/refresh, matching how its own Delete flow already works there).

The Runs detail page (`RunView`, `View.tsx`) has no live status channel today — it gets `run.status`
once from the server-rendered fetch. `TestSuites/Runs/Runs.tsx` has `useRunStatusStream.ts`, an SSE
subscription that patches AG Grid row data in place; it forwards `status` without validating it against
the `RunStatus` enum, so a new `CANCELLED` value passes through the data layer without code changes
there — only the places that switch on `RunStatus` (badge rendering, action gating) need the new case.
`ListView/Evaluation/List.tsx` has no equivalent stream; its grid data only changes on a full
`router.refresh()`, same as its existing Delete/Export/Compare actions.

See `proposal.md` for why this is needed and its stated non-goals (no cross-tab live sync, no bulk
cancel).

## Goals / Non-Goals

**Goals:**
- One `cancelRun` server action and one `runsApi.cancelRun` method, called from both surfaces, so the
  API-layer behavior can't drift between them.
- Each surface keeps its own confirmation-modal wrapper and its own post-success refresh, consistent
  with how Delete is already implemented independently on the list (`Runs.tsx`) and detail page — this
  change does not introduce a new shared-modal abstraction where none exists today for other actions.

**Non-Goals:**
- No new live-update channel for the detail page (e.g., extending SSE to single-run subscriptions).
  Self-triggered `router.refresh()` after a successful cancel is sufficient per the proposal's
  non-goals.
- No change to `useRunStatusStream.ts`'s forwarding logic — it already passes through arbitrary status
  strings; only enum-consuming code needs updates.

## Decisions

**Add `CANCELLED` to `RunStatus` as a plain enum member, not a derived/computed status.**
Matches the existing enum shape (`COMPLETED | RUNNING | FAILED`) and the backend's literal status
string. Alternative considered: deriving a "stopped" UI state from a separate flag — rejected, since the
backend already models it as a status value and every consuming switch statement already keys off
`RunStatus`.

**Two independent confirmation-modal components, not one shared one.**
Mirrors how the codebase already treats the same action (Delete) differently per surface: the list uses
its own `DeleteConfirmationModal` instance with `isDeleteModalOpen`/`selectedRun` state
(`Runs.tsx:46-47`, `:212-221`), while other entities' detail pages manage their own delete modal
separately. A `RunCancelModal` (detail page, following `ImageStopBuild.tsx`'s
`DialConfirmationPopup`-wrapper shape) and a single `getCancelOperation` grid-operation factory in
`grid-columns/actions.tsx` (following `getStopOperation`'s shape: same icon, hidden unless
`status === RunStatus.RUNNING`) are built once each. The factory is reused as-is by both list surfaces
— it takes an `onClick` and returns the operation declaration, so each list supplies its own modal-open
handler without the factory needing to know which list called it. Modal state (which run is pending
cancellation, whether the confirmation is open) stays list-owned in each surface separately, following
`getStopOperation`/`ContainersList.tsx`'s `modalType`/`currentContainer` shape. Alternative considered:
extracting one shared confirmation component/modal-state hook used by both lists and the detail page —
rejected as premature; nothing else in the codebase shares a confirmation modal across these surfaces,
and forcing it here would be a bigger, riskier refactor than the feature calls for.

**Each list surface keeps its own existing refresh mechanism for Cancel, rather than unifying them.**
`TestSuites/Runs/Runs.tsx` already has `refreshGrid()` wired for its Delete action
(`Runs.tsx:125-130,152-161`) — Cancel reuses it there. `ListView/Evaluation/List.tsx` already uses
`router.refresh()` for its Delete/duplicate/create flows — Cancel reuses that there. This mirrors
Containers' analogous Stop action, which also uses `router.refresh()` (that list isn't AG Grid
infinite-datasource-driven the way `Runs.tsx` is, so its mechanism doesn't transfer either way).

**Detail-page gating stays inline in `View.tsx`**, following the existing convention there
(`isCompareDisabled`, the Export `disabled` check at `View.tsx:63,85`) rather than extracting a new
gating utility — this change adds one more status comparison of the same shape.

## Risks / Trade-offs

- **[Risk] A backend value other than `CANCELLED` (e.g. a distinct `CANCELLING`/pending-cancel
  transitional state) would not be modeled by this change's enum, since only `CANCELLED` was
  confirmed.** → Mitigation: if the backend's actual cancel endpoint returns an intermediate state
  before settling, that should surface during implementation against the real API contract and be
  folded in before this change is archived; the spec's "Cancellation request and status update"
  requirement only commits to the success/failure outcome, not an intermediate state.
- **[Risk] A user could confirm cancelling a run that reaches a terminal state (completes or fails) in
  the moment between opening the confirmation dialog and confirming it, since neither surface has a
  live channel to invalidate a stale gate.** → Mitigation: this is exactly the backend's own guard
  (`cancel` only accepts `PENDING`/`RUNNING`) — the spec's "Cancellation request fails" scenario already
  covers surfacing that as an error notification rather than a silent or misleading success.
- **[Risk] Any other place in the codebase that exhaustively switches on `RunStatus` without a
  `default` case (beyond `RunStatus.tsx` and the two gating sites already identified) could silently
  render nothing or hit a TypeScript exhaustiveness error for the new `CANCELLED` member.** → Mitigation:
  TypeScript's own exhaustiveness checking on the enum will surface any such switch at compile time,
  since `RunStatus` is a real enum, not a string union — tasks.md should include a check for this via a
  full type-check pass, not a manual code search.
