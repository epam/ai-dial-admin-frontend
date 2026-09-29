## Why

The sort key's null-placement select offered bare "Default / First / Last". Its "Nulls:" prefix showed only
on the closed trigger, so the open list gave no hint of what the words referred to; the options had no
descriptions, "Default" never said what the default is, and the collapsed sort row dropped the setting
entirely. The labels were also hardcoded English. Reported as "unclear what Default/First/Last refer to".

The 2026-07-31 authoring-ergonomics change deliberately left these options alone as already reading as
words; this feedback shows they do not, once the list is open.

## What Changes

- The options become i18n descriptors like the direction select's: "Nulls: default", "Nulls first",
  "Nulls last", each with a hover description. The default's description states the engine behaviour
  (last when ascending, first when descending), verified against the analytics service, which emits no
  NULLS clause for the default.
- The separate "Nulls:" trigger prefix goes, since every label now names itself.
- A non-default placement joins the collapsed row summary (`model Descending · Nulls first`).

## Non-goals

- The serialized query is unchanged: the default still omits `nulls`.

## Impact

- Affected specs: `analytics/query-builder`
- Affected code: `constants/analytics/query-builder.ts`, `constants/i18n.ts`, `locales/en.ts`,
  `components/Analytics/QueryBuilder/Sort/SortKeys.tsx`
