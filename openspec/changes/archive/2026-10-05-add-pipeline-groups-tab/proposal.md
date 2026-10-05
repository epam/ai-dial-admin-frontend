## Why

A group-trigger pipeline evaluates whole groups (all rows sharing its `group_by` key), and today the console
says only how many groups are pending, ready, waiting or blocked. An operator who asks "why has this group not
been evaluated?" — or who needs one group evaluated now — has no answer short of database access and no lever
short of pausing the whole pipeline. The runner now serves both: a per-group state listing and a per-group
re-drive.

## What Changes

- A **Groups** tab on the pipeline detail view, between `Runtime` and `Audit`, offered only to a full admin, only
  for a group-trigger pipeline, and only when the runner holds at least one group for it. Whether it holds any is
  decided on the server while the page loads and passed down as a flag, so the strip never shifts after render.
- A **readiness summary** at the top of the tab, generated from the pipeline's own `ready_when`: one list of the
  triggers that make a group with new rows ready, and one list of the limits that hold it back. A pipeline that
  declares no `idle` shows `Idle (default)`, because the runner applies its own default window it does not report.
- A **groups grid** — group key, state, last activity, last evaluated, evaluations today, and an action — with a
  search by key and a filter by state, loaded in one read of up to 500 groups. No row count is shown.
- A **state per group** — `Waiting`, `Ready`, `At cap`, `Up to date` — derived by the console from the facts the
  runner returns against the pipeline's declaration, each explained by a tooltip that lists every declared
  condition with the group's own value against its threshold. `At cap` is highlighted in the evaluations cell.
- A **Queue evaluation** action per row, offered on `Waiting` and `Up to date`, disabled with its reason on
  `At cap`, and absent on `Ready`. It opens a confirmation dialog that states what will happen for that state and
  any warning that applies, then asks the runner to evaluate the group; the outcome is announced and the grid is
  read again.

- **Minor, Failures card:** an empty path no longer offers a separate "Show all paths" button. The path select
  above the message is the way back, and a second control for the same choice cluttered a non-default view.

## Non-goals

- Paging past the first 500 groups. The runner's listing takes a `limit` only and always starts from the oldest
  activity; going further needs a cursor on the runner side, which is a separate request to that service.
- A per-group detail panel. Everything it would show is either in the grid or in the state tooltip.
- Showing group members, labels, or the raw `group_version` / `computed_version` numbers.
- Bulk evaluation of several groups at once.
- Reproducing the runner's depth ceiling, queue position or configured default idle value — none is exposed.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/pipelines`: the detail view gains a fourth tab and its conditions; new requirements for the readiness
  summary, the groups grid, the per-group state and its explanation, and the per-group evaluation action; the
  runner-service requirement gains the two group endpoints.

## Impact

- **Runner API** (`src/server/analytics/analytics-runner-api.ts`): `GET /v1/pipelines/{name}/groups?limit=` and
  `POST /v1/pipelines/{name}/groups/{key}/requeue`, plus server actions in `src/app/[lang]/pipelines/actions.ts`.
- **Detail page** (`src/app/[lang]/pipelines/[name]/page.tsx`): one extra server-side runner read for group
  pipelines, passed to `PipelineDetailFrame` as a flag. This is the first runner read the page makes on the server;
  every other runner read stays on the client.
- **Tab strip** (`Common/PipelineDetailFrame.tsx`, `src/utils/tabs/utils.ts`): new `EntityViewTab.Groups` and tab
  label.
- **New components** under `src/components/Analytics/Pipelines/Groups/`; models in `src/models/analytics/`,
  constants in `src/constants/analytics/`, i18n keys in `AnalyticsPipelinesI18nKey` and `src/locales/en.ts`.
- **Shared components**: none modified. The existing Runtime-tab group counts stay as they are.
- **Runner dependency**: reads the runner's documented group-state contract; no runner change is required.
