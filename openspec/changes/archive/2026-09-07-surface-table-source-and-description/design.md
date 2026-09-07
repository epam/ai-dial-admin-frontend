## Context

See proposal.md — Why. Two facts shape the approach:

- `source_table` is already on `AnalyticsTable` and is populated by both the list and the single-get
  response (`TableMapper.toListItemDto` / `toDto` in the data-access service pass
  `entity.getSourceTable()` in both), so nothing needs fetching. `grain` is the opposite: the list DTO
  sends `null` for it, which is why the grain key stays a detail-view value.
- The detail header is one flex row holding the title column and the action column. Neither side
  declares `shrink-0`, so the two compete for width — the mechanism behind both complaints in the
  same header.

## Goals / Non-Goals

**Goals:**

- Read `source_table` where it already arrives, with no new request, model field, or i18n key.
- Make the header's width negotiation explicit rather than emergent.

**Non-Goals:**

- Reworking the schema-metadata summary's own layout (it stays a wrapped row of `LabelledText`).
- Touching `DraftSchemaEditor`. The source table is not a draft input — it is fixed at create — so it
  belongs in the header summary, not in the editor's fields.

## Decisions

**The description gets its own row and keeps its single ellipsed line.** The header becomes a column —
row one is title + badges + actions, row two is the description — so the fix is the row, not the
rendering. `DialEllipsisTooltip` stays: it truncates only when the text genuinely does not fit,
exposes the full value as the reference node's `aria-label` as well as in the tooltip, and therefore
already satisfies the a11y rule on truncated content. What changes is how much it can show — the
full header width instead of whatever the four action buttons leave over, which at 1920px is roughly
two and a half times the text.

Two richer treatments were built and rejected against the running app before settling here: full-width
wrapped text with no clamp (readable in principle, but ~200 characters a line on a wide monitor) and
a half-width two-line clamp via `Common/ExpandableText` (a readable measure, but the disclosure
control and the variable-height header cost more than the extra line was worth). One line that owns
its row keeps the header a fixed height, which is what the summary row and the grid below it want.

**The action container gets `shrink-0`.** That is what keeps button labels on one line; the title's
`min-w-0` + `truncate` already absorbs the remaining pressure. Without it, a longer description would
still reflow the buttons even on its own row, because the title row and the actions share row one.

**The source table renders as a `LabelledText` in the existing summary row, and for an enrichment it
renders at any status.** The summary is otherwise `ACTIVE`-only, because a draft's key/partition
fields live in the schema-definition surface as editable inputs. The source table has no such input —
it is immutable after create — so gating it on `ACTIVE` would hide it exactly where a reader defining
a draft enrichment's schema needs it most.

**The catalog grid gets a plain `source_table` field column, placed after Type.** It mirrors the
pipelines catalog's Target column (`PipelinesView`), and AG Grid's default cell tooltip already
exposes an over-long value. Type then source table reads as "what kind of table, and of what" before
the description.

## Risks / Trade-offs

- **A long description is still only readable via the tooltip.** The stored value is unbounded
  (neither the admin UI nor the data-access service caps a table's `description` —
  `ANALYTICS_DESCRIPTION_MAX_LENGTH` guards column metadata, not the table's), so one line shows a
  prefix of a very long one. → Accepted: the full value is in the tooltip and in the `aria-label`,
  the header keeps a fixed height, and the catalog grid exposes the same value in its own cell
  tooltip.
- **One more catalog column narrows the Description column.** → Description keeps the widest flex of
  the set (`flex: 3`) and the grid's columns stay user-resizable with state persisted per grid.
