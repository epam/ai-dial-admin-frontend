## Context

The `ImageFields` component currently renders three divider-separated sections:
1. `ImageBase` (name, description, version fields)
2. `ImageSource` + `ImageTransport`
3. `ImageBuildPrivileges`

The updated design requires `ImageBuildPrivileges` to be grouped with the base fields, with only one divider separating the base group from the source group.

## Goals / Non-Goals

**Goals:**
- Move `ImageBuildPrivileges` into the same visual group as `ImageBase`
- Maintain a single divider between the base group and the source group

**Non-Goals:**
- Changing any component's internal logic or props
- Modifying the modal view behavior (ImageBuildPrivileges remains hidden in modals)

## Decisions

**Restructure the JSX layout in ImageFields.tsx**

Current structure uses `divide-y divide-primary` on the parent container with three children, producing two dividers. The new structure will place `ImageBuildPrivileges` right after `ImageBase` within the first section, before the divider, then `ImageSource` + `ImageTransport` after the divider.

This is a straightforward JSX reorganization with no architectural implications.

## Risks / Trade-offs

- Minimal risk: pure layout change with no logic modifications
- Test updates needed to verify the new grouping
