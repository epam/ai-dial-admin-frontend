## Context

See proposal.md for why. The contract comes from the analytics service branch that ships with this change:
`QuerySchemaFieldDto` gains `projection_only` (`false` on every catalog-backed field, `true` only on computed
ones), and `dial_usage_log_payload` gains `request_body_full` and `request_body_rebuild`, both `sensitive` and
`heavy`.

Today one server-side read, `readHopBody`, serves every request-side tier of the hop inspector. It probes the
cached entity schema through `hopBodyFields`, which matches columns by their unqualified name and returns the
names the instance actually publishes; `bodyRowOf` strips the enrichment qualifier from the returned row. No
other screen reads `request_body`.

Field pickers withhold non-comparable fields by schema type in two separate places: `comparableFieldOptions` in
the Query Builder (maps only, and maps stay as function arguments), and `UNCOMPARABLE_TYPES` in the pipeline
filter row (object, array, map).

## Goals / Non-Goals

**Goals:**
- One decision point for which request column a hop is read from, made from the schema.
- One predicate for "projection-only", shared by every picker, added next to the existing type rules.

**Non-Goals:**
- Caching rebuilt bodies between tiers.
- Reconciling the existing type rules of the Query Builder and the pipeline editors with each other.

## Decisions

**1. The request column is resolved in `hopBodyFields`, not in each tier.** `hopBodyFields` resolves
`request_body_full` first and `request_body` second, and returns the chosen name plus the status column's name
when it is reported. `readHopBody` selects both, and `bodyRowOf` already strips the qualifier, so every tier
reads one decoded field. The row model keeps the decoded request under the name the tiers already read, with the
status as a separate optional field; the tiers therefore do not learn which column fed them. Alternative — teach
each tier to prefer the full column — rejected: six readers would carry the same fallback, and tier 1 and tier 2
could disagree about which body they numbered.

**2. `partial` is a flag on the request envelope and the raw body, not a `HopReadState`.** The body is
available and decodes; it is incomplete. A new read state would route the panel away from rendering messages,
which is what the spec forbids. The flag is derived once on the server from the status string through an enum
of known values; an unknown value maps to "not partial".

**3. The incomplete statement reuses the inspector's existing clamp-note pattern.** It sits where
`HopClampNote` sits and is associated with the content through `aria-describedby`, so it is read with the
request. No new Common component; the wording is a new key in the sessions-trace i18n group.

**4. One `isProjectionOnly(field)` predicate in the analytics schema utils.** The Query Builder carries it on the field option and drops a flagged option from every non-Select
position — comparable positions and function arguments — keeping a value already authored; SQL completions are
not clause-aware and stay unchanged; the pipeline editors apply it where they build source-field options, next to their
type rule. The existing type rules are left untouched. Alternative — fold the flag into each type rule —
rejected: the Query Builder keeps maps as function arguments while projection-only fields must not be, so the
rules are not the same rule.

**5. Sizes come from the decoded body.** `recordedBytes` keeps being measured on the text that was decoded,
which is now the rebuilt body. The transport line's `request_body_bytes` stays the stored figure; the two are
never compared.

## Risks / Trade-offs

- [Every tier re-reads the row, and in delta mode each re-read is a bounded rebuild] → accepted, same trade as
  the existing tiered read; opening one message is one more bounded read, not a page-wide projection.
- [The service ships without the frontend, or the reverse] → the schema decides the column, so either order
  degrades to today's behaviour; under whole storage `request_body_full` returns the stored body.
- [`recordedBytes` of a rebuilt request differs from the stored `request_body_bytes`] → accepted; the spec
  forbids comparing them, and each is labelled as what it measures.
- [A non-admin reaches neither column] → the request tab is withheld as today; no new access path.

## Migration Plan

Merge together with the analytics service release. Rollback of the service to whole storage needs no frontend
change: `request_body_full` keeps returning the stored body. Rollback of the service to a version without the
column returns the frontend to reading `request_body`.
