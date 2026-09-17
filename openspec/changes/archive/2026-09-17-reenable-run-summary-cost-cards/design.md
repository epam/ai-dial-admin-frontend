## Context

See `proposal.md` — Why. Requirements live in `specs/run-summary-cost-cards/spec.md`.

Cost cards were shipped in #4312 via an independent `useRunCosts` → `getRunCosts` path so dial-adas
failures would not blank the analytics structured-query KPI strip. They were temporarily gated off
in #4554 because the kit `DialAnalyticsCard.isLoading` path only shows a bare spinner and hides the
description — a multi-minute costs call looked broken.

Figma (`Summary _ Loading`, nodes `1067:23084` / `1067:23103`) specifies:

- Value: loader + **Calculating…**
- Description: **`00:15 elapsed · usually under 2 min`**
- Error badge only after failure or a generous client timeout (issue: 3 min)

## Goals / Non-Goals

**Goals:**

- Always show the two cost cards beside other Summary KPIs.
- Calculating state with ticking `MM:SS` elapsed and soft “usually under 2 min” copy.
- Error badge after null/throw or 3-minute client timeout; late success still replaces Error.
- Keep the costs fetch independent of `useRunAnalyticsSlice`.

**Non-Goals:**

- Aborting / cancelling the in-flight server action on timeout.
- Compare Summary, backend latency, or docs.

## Decisions

### 1. Do not use `DialAnalyticsCard.isLoading` for calculating

Kit `isLoading` replaces the value with a bare `DialLoader` and hides `description`. Calculating
must be a custom `value` (loader + Calculating…) plus `description` (elapsed line), with
`isLoading` left unset. Fail/timeout uses `error={true}` (kit Error tag).

### 2. Elapsed ticker and soft timeout live in `useRunCosts`

- Tick `elapsedMs` every 1s from fetch start; reset on `runId` change / unmount.
- After `COST_FETCH_TIMEOUT_MS` (180_000), set `isLoading=false` and `unavailable=true`.
- Do not abort `getRunCosts`; if it later resolves with a payload, apply it and clear unavailable.

### 3. Soft “usually under 2 min” is copy only

The 2-minute expectation is descriptive. The hard client timeout is 3 minutes per the issue.

### 4. Accessibility

- Spinner is decorative (`aria-hidden`).
- Calculating label sits in `role="status"` so the state is announced once.
- Do not put the ticking elapsed string in an `aria-live` region (would fire every second).

### 5. Incomplete-run handling for cost cards

Non-cost KPI incomplete-run dashes (#4553) stay as-is. Cost cards follow the new failure model:
null/throw/timeout → Error badge regardless of run status (costs either arrive or they do not).

## Risks / Trade-offs

- **Late success after timeout** → UI briefly shows Error then flips to dollars. Accepted; better
  than leaving a permanent Error when data arrives.
- **Custom value vs kit loading** → slight divergence from other cards’ loading chrome; required to
  match Figma.

## Migration Plan

Additive frontend change. Rollback is revert (or reintroduce `SHOW_COST_CARDS`). No feature flag.
