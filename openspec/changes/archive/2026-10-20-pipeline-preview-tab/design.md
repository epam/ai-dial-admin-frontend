## Context

The detail page's frame (`Pipelines/Common/PipelineDetailFrame.tsx`) already owns the tab strip, the
full-admin and `analyticsEnabled` gates, and the draft the Properties fields and the JSON document share; the
Runtime, Groups and Audit tabs are siblings it switches between. Server actions live in
`app/[lang]/pipelines/actions.ts` and delegate to API classes under `server/analytics/`. See proposal.md for
motivation.

The ADAS contract at `development` (2026-10-14), `POST /v1/pipelines/{name}/preview`, is one shape for both
kinds, `NON_NULL`: `statement?`, `columns[]` (`name`, `role`, `type`, `target_type?`, `max_bytes?`), `rows`,
`total_rows?`, `group_key?`, `notes[]` (`code`, `severity`, `subject?`, `message`). The body is optional and
takes `group_key`, `from`, `to`; an aggregate refuses any body. The endpoint requires `REGISTRY_ADMIN`.
Failures: 422 `pipeline_validation_failed` and `pipeline_preview_budget_exceeded`; 403
`sensitive_column_not_entitled`, `row_policy_confined`, `pipeline_access_denied`, `forbidden`; 404
`unknown_pipeline`; 409; 503 `clickhouse_unavailable`.

## Goals / Non-Goals

**Goals:**
- A Preview tab that follows the siblings' shape: a feature folder, a hook that owns the request, and a frame
  that only decides when the tab shows.
- One rendering path for all four pipeline kinds, driven by the response's `columns`, not by kind switches.

**Non-Goals:**
- Sending a body. The tab never passes `group_key`, `from`, `to` or `cursor`.
- Supporting an ADAS older than the unified contract.

## Decisions

**The request runs through a server action that passes the error envelope through.** `previewPipeline(name)` in
`pipelines/actions.ts` calls a new method on the analytics API class and returns the service's error `code`
and message, as `getPipelineRuntimeView` does, instead of flattening it to `errorMessage`. The tab's states
turn on the code. Alternative: parse the code out of the message text; rejected, the message is for people.

**The preview types are an enum-and-interface pair in `models/analytics/pipeline-preview.ts`.** `PreviewNoteCode`,
`PreviewNoteSeverity` and `PreviewColumnRole` are enums, as the code standards require for value sets, and
mirror the service's closed sets. An unknown code deserialises to a string, not a crash: the note switch has a
default branch that shows the message under a generic title, so a code added upstream is shown, not lost.

**One hook, `usePipelinePreview`, owns the run.** It holds the last success, the last failure, an in-flight
flag, and the pipeline generation at the time of the run. The last success survives a failure, which is what
keeps a failed run from wiping a good result, and survives a tab switch because the frame keeps the hook
mounted. It never runs on mount. Alternative: auto-run on first open; rejected by the design, since the read can
take up to 120 s and 2 GB and the tab must not start one by being looked at.

**The grid is built from `columns`, not from the declaration.** The service returns role, sampled type, target
type and byte size per column, so no kind needs its own column builder. The header is a custom header
component showing name, role and type line. Rows are `Record<string, unknown>` keyed by column name; the cell
renderer shows `NULL` for a null. Follows the grid conventions in `components.md` §11, and the header is
labelled for AG Grid accessibility as `a11y.md` requires.

**The notes block is a switch on code in one place.** A `notes.ts` module maps each code to an i18n title and
severity-driven banner variant; sorting (warnings first, stable) lives there too. The success line is a pure
function of `(notes, isEnabled, kind)`.

**Empty-state cause comes from the declaration, not a second code.** `no_matching_rows` covers both an empty
input and a filter that excludes everything. The saved declaration says whether a filter exists, so the
console picks `No data yet` or `No matching rows` from that; the service's note decides only that the sample
is empty. Alternative: ask ADAS for a second code; rejected, the information is already on the page.

**The Statement is formatted with the existing formatter and copied raw.** `QueryBuilder/utils/sql-format.ts`
already wraps `sql-formatter` for the query viewer; the section reuses it for display and keeps the raw
string for `Copy SQL`. The section is built with the same accordion the Properties sections use, so the two
read alike; that accordion exposes no `aria-expanded`, a gap the Properties tab shares and this change does
not widen.

**Outputs for LLM are read from the saved declaration.** The service returns no echo of the declaration, so the
list of outputs and their descriptions comes from the `Pipeline` the frame already holds. It reads the saved
copy, never the draft, which keeps it consistent with what the preview ran on. Which outputs the model is told
nothing about comes from the service's `output_without_description` notes, not from the declaration: an
output's description defaults to its target column's, which the declaration does not hold.

**Staleness is a comparison of two numbers.** The hook stores `pipeline.generation` when it issues a run; the
frame passes the current generation; a difference shows the stale banner. The response carries no generation,
so this is the console's own record, not the service's.

**The tab never saves.** An unsaved edit gets a banner and a run control labelled for the saved version, and nothing
else: the page's own `Save` and `Discard` stay above the strip. A control on the tab that saved the page's edits
would be a change made from a place that does not look like it makes changes. Alternative: reuse the confirm-on-
leave modal the application Parameters tab shows; rejected here, since it would make every tab switch with an
edit a decision, against the page's rule that an edit survives a tab switch.

**"Open …" actions switch to Properties and scroll to a section id.** The frame exposes one callback taking a
section key (`GroupKeys`, `Inputs`, `MemberSelection`, `RequestTemplate`); it sets the tab and, after the
Properties content has mounted, focuses the section's heading. The draft is untouched, so a pending edit
survives.

**Access states are a separate branch, not a failure banner.** For the 403 family the tab renders an
explanation with no run control, matching the contract's note that nothing on the page can fix it. The
`forbidden` case is the same branch, with no column named.

**Dropped from the mock by decision.** The run timestamp and the Timeout/Memory/Ingest-lag chips are not
rendered: the service returns none of them, and a client clock would present a time the service never
asserted.

## Risks / Trade-offs

- [The contract was read from the repository and one live aggregate response, not from every kind] → the
  types match that response; an SQL, row-grain and group sample are checked when their tabs are first
  rendered against a live pipeline, and a stand older than the contract is reported, not worked around.
- [Array and map values arrive as real JSON arrays and objects, not text, until the 2 KB cap turns an
  oversized one into its cut JSON text] → the cell renderer shows a non-string value as compact JSON, so
  both arrive in one form on screen.
- [The 2 KB cap cuts a value; the grid shows the cut text] → the caption says values are capped, the note
  explains it, and nothing re-expands a value, so the tab never claims a full value it does not have.
- [A rerun may move a group-trigger preview to another group] → the chip states the previous key, so a change
  between two runs is visible instead of looking like the data changed.
- [The tab is only for full admins, so a caller with read access to the pipeline cannot dry-run it] → matches
  the endpoint's privilege; relaxing it is the service's decision.

## Open Questions

- Whether `values_truncated` carries the capped column names in `subject`, as the service's tool
  documentation says it names them. Nothing live has shown the note yet; the grid marks no column until it
  does, and a mark is a later change that alters no spec, approach or task.
