## Context

`RateLimitSchedule.tsx` currently renders ui-kit `Input` and `Select` controls. `SystemProperties.tsx` owns the full settings blob and existing Save/Discard behavior; the schedule component reports full schedule validity through `SaveValidationContext`. Core's global-settings singleton (`v1/settings/platform/global`) accepts a timezone-relative time-of-day string matching `^([01][0-9]|2[0-3]):[0-5][0-9]$`, not a timestamp.

The original schedule design declined ui-kit 2.0 adoption. That historical constraint no longer applies: newer controls are used on this page and `Calendar` is already used by `Analytics/Common/BackfillSidebar/BackfillRangeField.tsx`.

Source checked in the user-provided `ai-dial-ui-kit` checkout: `Calendar.tsx`, `TimePickerPanel.tsx`, and `utils.ts`. The installed `0.16.0-dev.45` publication's npm `gitHead` is `0df14a4c18ecefb65aece0b0fe83b87692b5911a`; ui-kit picker introduction commit `e17aa72` is its ancestor. No package update is necessary.

A design is warranted despite the small scope: the kit keeps incomplete typed drafts internally and emits `onChange` only for complete times, creating a potential stale-value Save problem.

## Goals / Non-Goals

**Goals:**

- Visual selection of all 24 hours and 60 minutes using the existing design system.
- Canonical `HH:mm` persistence and safe handling of incomplete typing.
- Preserve defaults, validation, read-only access, Save/Discard, and all unrelated settings.
- Accessible field labeling and keyboard-operable selection.

**Non-Goals:**

- Changes to Core APIs, schedule types, timezone/day controls, or per-role rate limits.
- Native browser time overlays, custom pickers, new shared wrappers, vendor patches, or broad dependency upgrades.
- Viewer-timezone hints or converting the time to a Date/UTC timestamp.

## Decisions

### D1: Compose the existing Calendar directly in the schedule feature

Replace only the reset-time control with `Calendar` using `CalendarMode.Time`, the existing id and translated label/placeholder, the effective schedule's string value, and `disabled`/`invalid` state. `showTimePicker` is true by default; make the visual intent explicit if helpful. Leave `showTimezone` false: it names the viewer's timezone and would misrepresent the selected schedule timezone.

The clock opens hours and minutes listboxes. Selecting an hour preserves minutes and leaves the panel open; selecting minutes preserves the hour and closes it. Keep the kit's keyboard and focus handling rather than duplicating it.

Alternative: native `input type="time"` has browser/locale-dependent appearance. A custom Common picker would duplicate a kit control with no reuse justification.

### D2: Keep complete values controlled; synchronize incomplete drafts on blur

Adapt the callback to the kit's `CalendarValue` (`Date | string | null`) and consume strings in time mode. Do not introduce Date conversion. Preserve the existing full-object materialization callback.

The kit masks typed digits, clamps completed hours/minutes, and emits only complete `HH:mm` strings. Add a feature-owned input `onBlur` callback using `event.currentTarget.value`: if the visible draft differs from `effectiveSchedule.resetTime`, send it through the same schedule update callback. This makes a cleared/partial value explicit in page state so existing validation disables Save and renders an error after focus leaves the field. Unchanged focus/blur must not materialize an absent schedule.

Use the existing translated reset-time validation message as an adjacent caption/error, since Calendar does not expose Input's `error` prop. Use the existing label caption facility if suitable; otherwise render feature-owned accessible error text without new strings or vendor edits.

The critical integration case is clicking Save with an incomplete focused draft after another page edit: blur must invalidate the schedule before the update action can run. Prove this at page level, not solely with a callback spy. If actual event ordering fails that contract, revisit the local integration rather than changing shared save-context semantics or accepting stale persistence.

Alternative: ignoring incomplete drafts permits silently saving the previous time. Silently restoring the previous value on blur hides the failed edit. Tracking every keystroke in a new wrapper would duplicate the kit's internal draft/mask behavior.

### D3: Preserve validation as a defense for stored data

Keep `RESET_TIME_PATTERN` and `isRateLimitScheduleValid` for all three fields. A hand-edited malformed stored time must remain visible/invalid until corrected; selecting one segment can preserve an invalid other segment, so visual selection does not replace validation.

Retain UTC/Mon/00:00 display defaults without initial dirty state, full schedule materialization on actual edit, unchanged other settings during save, notifications, and Discard restoration. No new notification is needed for selecting a time or showing an inline validation error.

### D4: Test the owned integration, not the library exhaustively

Update `tests/RateLimitSchedule.spec.tsx` to exercise the real lightweight Calendar through roles/names: one visual selection path, canonical callback payloads and boundaries, typing/blur validity, defaults/no-op opening or blur, invalid stored values, and disabled input/clock.

Add narrowly targeted `tests/SystemProperties.spec.tsx` cases for saving a selected time with other settings preserved, Discard restoring the stored time, and a Save attempt with an incomplete focused draft causing no update. Reuse centralized mocks; add any required infrastructure mock to `test-setup.tsx`, not the specs. Do not retest every kit keyboard branch, but keep a representative keyboard selection path.

The user declined an automated browser-verification task. Unit/integration tests and final quality gates are still required.

## Risks / Trade-offs

- [Incomplete drafts are private until blur] → Explicit blur synchronization and a page-level Save-attempt regression test; no promise of per-keystroke error feedback.
- [Invalid stored segment survives picking the other segment] → Retain full schedule validation and tests proving correction is required.
- [Kit popup labels such as Choose time/Hours/Minutes are currently English literals] → Preserve existing kit behavior; translations inside vendor internals are upstream scope, not an admin-local patch.
- [Calendar owns popup/focus behavior] → Use its real component in representative interaction tests; report vendor gaps upstream rather than modifying installed output.
- [Existing unrelated locale edit] → Preserve the user's current `src/locales/en.ts` modification; reuse existing keys rather than overwriting it.

## Migration Plan

Single frontend PR with no dependency or data migration. Existing schedule strings and omitted schedules remain compatible with Core. Rollback restores the previous input without changing stored data.

## Open Questions

None requiring a scope decision. The blur-to-Save event-order contract is an implementation verification gate, not an accepted limitation.
