## Context

See `proposal.md` for motivation. What shapes the approach:

- The transform editor (`Enrich/TransformSection.tsx`) presents `model` as a plain text field and never
  presents `preset`; `TransformPreset` has one member. `buildTransformDto` carries every draft member through
  and strips the llm-only set for a `sql` transform.
- Output rows (`Enrich/outputs.ts`, `OutputsEditor.tsx`) hold one refinement selection, `Values` or
  `Jsonata`, and keep the unselected member on the row.
- `extractPlaceholders` mirrors the service's former pattern, which had no suffix.
- The Sessions source tab is the precedent for an analytics-stored instance setting on System Properties:
  an API class under `src/server/analytics/`, actions in `system-properties/actions.ts`, a hook that loads on
  first activation, and a tab that swaps the page header's Save and Discard.
- The service validates the pair at enable only and checks nothing against DIAL Core.
- Application route paths in DIAL Core may be patterns; the service accepts a literal path only.

## Goals / Non-Goals

**Goals:**

- One implementation of the pair's validation and of the deployment and route controls, used by both the
  allowlist tab and the transform editor.
- No allowlist request from a pipeline page that does not use the route preset, and no listing request for
  a `sql` transform.

**Non-Goals:**

- Reproducing the service's arm gate. The hint compares a pair with a list; everything else stays the
  service's refusal.
- A generic "instance settings" abstraction over Sessions source and the allowlist. Two settings with
  different shapes do not justify one.

## Decisions

### `source` is a third member on the output row, not a reuse of `jsonata`

`OutputRow` gains `source` beside `jsonata`. The draft's output keeps both, and the request builder writes
the one the preset admits: `source` under `dial_app_route`, `jsonata` otherwise. Keeping both on the draft is
what lets a preset change back restore the expression, since the rows are re-seeded from the draft. `OutputRefinementKind` keeps
its two members; only the label and the written member depend on the preset.

*Alternative: one row field, written under the name the preset dictates.* It would send a chat-completion
`jsonata` expression as a route `source` after a preset change. The two are evaluated against different
documents (one model field versus the whole response body), so a carried expression would be silently wrong
rather than refused.

`toOutputSpec` takes the preset and drops the member it does not admit, so an expression typed under one
preset is never sent under the other.

### The preset is presented as `chat_completion` without being written

An absent `preset` reads as the default in the selection, and `buildTransformDto` leaves it absent unless the
author changes it. Writing the default on every save would rewrite stored declarations nobody edited.

`route` joins the llm-only member list, and is additionally deleted from the DTO whenever the preset is not
`dial_app_route`. The draft keeps it, which is what restores it on a change back.

### The placeholder pattern follows the service's new one

`extractPlaceholders` adopts the service's pattern, name plus an optional `:suffix`, and still returns names
only. The console does not validate the suffix or malformed tokens: the service refuses both at enable with a
message that names the token, and a second copy of that grammar would drift.

### One pair module, shared by the tab and the editor

Pair validation (deployment rule, route grammar, duplicates, cap) is a pure util under
`src/utils/analytics/enrichment-routes.ts`, which also owns the limits and the grammar pattern. The files are
named `enrichment-routes` because `src/utils/entities/app-routes.ts` already means an application's own
route entities.
The deployment and route controls are one feature component under
`src/components/Analytics/Common/`, built on `Common/AutocompleteInput` unchanged: it already treats typed
text as the value and suggestions as optional.

*Alternative: `Select` with a stranded option, as the transform type uses.* It cannot hold a value the user
types, and a pattern route or a not-yet-existing application has to be typed.

### Suggestions come from the applications listing, read once and on demand

A hook reads the existing applications listing through a server action and derives two maps: deployment
names, and route paths by deployment. It runs when the allowlist tab is first opened, or for any `llm`
transform. A failed read yields no suggestions and no notification.

Under `chat_completion` the Model field is the same `AutocompleteInput`, fed by the models listing (read
by a second hook only while that preset is shown) followed by the application names, de-duplicated. Both
kinds serve chat completions, and the field held either as free text before.

The admin backend's application DTO declares `routes`. The listing is assumed to return it; an entry without
`routes` yields an empty route suggestion list, which degrades to free text rather than failing.

Route paths are offered as stored, with a leading `/` stripped so a literal path is valid as picked. A
pattern path is offered too, since it tells the author what the application serves, and the field's
validation marks it until it is edited into a literal path.

*Alternative: read one application when it is picked.* It needs the entity read's etag handling for a value
used only as a hint, and a second round trip per row.

### The allowlist hint reads the setting through its own action and stays silent on failure

The transform editor reads the allowlist with the System Properties read action; a second action wrapping
the same call would add nothing.
The hook returns one of three states: listed pairs, no stored list, or unknown. Only the first two produce a
hint; a refused or failed read is unknown and renders nothing. This is the fallback for an author without
`SETTINGS_READ`: the service's 422 at enable, already reported by the existing action-failure path.

The hint renders in a `role="status"` region beside the route field, links to the System Properties route,
and names the tab in its text. System Properties holds its active tab in local state, so there is no address
to link to; adding one is outside this change.

### The tab mirrors Sessions source, without sharing its hook

`EnrichmentRoutesApi` (`getRoutes` mapping 404 to "not stored", `putRoutes`), two actions, a
`useEnrichmentRoutes` hook
with the same load-on-first-activation and saved-versus-current shape, and an `EnrichmentRoutes` tab component.
`SystemProperties.tsx` already branches Save, Discard and `isChanged` on the active tab; the allowlist adds a
third branch. That branching is replaced by a per-tab lookup so a fourth independent store does not add a
fourth ternary arm.

Blank rows are dropped before the write and ignored by validation, so adding a row does not disable Save
until something is typed into it.

## Risks / Trade-offs

- [The console ships before the service build] → The preset selection would offer a value an older service
  refuses, and the tab would read as an empty list that cannot be saved. Both fail with the service's own
  message; the change is merged after the service PR, and nothing is hidden behind a new flag.
- [A pattern path picked from suggestions is invalid as a route] → The field marks it and states the rule;
  in the tab it also disables Save, so it cannot be stored by accident.
- [The hint goes stale if the allowlist changes while the editor is open] → It is guidance; the service's
  refusal at enable is authoritative, and the hint is re-read on the next page load.
- [The listings are large on a big instance] → Each is read once per page visit, and only for an `llm`
  transform or the open tab.
- [Two JSONata fields with different evaluation contexts confuse authors] → The label and the caption under
  the route field state what `source` reads from.

## Migration Plan

No data migration. Deploy after the analytics service build that carries the preset and the setting.
Rollback is a revert: stored route pipelines stay valid on the service and remain editable through the
pipeline JSON editor, which carries unknown members through.
