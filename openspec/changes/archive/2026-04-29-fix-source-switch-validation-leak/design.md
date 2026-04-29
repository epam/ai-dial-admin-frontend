## Context

`SaveValidationContext` (`apps/ai-dial-admin/src/context/SaveValidationContext.tsx`) holds a `Map<string, boolean>` of field validations. Submit-button enablement is derived as `Array.from(map.values()).every(v => v)`. Sub-components opt into validation by dispatching `ValidationActionType.SetField`; the context already provides a matching `ValidationActionType.RemoveField` action that drops the entry from the map entirely.

The bug from issue #3027 occurs because two leaf components — `McpServerNameField` and `HFModelNameField` — register their validation field in a `useEffect` but never clean up. When their parent (`McpRegistry` for the toolset case, the source-type branch in `ContainerSource.tsx` for the container case) is unmounted by a source-type switch, the validation entry survives at its last value (often `false`, because the user moved away before filling it in). All subsequent renders compute `isValid = false`, regardless of what the user does in the new source-type branch.

A precedent for the cleanup pattern already exists at `apps/ai-dial-admin/src/components/SourceField/Application/AppRunners.tsx:67-70`, which returns a cleanup from its validation effect. That precedent uses `SetField(true)` on unmount; we will use `RemoveField` instead because it's strictly more honest — the field shouldn't exist when its component is gone.

A secondary hygiene problem: `SourceField.onChangeSource` builds the new source object as `{ ...entity.source, $type: newType }`. Since every key in `SOURCE_FIELD` is type-specific (e.g., `serverName` only belongs on MCP_REGISTRY, `containerId` only on CONTAINER, `runnerName` only on RUNNER), the spread leaks irrelevant keys onto the new type. The keys are invisible to the FE because all readers (`sourceValueFormatter`, `isValidSourceField`) branch on `$type`, but they do hit the wire on submit (`toolsets-api.ts:62, 66` posts the entity as-is). The fix is to drop the spread.

## Goals / Non-Goals

**Goals:**

- Switching source type in any entity-creation form leaves the form in a clean state — no stale validation entries, no leftover source-object keys.
- Same fix shape covers issue #3027 (Toolset MCP Registry → MCP Container) and the symmetric leak in container source-type swap (HF ↔ MCP via `externalRegistryRef`).
- Make the lifecycle invariants explicit in a spec so future sub-source components have a contract to follow.
- Tests cover both the unit-level cleanup behavior and the end-to-end form repro.

**Non-Goals:**

- No refactor of `SaveValidationContext` API or its existing `RemoveField` semantics.
- No general audit of every `dispatch(SetField)` in `Deployments/Fields/**`. Only the components that are conditionally rendered by a source-type selector are in scope; long-lived dispatchers stay where they are.
- No backend payload changes. The hygiene cleanup is purely client-side.
- No migration of `AppRunners.tsx` from `SetField(true)` to `RemoveField`. It already works and changing it adds risk without benefit.

## Decisions

**Decision 1: Use `ValidationActionType.RemoveField` for unmount cleanup, not `SetField(true)`.**

`SetField(true)` would silence the field but leave a phantom `true` entry in the map. `RemoveField` deletes the entry, which matches the lifecycle contract: the field exists exactly while its component is mounted. The reducer at `SaveValidationContext.tsx:51-63` already implements `RemoveField` correctly (recomputes `isValid` over the remaining entries).

Alternative considered: `SetField(true)` to mirror `AppRunners.tsx`. Rejected because future readers of the validation map (e.g. for showing per-field error summaries) would be misled by phantom `true` entries.

**Decision 2: Localize cleanup in the leaf components (`McpServerNameField`, `HFModelNameField`), not in the parents (`McpRegistry`, `ContainerSource`).**

Putting cleanup inside the leaf keeps the `dispatch`/`RemoveField` pair inside one file — the same effect that registers the field also tears it down. This is the same pattern as `AppRunners.tsx`. The alternative (dispatching `RemoveField` from `SourceField.onChangeSource` or `ContainerSource`'s switcher) couples the parent to every field name its children might register, which is fragile.

**Decision 3: Drop `...entity.source` from `onChangeSource` rather than selectively pruning keys.**

Selective pruning ("only drop registry keys when leaving MCP_REGISTRY") would require knowing which keys belong to which type, encoded in two places (the type system and the prune logic). Dropping the spread entirely lets the new `source` object start fresh with just `{ $type }`, and downstream sub-components populate the keys they actually need. Every key on `SOURCE_FIELD` is type-specific — there is no shared field that legitimately needs to carry across a switch.

Audit confirms no reader depends on a leftover key surviving a switch:
- `isValidSourceField` (`SourceField/utils.ts:18`) branches on `$type` first.
- `sourceValueFormatter` (`grid-columns/formatters.ts:95`) branches on `$type` first.
- `buildContainerSelection` default branch (`SourceField/utils.ts:65`) only spreads when entering CONTAINER from another path; with this fix the incoming `entity.source` will already be `{ $type: CONTAINER }` (no other keys), so the spread is a no-op.

**Decision 4: New spec capability `source-type-switch-cleanup`, not a delta to an existing spec.**

The bug isn't tied to one capability — it touches Toolsets, Models, Adapters, Interceptors, Applications, and the Container source-type form. A new capability spec captures the lifecycle invariants once, in one place, rather than repeating them across each entity's spec. Existing capabilities (`mcp-registry-toolsets`, `unified-container-source`, etc.) describe what each form does; this new one describes how all of them switch.

## Risks / Trade-offs

- **Risk:** A test that snapshots the entire validation map breaks because removed fields are now absent rather than present-and-true.
  → **Mitigation:** Run full vitest suite. The validation context is internal; existing tests assert on the submit-disabled state, not on map contents.

- **Risk:** Some external code path mutates `entity.source` while relying on `serverName`/`containerId` being present after a switch.
  → **Mitigation:** Grep on `source.serverName`, `source.containerId`, etc., shows readers only access these under a `$type` guard. Submit serializes the entity directly to the backend, which uses `$type` to discriminate.

- **Trade-off:** Two precedents now exist for cleanup (`SetField(true)` in AppRunners; `RemoveField` in this change). Future sub-source components could pick either.
  → **Mitigation:** The new `source-type-switch-cleanup` spec normatively requires `RemoveField` so future components have a clear contract.

- **Risk:** A sub-source component that reads its own `entity.source` shape on first render (e.g. `McpRegistry.tsx:25` derives `preselectedServer` from `serverName`) might break if the parent now passes `{ $type: 'mcp-registry' }` with no other keys.
  → **Mitigation:** Already the case — when the user first picks MCP Registry from a fresh form, `entity.source.serverName` is undefined and the components handle the empty case. Dropping the spread only changes the *re-entry* case (switch away and back), where users expect a clean form anyway.
