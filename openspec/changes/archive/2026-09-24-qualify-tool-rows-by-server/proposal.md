## Why

`execute_python` exists on four MCP servers, and the `Tools` tab folded all four into one row. The
row summed unrelated work under a name that reads like one thing, and the sub-label said "4 MCP
servers" — which names the problem rather than solving it. A tool name is not an identity; a tool on
a server is.

## What Changes

- The `Tools` tab groups by the MCP server as well as the tool name, so each row is one tool on one
  server and names that server under the tool.
- A row's id carries both group values, so two servers' same-named tools stay two rows wherever rows
  are matched by id — the previous window's figures among them.
- The tab's search matches the server as well as the tool: a row is a tool on a server, so typing a
  server name means the tools it serves.

## Impact

- Affected specs: `analytics/dashboards`
- Affected code: `Usage/constants.ts`, `Usage/queries.ts`, `Usage/utils/folds.ts`,
  `Usage/use-usage-dashboard-data.ts`, `Usage/use-breakdown-dialog-rows.ts`
- No new request and no new shape: the same tab request, grouped by one more column.
