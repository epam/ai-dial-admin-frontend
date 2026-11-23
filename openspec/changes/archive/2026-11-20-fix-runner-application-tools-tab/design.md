## Context

`Tools` is shared by applications, toolsets, and MCP containers. For applications it currently decides whether to hide management using a matched `appRunner`, while the asset view resolves a runner asynchronously and the shared tab content matches it separately. Missing runner details can therefore enable the all-tools switch and cause it to write `mcp.allowedTools` onto a schema-based application. Core rejects any top-level `mcp` in that application's resource PUT.

Core derives the effective MCP allowlist from the resolved runner schema. `GET /v1/toolset/{id}/allowed-tools` resolves the application, follows upstream pages, and returns tool definitions filtered by that allowlist; an empty allowlist imposes no Core name filter. The current asset discovery action uses the unfiltered, single-page `/tools` endpoint. The regular Applications view currently uses the admin backend's `/applications/{name}/discovered-tools` and `/applications/{name}/call-tool` contracts. Try Out remains on the existing call path.

## Goals / Non-Goals

**Goals:**

- Show the complete effective discovered tool list for runner-backed applications, with search and existing Try Out behavior, without making application edits.
- Correctly identify a schema-backed application independently of asynchronous runner lookup, while preserving other consumers of `Tools`.

**Non-Goals:**

- Alter create, update, import, or export payloads or Core's allowlist semantics.
- Change direct-MCP applications, toolsets, containers, or their discovery and management behavior.
- Grant additional access or change Try Out permissions.

## Decisions

### Identify the mode from the application source

Derive a runner-backed-application mode using the schema ID/source discriminator appropriate to each application model, not `appRunner` availability. Pass or derive this mode in the existing application tab and shared Tools wiring. Hide all mutation and tool-type filtering controls in that mode, including warnings tied solely to their hidden switch, and ensure no tool-tab interaction calls the entity mutation handler. This avoids a transient editable state when runner lookup is delayed or fails. Retain the existing modes for toolsets, containers, and direct-MCP applications.

Alternative: hide controls only when `appRunner` is present. This preserves the current race and can allow an invalid edit during runner resolution.

### Fetch effective tools from Core

Add a narrowly scoped Core operation for the existing `GET /v1/toolset/{id}/allowed-tools` endpoint and use it only for runner-backed application discovery. Reuse the current resource-path encoding conventions: public applications use the `applications/` resource path, platform applications use their bare deployment name, and regular config applications use their deployment name. Do not repurpose the toolset discovery action. The endpoint returns full tool definitions and performs upstream pagination and effective allowlist filtering. Keep existing error notifications and loading/empty states; do not substitute an unfiltered list if discovery fails.

Alternative: fetch `/tools` and filter client-side using the selected runner. That endpoint returns one page and the frontend's runner object may be unresolved or differ from Core's effective schema; it can display unusable tools or omit later pages. The existing admin-backend discovery contract likewise does not establish effective Core filtering.

Discovery and Try Out address the persisted application, not unsaved runner or property edits. Preserve the existing saved-entity semantics and warning where applicable; never imply that the returned tools represent unsaved configuration. Keep Try Out's existing app-specific routing, error response and read-only restrictions.

### Reuse the list, not the container identity

Reuse the existing list and search presentation from the container-like read-only mode, but do not pass `isMcpToolset` for an application: that flag also selects container discovery and Try Out routes. Use the effective Core response directly instead of fabricating manual tool rows from a runner allowlist, so every displayed row has a discovered definition.

### Indicate pending runner searches

Keep the search input and its 300 ms debounce mounted while an entered term is pending. Show a results-area spinner and a polite status announcement until the settled term is applied, retaining the previous tool rows so their local state survives the search. Keep pending rows inaccessible with `inert`; do not show their count as the new result count. Discovery loading remains separate and the initial effective list appears as soon as it is available.

### Split shared tools responsibilities

Separate discovery effects and display/selection state into focused feature-local hooks, and render the toolbar and results through feature-local components. Preserve the existing application, toolset, and MCP container behavior, including saved-entity addressing, error notifications, management sentinels, search semantics, and Try Out routing.

## Risks / Trade-offs

- [Core deployment resolution and authorization differ from admin-backend discovery] → Preserve public, platform and config ID semantics; test the Core action's identity mapping, success and failure, and surface errors rather than fall back to unfiltered discovery.
- [The shared component can regress toolset or direct application editing] → Cover all three modes and assert unchanged controls and dispatch outside the new mode.
- [Runner details or unsaved edits are out of sync with the persisted deployment] → Base read-only gating on source identity; clearly retain persisted-data semantics and do not trust a partially resolved runner for filtering.
- [Invalid pre-existing schema-based payloads can still fail to save] → Payload normalization is explicitly outside this change; this UI fix prevents new mutations from its own controls only.

## Migration Plan

No data migration is required. Deploy the frontend change and revert it to roll back; existing persisted allowlists and application payloads are unchanged.

## Open Questions

None for this scope. Browser verification was offered and declined; automated unit tests remain required.
