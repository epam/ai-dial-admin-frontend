# Fix: Startup probe toggle uses stale local state

**Issue**: [#2681](https://github.com/epam/ai-dial-admin-frontend/issues/2681)

## Problem

`ContainerStartupProbe.tsx` maintains a local `enabled` state (`useState(false)`) that shadows the actual probe enabled state from `container.probeProperties?.enabled`. This local state:

- Initializes to `false` regardless of the container's actual probe state
- Never syncs with the container prop after mount
- Is used in `onChangeEnabled` to compute the next toggle value

This causes the first toggle click to be a no-op when a container loads with an already-enabled probe, because the local state says `false` while the switch displays `true`.

## Solution

Remove the redundant `enabled` local state and derive the current value directly from `container.probeProperties?.enabled` in the `onChangeEnabled` handler.

## Scope

- **Single file**: `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerStartupProbe.tsx`
- Remove `const [enabled, setEnabled] = useState(false)`
- Update `onChangeEnabled` to read from `container.probeProperties?.enabled` instead of local state

## Non-goals

- Changing probe save/load behavior (backend is correct)
- Adding "reset to defaults" functionality
- Adding `probeProperties` to `ContainerRedeploySnapshot`
