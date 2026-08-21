## 1. Models, constants and type derivation

- [x] 1.1 In `src/models/analytics/conversations-trace.ts`, replace `ConversationProjectableFields`'
      two-bucket shape with `cheapSource`, `heavySource`, `enrichment` and the surviving
      `requiredEnrichment`; add the model for a `(origin, tag)` column group.
- [x] 1.2 In `src/constants/analytics/conversations-trace.ts`, restore `NON_SCALAR_FIELD_TYPES`,
      `DATE_FIELD_TYPES`, `NUMERIC_FIELD_TYPES` and `ANALYTICS_FIELD_QUERY_VALUE_TYPE` from
      `5a968d9f^`, keeping the `constants.ts`/`models.ts` split intact.
- [x] 1.3 Add the tag → i18n key map to the same constants file, with an entry per tag the dev entity
      reports (`identity`, `principal`, `response`, `token-usage`, `cost`, `performance`,
      `deployment`, `insight`, `provenance`). The `provenance` entry must label the group as the
      evaluator's run, never as the word "Provenance".
- [x] 1.4 Add the corresponding `ConversationsTraceI18nKey` entries and `en` strings for the tag group
      labels.

## 2. Schema-derived column catalog

- [x] 2.1 Restore `offerableSchemaFields`, `buildConversationColumnCatalog`, `catalogValueTypes`,
      `catalogSortableFields` and `catalogFilterableFields` in
      `src/utils/analytics/conversation-column-catalog.ts` from `5a968d9f^`, dropping `heavy` from the
      offer-exclusion test — `heavy` now governs projection only.
- [x] 2.2 Add the header derivation: `display_name`, else the field `name` with its enrichment prefix
      stripped, separators replaced by spaces and the first word capitalized.
- [x] 2.3 Bind `headerTooltip` to the field's `description` verbatim, with no tooltip where the schema
      reports none.
- [x] 2.4 Add the comment at the derivation site stating why no body column can be offered:
      `request_body`/`response_body` are columns of `dial_usage_log`, and the listing queries
      `conversations`, whose schema reports no body field. No filter — a filter there would read as
      load-bearing.
- [x] 2.5 In `src/constants/grid-columns/grid-columns.tsx`, have `CONVERSATIONS_TRACE_COLUMNS` compose
      the curated columns with the catalog, leaving every curated column's designed header, renderer
      and default visibility untouched.

## 3. Grouping on the (origin, tag) pair

- [x] 3.1 Add the grouping helper to `conversation-column-catalog.ts`: one group per `(origin, tag)`
      pair the schema reports, ordered so curated columns keep their relative order within a group,
      with the raw tag as the label fallback.
- [x] 3.2 Rewrite `CONVERSATIONS_TRACE_COLUMN_GROUPS` to build from those pairs, passing the tag label
      as `ProvenanceHeaderGroup`'s `label` and the origin as its `provenance` — no change to that
      component's props or to `PROVENANCE_TEXT_CLASS`.
- [x] 3.3 Keep every column attributed to exactly one group, and keep Rating in its own feedback group
      outside the derived set.
- [x] 3.4 Confirm no edit is needed under `components/Grid/**`: the groups stay one level deep so
      `toColumnLeaves` keeps producing the panel's per-column caption from `groupName`.

## 4. Three-bucket projection

- [x] 4.1 Rewrite `projectableSchemaFields` to return the three buckets, classifying on the qualified
      name for an enrichment field and on `field.heavy` for a heavy source field.
- [x] 4.2 In `use-conversations.ts`, project `cheapSource` unconditionally and add visible
      `heavySource` fields to the visibility-gated list alongside the enrichment ones.
- [x] 4.3 Extend the `columnVisible` purge so revealing a heavy source column purges the infinite
      cache, as revealing an enrichment column already does.
- [x] 4.4 Derive `modelScope`'s sortable, filterable and value-type maps from the catalog
      (`catalogSortableFields`, `catalogFilterableFields`, `catalogValueTypes`) instead of the curated
      constants, keeping the structural gate that a predicate can only name a field a rendered column
      reads.

## 5. Unit tests

- [x] 5.1 `src/utils/analytics/tests/conversation-column-catalog.spec.ts` — derivation from a schema
      fixture built from the live dev entity: offered set, the three exclusions, `display_name` present
      and absent, humanized fallback with and without an enrichment prefix, description as tooltip,
      type → filter/sort mapping, and a scalar `heavy` field offered but bucketed as heavy.
- [x] 5.2 Same spec — grouping: one group per `(origin, tag)` pair, a rollup field and an enrichment
      field sharing a tag kept apart, an unlabelled tag falling back to the raw tag, every column
      attributed exactly once, Rating outside the derived set.
- [x] 5.3 Same spec — three-bucket `projectableSchemaFields`, including the identity column's
      enrichment field staying in `requiredEnrichment`.
- [x] 5.4 `src/constants/grid-columns/tests/conversations-trace-columns.spec.ts` — the default visible
      set is exactly today's six, every derived column ships hidden, the visible order is Conversation,
      Activity, Project, User, Cost, Rating, no column is headed "Model" outside the evaluator-run
      group, summary is offered hidden, sentiment and resolution status are offered as string columns,
      no body column is offered, and a failed schema fetch (`[]`) yields the curated columns only.
- [x] 5.5 `src/components/Analytics/ConversationsTrace/tests/ConversationsList.spec.tsx` — a stored
      column choice naming only the previously shipped columns leaves every new column hidden.
- [x] 5.6 Extend the existing `use-conversations` coverage: revealing a heavy source column purges and
      re-requests with that field named; revealing a cheap source column does neither.
- [x] 5.7 Update the specs that assert the ten-column set and the three origin groups
      (`ConversationsTraceView.spec.tsx`, `conversations-trace-columns.spec.ts`,
      `conversation-column-catalog.spec.ts`) to the restored behaviour.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format` and `npm run test` from the repo root and resolve
      everything they report.

No browser-verification task is included. This change has browser-observable acceptance criteria, so
the question was put to the user, who chose unit tests only.
