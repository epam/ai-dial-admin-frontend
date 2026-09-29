## Why

Switching to the Builder translates and, if needed, confirms edited SQL — but only when the switch starts
in the SQL view. Two paths leave unhydrated SQL in the buffer while another view is active:

- running an AI message whose SQL the builder cannot represent puts that SQL in the buffer and runs it,
  leaving the builder on its earlier query;
- leaving edited SQL for the AI view keeps the edit in the buffer untranslated.

Selecting the Builder from the AI view then showed the older query, with no prompt, next to a result it
did not produce — and running from the Builder would execute that older query.

## What Changes

- `onChangeView` guards on the buffer (`sqlEdited`) instead of on the SQL view being active, so both paths
  go through `leaveSqlBuffer`: translate, hydrate silently when representable, confirm otherwise.
- The view switcher is disabled while an AI message's query loads, so its SQL cannot land in the buffer
  under a view that never showed it.

## Non-goals

- The confirmation itself, its wording, and what confirming discards are unchanged.

## Impact

- Affected specs: `analytics/query-builder`
- Affected code: `components/Analytics/QueryBuilder/QueryBuilder.tsx`
