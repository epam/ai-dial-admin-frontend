## Why

The runner's group listing now pages by cursor, orders newest or oldest first, reports the pipeline's group count,
and accepts a `/` in a requeue key as `%2F`. The Groups tab still reads one window of 500 groups, oldest first, and
tells the operator that newer groups are missing — the case it exists to explain.

## What Changes

- The grid reads the listing **page by page**, 100 at a time, and reads the next page when it is scrolled near its
  end. No "load more" control.
- The **Last activity** header becomes the sort control, newest first by default; switching it restarts the walk.
- The tab states the pipeline's **total** group count from the first page.
- The window-full note goes.
- **Queue evaluation** is held back, with its reason, for a key the runner cannot be addressed by (the empty key,
  dot segments, `//`, `%`, `;`, `\`, line breaks). A key with `/` is now queued normally.
- Search by key and the state filter stay client-side over the loaded pages, and say so while pages remain.

## Non-goals

- Server-side search and state filter. Both are requested from the runner team; this change leaves the client-side
  ones in place until the contract lands.
- Sorting by any other column: the runner orders by activity only.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/pipelines`: the Groups grid pages, sorts and counts; the requeue control holds back unaddressable keys;
  the tab-presence requirement no longer describes the listing as one cursorless window.

## Impact

- `src/server/analytics/analytics-runner-api.ts` and `src/app/[lang]/pipelines/actions.ts` — `getGroups` takes
  `order` and `cursor` and returns the page envelope.
- `src/models/analytics/pipeline-groups.ts`, `src/constants/analytics/pipeline-groups.ts` — page model, order enum,
  page size.
- `Groups/use-pipeline-groups.ts`, `GroupsGrid.tsx`, `PipelineGroups.tsx`, `groups.ts` — paging, sort header, total,
  addressable-key predicate.
- The server-side probe keeps `limit=1` and reads the first page's `groups`.
