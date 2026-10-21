## Why

Driving the three-field registration through the console (change
`2026-09-23-register-pipeline-before-declaring`) turned up three things, two of which that change caused
and one it exposed.

Registration now produces a pipeline that is deliberately unfinished, and the page where it is finished
is its own. The console leaves the operator on the listing instead, so every registration ends with the
operator hunting for the row they just made. The same page offers no way to delete what they registered:
the listing's row menu does, the detail page does not, so a pipeline registered by mistake has to be
disposed of from a different screen than the one it opened.

The third is older and unrelated to that change. The tables page labels the parent table with a raw i18n
key — `AnalyticsTables.SourceTable` is the only one of 131 keys in that group with no translation — and
its descriptions, both the table's own and each column's, are single lines that truncate with the rest in
a hover tooltip. A description is the one field on that page that is worth reading, and it is the one
field a reader has to hover to see.

## What Changes

1. **The source-table label reads `Source`.** The missing translation is added, which fixes the raw key
   in all four places that render it: the table detail page, the create-enrichment modal, the tables
   listing and the audit grid. The wording matches the pipeline pages, where the pair is already
   `Source` / `Target`.

2. **A description is read without hovering.** The table's own description in the page header and the
   `description` column of the column grid keep their full width and clamp to a short run of lines, with
   a **Show more** control that appears only when there is more to show. `Common/ExpandableText` already
   does exactly this — clamp to `lines`, reveal on demand — and is used this way in three other features.

3. **Creating a pipeline forwards to its page.** The modal closes, reports success, and navigates to the
   new pipeline, which is where the declaration is authored. **This reverses a line written two days ago**:
   the archived change said the console SHALL NOT navigate on its own, which described the console as it
   was when registration produced a finished pipeline. It no longer does.

4. **The pipeline detail page offers Delete.** A danger button in the header, guarded by full-admin
   rights and a confirmation naming the pipeline, following `TableDetailView` exactly — the same button,
   the same `DialConfirmationPopup`, the same copy structure. On success it returns to the listing,
   because the page it was opened from no longer exists.

5. **The scope section is named `Scope` and comes first.** "Read scope" named half of it — the target is
   written, not read — and the section sat below the trigger, whose group branch ranks rows by the
   source's columns. The author was being asked about a table the page had not established yet.

6. **Only deleting is drawn in danger.** Disable and Delete sat side by side, both outlined red, saying
   that stopping a pipeline and destroying it weigh the same. Disable becomes neutral, and Delete is
   placed before it so the routine control is the last in the row.

7. **An empty Inputs or Outputs section shows its add control and nothing else.** One of them printed
   column headings over an empty grid, the other an empty-state sentence, and neither said anything the
   add control did not. The headings return with the first row.

8. **The list popup's add control stops repeating its own icon.** `DraggableList` draws an `IconPlus` and
   the enum value list's label was `+ Value`, so the button carried two. The label becomes `Add value`,
   and the control itself becomes ghost — matching the add controls of every editor beside it, in the
   popup that both topics and enum values open.

9. **The scope is three controls at the top of the form, each able to open its table.** The accordion and
   its heading are gone: three fields, two of which the read-only facts named again a few centimetres
   above, do not earn a section. The duplicate pair leaves the facts, and the way to the table goes where
   the table is named — an `Open` beside each control, in a new tab, so the pipeline stays where it was.

10. **The runtime state is split by what a reader does with it.** Its measured values — last run, next
    run, lag, backlog — fold into the facts row and appear only when the service reports them; a heading
    over four short values was a section in name only. The three states an operator acts on — a failed
    run, a window held short by an input, an output a rebuild left behind — become alerts above the tab
    strip, so they are read wherever the reader is. `unclamped_reads` stops being presented at all: it
    reports why a window was *not* held, in six closed-dictionary reasons that are all the ordinary case.

11. **Captions stop restating the field beside them.** "Columns come from *X*" said what a pipeline
    reading one source cannot contradict, and "Stored as *Y*" repeated the column already chosen on the
    same row. What survives is what a field cannot say for itself: that its source is unresolved, and
    what an empty group-keys list falls back to.

12. **Fields outside an accordion follow the standard control width.** The cron preset, its expression and
    the filter stretched the full page while their neighbours did not, which read as three different
    kinds of field.

## Non-goals

- The listing's row menu, which already deletes a pipeline through `ACTION_COLUMN(rowActions)` with the
  same guard and confirmation. The spec records that it does; no work there.
- Any other truncated field. `DialEllipsisTooltip` stays where a value is a name or an identifier, whose
  full text is rarely the point — this is about descriptions.
- The tables page's own structure, sections and editors.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: the parent table's label; descriptions read without hovering.
- `analytics/pipelines`: creation forwards to the new pipeline's page; the detail page deletes; the scope
  is inline and opens its tables; the runtime state is split between the facts row and alerts above the
  tab strip.

## Impact

- `components/Analytics/Tables/ClampedDescription.tsx` (new: one line plus an inline control),
  `components/Analytics/Tables/TableDetailView.tsx` (header description, delete exemplar),
  `components/Analytics/Tables/TableProperties.tsx` (the description column),
  `locales/en.ts` (the one missing key).
- `components/Analytics/Pipelines/CreatePipelinePopup.tsx` and `Common/CreatePipelineShell.tsx` (the
  forward), `Common/PipelineDetailFrame.tsx` (the delete control),
  `constants/i18n.ts` + `locales/en.ts` (delete copy for pipelines).
- `components/Analytics/Pipelines/Enrich/EnrichSection.tsx` (section order),
  `Enrich/VariablesEditor.tsx` and `Enrich/OutputsEditor.tsx` (the empty sections),
  `components/Common/Lists/DraggableList.tsx` (the add control's appearance, shared with topics).
- `Pipelines/Common/BoundTableField.tsx` (new: a control and its `Open`),
  `Common/PipelineSharedFields.tsx` (the inline scope), `Common/PipelineReadOnlyFacts.tsx` (the measured
  runtime values, the pair removed), `Common/PipelineRuntimeAlerts.tsx` (new: the three alerts),
  `Common/PipelineDetailFrame.tsx` (where they render), `Common/PipelineStateSection.tsx` (deleted),
  `Common/CronField.tsx` (widths, and Custom derived from the expression),
  `Aggregate/AggregateSection.tsx` (scope before the schedule).
- `components/Common/Accordion/Accordion.tsx`: a section may carry a caption under its title, rendered
  beside the toggle rather than inside it, so the control keeps its own accessible name.
- No service change: `DELETE /v1/pipelines/{name}` is already called by the listing.
