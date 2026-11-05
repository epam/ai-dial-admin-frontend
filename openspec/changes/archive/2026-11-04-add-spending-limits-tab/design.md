## Context

System Properties edits Core's global-settings singleton (`v1/settings/platform/global`). One page
component, `SystemProperties.tsx`, holds `currentSettings`, derives `isChanged` with `isEqual`, and saves
the whole object through `updateProperties`. Each tab is a child that receives its slice and an
`onChange…` callback. `RateLimitSchedule.tsx` is the closest sibling: an optional object field, defaults
displayed when absent, validation reported through `SaveValidationContext`, controls disabled for a
read-only admin.

Core's `GlobalSettings.spendingLimits` is `{ mode: off | shadow | enforce, defaultCostObject: string }`,
defaults `off` / `ORG`. The blob overrides the config file wholesale, so a pre-existing blob without the
field reads as `off` / `ORG` and can hide a file value (see proposal, Non-goals).

## Goals / Non-Goals

**Goals:**
- A Spending Limits tab that reads, edits and saves `spendingLimits` with the same behaviour model as
  Rate Limit Schedule.
- No change to the save path or to how other fields round-trip.

**Non-Goals:**
- Reading the file-config view, editing `retriableErrorCodes`, client-side cost-object format rules.

## Decisions

### D1: Mirror the Rate Limit Schedule tab rather than invent a shape
New `SpendingLimits.tsx` beside `RateLimitSchedule.tsx`, with props `{ spendingLimits?, onChangeSpendingLimits }`,
a `changeSpendingLimits` callback in `SystemProperties.tsx` that handles a null `prev` the same way, and a
new `EntityViewTab.SpendingLimits` entry appended to `getSystemPropertiesTabs`.
*Alternative:* one generic "settings form" component driven by a field schema. Rejected: two tabs do not
justify the abstraction, and the codebase favours sibling-shaped components.

### D2: Absent field shows defaults and stays undefined in state
`effectiveSpendingLimits = spendingLimits ?? DEFAULT_SPENDING_LIMITS` (`off` / `ORG`). The first edit
spreads the effective value, so both fields are written together. Opening the tab or focusing and blurring
a control never dirties the page.
*Alternative:* write defaults into state on mount. Rejected: every environment without a blob would open
dirty, and a save would create a blob that starts hiding the config-file value.

### D3: Mode is a `Select` with per-mode helper text
Three options from a `SpendingLimitMode` enum (`Off`, `Shadow`, `Enforce`), labels through i18n. A helper
paragraph under the select describes the selected mode. Selecting `enforce` also renders an inline warning
(`role="status"`, not a modal) that requests will be blocked once limits are exceeded.
*Alternatives:* segmented control (more visible, but no precedent in this page and poor fit for the
helper text); confirmation modal on `enforce` (blocks the edit flow, and Save is already an explicit step).
The helper text wording for `shadow` is provisional until Core confirms its semantics.

### D4: `defaultCostObject` is a text input validated only for non-empty
The trimmed value must be non-empty; the value is saved as typed, without a trimming rewrite. The tab
shows the field's invalid state and an inline `role="alert"` message. `SystemProperties` derives cost-object
validity from its current settings, using the displayed default when `spendingLimits` is absent, and
registers it with `SaveValidationContext` under `spendingLimits` for the page's lifetime. The page
re-registers validity after a context reset and removes the field when the page unmounts. Switching tabs
or opening the page with an invalid stored value therefore cannot bypass the existing Save validation.
The tab itself does not own a context registration that disappears on unmount.
Other existing validation, including the schedule's current behavior, remains unchanged by this fix.
*Alternative:* a pattern check. Rejected: Core documents no format, and a wrong guess would reject values
Core accepts. Core's 400 surfaces through the existing error notification.

### D5: Override note, not a file read
A static description under the tab title states that saving writes the value into the settings blob and
overrides Core's config file. This covers the upgrade trap without adding a Core read.

### D6: Model typing
`SpendingLimitMode` enum and `SpendingLimits` interface in `models/system-properties.ts`;
`GlobalSettings.spendingLimits?: SpendingLimits`. Defaults and the mode-to-i18n map live in the
component's `constants.ts`, per the constants/models split.

### D7: Accessibility and read-only
All controls get visible labels via `labelProps`; the cost-object error uses `invalid` plus an alert
message; the enforce warning is a status region separate from the select's label. `useIsReadOnlyAdmin`
disables both controls.

## Risks / Trade-offs

- [Panel shows `off` / `ORG` while Core enforces a file value] → D5 note; file read is a follow-up.
- [`shadow` helper text could misstate Core's behaviour] → keep wording generic, confirm with Core before
  merge.
- [Older Core rejects or drops the unknown field] → documented in the proposal impact; the tab is only
  useful against a Core that includes #2220. No client-side version gating.
- [A save from a page opened before Core upgrade omits nothing, since unknown fields round-trip through
  `cloneDeep`] → covered by the existing preservation requirement; a test asserts the body keeps
  `spendingLimits` when another tab is edited.

## Open Questions

- Exact meaning of `shadow` (assumed: evaluate and record, do not block).
- Whether Core trims or rejects a blank `defaultCostObject` — irrelevant to the client rule, relevant to copy.
