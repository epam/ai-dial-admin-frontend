## Context

Core's `Model` gained `provider`, `deprecationDate` and `endOfService` (ai-dial-core#2276). The platform model surface reads and writes Core's `models/platform/{name}` resource directly, so the resource is Core's `Model` in camelCase. The server layer has no field whitelist for model resources, so new fields round-trip once the type and form carry them.

The ui-kit `Calendar` in `CalendarMode.Date` takes and emits a `Date` and renders a localized label; it has no format prop. Core stores the dates as plain `YYYY-MM-DD` strings.

## Goals / Non-Goals

**Goals:**
- Edit the three fields on the platform model Properties tab and persist them unchanged.

**Non-Goals:**
- Listing columns, alias display, entity-model support, warnings and validation (see the proposal).

## Decisions

**camelCase, no conversion.** `DialModelResource` already uses camelCase for Core's `Deployment`/`Model` fields (`embeddingDimensions`, `tokenizerModel`). Core's snake_case is the `/openai/models` listing only, which this surface does not read. Rejected: snake_case fields, which would need a mapping layer for no gain.

**Stored value stays the string Core holds.** The form keeps the `YYYY-MM-DD` string on the resource and converts to a `Date` only at the `Calendar` boundary.

**`Calendar` plus two pure helpers, no wrapper component.** `parseIsoDate(value?: string): Date | null` builds a local-time `Date` from `YYYY-MM-DD` (`new Date(y, m - 1, d)`), returning `null` for an absent or malformed value. `formatIsoDate(date: Date): string` writes the local year, month and day, zero-padded. Local components, never `toISOString()` or `new Date('YYYY-MM-DD')` (UTC), so a date does not shift a day in a negative-offset timezone. The helpers live under `src/utils/models/` beside the other model utils, with a spec. Rejected: a wrapper component (extra layer for one conversion); extending the kit's Date mode to accept strings (needs a kit release and a version bump); the legacy `Common/DatePicker` (old control, still a `Date` conversion).

**Clearing a date.** The kit `Calendar` in date mode is a popover button, not a typeable input (only time mode is typeable, which is why `RateLimitSchedule` can be emptied by deleting text), and it exposes no clear control. Each date field therefore gets a small ui-kit icon button beside it, rendered only while a date is set. It carries `aria-label` from `ButtonsI18nKey.Clear` with the icon `aria-hidden`, is disabled for a read-only admin, and removes the key from the resource (`undefined`, so the written resource omits it). Rejected: extending the kit's Date mode (needs a kit release and a version bump); leaving values unclearable.

**A malformed stored date.** Core accepts any string, so a stored value may not parse. `parseIsoDate` returns `null` and the field shows its placeholder. The stored string is left untouched until the user picks a date, so merely opening the tab never rewrites it.

**Placement and layout.** Provider is an `Input` at the standard control width, placed right after the intro control in `Assets/Platform/Models/Properties.tsx`, like the toolset provider input. The two date fields share one row below it (wrapping on a narrow viewport). Each date field is 220px wide with a 40px-high `Calendar` field (`fieldClassName="h-10"`), and its clear button sits in a 40px-high box so it is vertically centered on the field, not on the label plus field. Each is `disabled` for a read-only admin.

**i18n.** `EntityFieldsI18nKey` gains `deprecationDate` and `endOfService`; `EntityPlaceholdersI18nKey` gains one shared `SelectDate`. The existing `EntityFieldsI18nKey.provider` label and `EntityPlaceholdersI18nKey.Provider` placeholder ("Enter provider", generic) are reused.

**Component split.** The date field with its clear button is `Assets/Platform/Models/LifecycleDateField.tsx`, one component used twice, so `Properties.tsx` stays wiring only.

## Risks / Trade-offs

- The clear button is an admin-side addition next to the kit control → accepted; if the kit later adds a clear affordance, the button can be dropped.
- Locale-formatted label (e.g. `Jun 30, 2027`) rather than `YYYY-MM-DD` → accepted; the stored value is unaffected.
- A malformed stored date reads as empty in the picker → accepted; it is preserved on save unless the user picks a new date.

## Migration Plan

None. The fields are optional and absent from every stored model.
